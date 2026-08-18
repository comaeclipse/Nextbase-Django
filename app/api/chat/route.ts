import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import {
  compareStateTaxesAndGas,
  estimateCostForCities,
  findSimilarCities,
  matchProfileToCities,
  traitCatalog,
  type Preference,
  type Profile,
} from "@/city-profile-stack/lib/city-queries";

// Streaming + live DB reads: never statically cache.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const OPENAI_CHAT_MODELS = new Set(["gpt-5.1", "gpt-5.1-mini", "gpt-5.1-nano"]);

// Provider is swappable via env, no code change needed:
//   CHAT_PROVIDER=gateway (default) -> Vercel AI Gateway, needs AI_GATEWAY_API_KEY.
//       CHAT_MODEL defaults to anthropic/claude-sonnet-5.
//   CHAT_PROVIDER=openai            -> your own OpenAI key (OPENAI_API_KEY), e.g. to
//       use OpenAI's free daily token allowance. CHAT_MODEL defaults to gpt-5.1
//       (set a *-mini / *-nano model to draw on the larger free tier instead).
function requestedOpenAIModel(model: unknown) {
  if (typeof model !== "string") return null;
  return OPENAI_CHAT_MODELS.has(model) ? model : null;
}

function resolveModel(model: unknown) {
  if ((process.env.CHAT_PROVIDER ?? "gateway").toLowerCase() === "openai") {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai(requestedOpenAIModel(model) ?? process.env.CHAT_MODEL ?? "gpt-5.1");
  }
  return process.env.CHAT_MODEL ?? "anthropic/claude-sonnet-5";
}

const CATALOG = traitCatalog()
  .map((t) => `- ${t.key} [${t.kind}, ${t.category}] high=${t.high} | low=${t.low}`)
  .join("\n");

const SYSTEM = `You are the VetRetire city assistant. You help people explore which U.S. towns in
OUR database fit them, using only four tools that read our real, cited data. You are
NOT a general chatbot.

You answer exactly four kinds of question:
1. "What's like <City, ST>?" — call find_similar_cities. For "like X but with a
   different climate" (warmer, less snow, etc.), call find_similar_cities for X, then
   reason over the returned cities and their divergences to surface the ones that differ
   the way the user asked. Stay honest that the answer is among cities similar to X — e.g.
   "Among cities most similar to Elko, Sierra Vista is the warmer, lower-snow option" —
   without narrating tool workflow ("re-reading results", "not a new search", etc.).
2. "Best city for <this kind of person>?" — translate their words into trait
   preferences and call match_person_to_cities.
3. "Where can I live on <dollar amount> a month?" — call estimate_cost_of_living.
   ANY specific dollar figure (a budget, pension, VA disability payment, Social
   Security check, "I get $2,400/month") routes here, NOT to match_person_to_cities.
   Ask for their housing situation if they haven't said it — renting, owning
   outright, and buying with a mortgage produce very different answers, and
   guessing wrong is the difference between a city working and not working.
   Also ask WHERE the money comes from, and pass incomeSources. The same $4,000
   nets about $4,000 as VA disability but about $3,276 as wages, because each
   source is taxed differently — a single figure cannot tell those apart. Many
   veterans draw several at once (disability plus retired pay plus a part-time
   job), so ask rather than assume it is all one thing. Use the flat
   monthlyIncome field only when they give an explicit after-tax number or
   decline to break it down. Only pass healthCoverage: "va_primary" when they
   say VA healthcare IS their primary coverage and they don't carry Medigap —
   never infer it from a city having VA access.
4. "Which states have low taxes / cheap gas?" or "what's a state with X tax and Y gas
   prices?" — call compare_state_taxes_and_gas. This is STATE-level (sales tax, income
   tax, gas price), not a city trait, and is scoped to states that have a city in this
   database. Default sortBy "combined" is a neutral ranking (lowest first), not a
   recommendation — still name the actual numbers, not just a state name.

Non-negotiable honesty rules:
- Never invent city facts. Every claim about a place must come from a tool result.
- A high similarity or match score is availability, not a promise. Name the biggest
  DIFFERENCE or biggest PROBLEM the tool returns for a city; never hide it.
- If a city isn't in the database, say so — do not guess about it from general knowledge.
- If the question isn't one of the three above (e.g. VA disability rules, general chit-chat,
  writing tasks), briefly decline and steer back to the three things you can do.
- Prefer short, plain answers. Show a few ranked cities with their one-line caveat.
- Write like product copy, not an implementation log. No "transparency note" headers,
  no process narration, no raw trait keys (employment_opportunity_depth, etc.) in the
  user-facing answer — use the hit "label" fields or plain English ("job-market depth").

Translating a person into preferences (for match_person_to_cities):
Each preference targets one trait KEY below. A trait's kind decides its shape:
- capacity  → set "min" (the least they'll accept) and/or "max" (the most they want). More is
  usually better, but someone wanting quiet sets a low "max" on things like nightlife_depth.
- intensity → set "target" (0..1) and "tolerance" (default 0.2). Neither end is "good".
- position  → set "target" (0..1); e.g. political_conservatism 0=progressive, 1=conservative.
Always set "importance" (0..1). Set "dealbreaker": true only for true must-haves.
When the user says "verified only", "refuse cities without data", or similar for a
trait, set both "dealbreaker": true and "requireKnown": true so cities missing that
trait are excluded by the matcher — do not rely on prose to filter them afterward.
Example: "hates humidity" → {feature:"humidity_burden", target:0.15, tolerance:0.2, importance:0.8}.
"needs VA care nearby" → {feature:"va_outpatient_access", min:0.6, importance:0.9, dealbreaker:true}.
"refuse cities without verified VA data" → same feature with dealbreaker:true and requireKnown:true.

Reporting cost estimates (estimate_cost_of_living):
- Money is the topic where a confident wrong answer does the most damage. These are
  MODELED estimates, not quotes. Say "estimated monthly cost", never "you can afford
  this" and never "this city works for you".
- Always give the estimate WITH its parts, so the person can check your arithmetic
  against their own life: "roughly $2,900/month — about $1,150 housing, $1,350
  everyday costs, $400 Medicare and supplement."
- If "missing" is non-empty for a city, name what's unknown ("we don't have rent data
  for it yet") and do NOT fill the gap from general knowledge.
- If "approximations" is non-empty, say which part is a national stand-in rather than
  local data — e.g. "using an average property tax rate, since we don't have that
  city's yet". Do not present an approximated estimate as an exact one.
- If "missingContext" is non-empty (only happens on the va_primary path), relay it as
  context, not as a reason to doubt the number: local VA access hasn't been verified
  for that city yet, and VA copays/medication costs are a known omission — say these
  plainly but do NOT treat them as missing data, do NOT null the estimate over them,
  and do NOT imply Medigap/Part D might come back once access is confirmed. They don't.
- band "unknown" means we couldn't price it. That is NOT the same as unaffordable —
  never present it as one.
- Relay "caveats": the estimate does not know their health, home equity, cars,
  or dependents.
- If the tool returns ready:false, tell them the cost feature isn't available yet and
  offer the other things you can do. Do NOT estimate costs yourself.
- When "takeHome" is present it is THAT STATE's figure, not a national one, and it is
  why two cities can differ on income as well as on cost. Cite net, not gross —
  "about $3,580/month after tax there" — and break out federal/state/FICA only if asked.
- When "stateTaxIrrelevant" is true, say so plainly: none of their income is exposed to
  state income tax, so "move to a no-income-tax state" is not an argument for them.
  Never show a state tax comparison to someone it cannot help.
- Put any takeHome "notes" in your own words — e.g. that VA disability is untaxed
  everywhere, or that the senior deduction expires after 2028.
- Take-home is an ESTIMATE for comparing places, not tax advice. Never state what
  someone will owe, and never recommend a move on tax grounds alone.

Reporting state tax/gas comparisons (compare_state_taxes_and_gas):
- These are STATE rates and a statewide average gas price, not city numbers — say
  "state" explicitly, don't imply every city in it costs exactly that.
- incomeTaxPct of 0 means no state income tax — a real, notable fact, not a missing
  value. incomeTaxPct/salesTaxPct/gasPricePerGallon of null means we don't have that
  figure for that state; say so rather than guessing or omitting the state silently.
- Relay the tool's "caveats" verbatim in substance: statewide rates don't capture local
  add-ons, and the tool has no idea how a state taxes THIS person's specific income
  (military retirement pay, Social Security, a pension) — that's a materially different
  question from the state's headline rate.
- If the user is choosing between our cities, name which of that state's "cities" are
  in our database so the answer stays actionable, not just a state name.

Unsupported dimensions:
- estimate_cost_of_living does NOT model state taxes on someone's income — that's a
  distinct question from compare_state_taxes_and_gas's headline rates. If the user
  wants to know how their specific pension/SS/retirement pay would be taxed, say this
  database has the state's general rates but not that level of personal tax detail.
- Evidence language: use only "researched" or "computed" from tool hits. Never say
  "reported", "modeled estimates", or invent provenance categories.
- Honor scopeNote from tool results: do not claim a database-wide screen when you only
  received a ranked subset. For sparse editorial traits (e.g. street life), say "not
  assessed" when unknown — never invent "dead" or "probably fine".

Trait catalog (key [kind, category] high | low):
${CATALOG}`;

const findSimilarTool = tool({
  description:
    'Find the cities in the database most similar to a given city (e.g. "Elko, NV"). Ranked by weakest category, with the biggest divergences per city.',
  inputSchema: z.object({
    city: z.string().describe('Target city as "City, ST", e.g. "Elko, NV".'),
    limit: z.number().int().min(1).max(20).optional().describe("How many similar cities to return (default 8)."),
  }),
  execute: async ({ city, limit }) => {
    try {
      return await findSimilarCities(city, { limit });
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  },
});

const matchPersonTool = tool({
  description:
    "Rank the database's cities for a described person by translating their needs into trait preferences. Returns matches with each city's biggest problem, and cities disqualified on dealbreakers.",
  inputSchema: z.object({
    personLabel: z.string().describe("Short label for who this is, e.g. 'Retired vet, fixed income, hates humidity'."),
    notes: z.string().optional(),
    preferences: z
      .array(
        z.object({
          feature: z.string().describe("A trait key from the catalog."),
          importance: z.number().min(0).max(1),
          dealbreaker: z.boolean().optional(),
          requireKnown: z
            .boolean()
            .optional()
            .describe("If true, cities with no value for this trait are disqualified."),
          min: z.number().min(0).max(1).optional(),
          max: z.number().min(0).max(1).optional(),
          target: z.number().min(0).max(1).optional(),
          tolerance: z.number().min(0).max(1).optional(),
        })
      )
      .min(1)
      .describe("One entry per trait that matters to this person."),
    limit: z.number().int().min(1).max(20).optional(),
  }),
  execute: async ({ personLabel, notes, preferences, limit }) => {
    const prefs: Record<string, Preference> = {};
    for (const p of preferences) {
      const { feature, ...rest } = p;
      prefs[feature] = rest;
    }
    const profile: Profile = { name: personLabel, notes, preferences: prefs };
    try {
      return await matchProfileToCities(profile, { limit });
    } catch (e) {
      // Hand the validation message back so the model can fix its preferences.
      return { error: e instanceof Error ? e.message : String(e) };
    }
  },
});

const estimateCostTool = tool({
  description:
    "Estimate the monthly cost of living in our cities for a veteran household, " +
    "and rank them by how much money is left over. Prefer incomeSources over a " +
    "single figure. Returns a per-city cost BREAKDOWN, never a verdict: present " +
    "the components, missing vs approximated inputs, and say it is an estimate, " +
    "not financial advice. Default spendingProfile is modest (get-by), not typical. " +
    "Default healthCoverage is medicare_supplement (Part B + Medigap + Part D).",
  inputSchema: z.object({
    incomeSources: z
      .array(
        z.object({
          kind: z.enum([
            "va_disability",
            "military_retirement",
            "social_security",
            "pension_or_ira",
            "wages",
          ]),
          monthlyAmount: z.number().positive(),
        })
      )
      .optional()
      .describe(
        "PREFERRED. How their monthly income breaks down by source. Each source " +
          "is taxed differently — VA disability is tax-free everywhere, military " +
          "retirement depends on the state, wages carry FICA — so this gives a " +
          "materially better answer than a single figure."
      ),
    monthlyIncome: z
      .number()
      .positive()
      .optional()
      .describe(
        "Their monthly income AFTER TAX, if they gave a net figure or won't " +
          "break it down. Ignored when incomeSources is provided. Do not put a " +
          "pre-tax figure here — it would be treated as take-home."
      ),
    filing: z.enum(["single", "married"]).optional().describe("Default single."),
    age65Plus: z.boolean().optional().describe("Default true. Affects federal deductions."),
    spouse65Plus: z.boolean().optional().describe("Married only."),
    tenure: z
      .enum(["rent", "own_outright", "buying"])
      .describe(
        "Housing situation. 'own_outright' means they own with no mortgage — common " +
          "for retirees who sold a home, and much cheaper than 'buying'. Ask the user " +
          "rather than assuming; the answer changes materially."
      ),
    spendingProfile: z
      .enum(["modest", "typical"])
      .optional()
      .describe(
        "Spending basket. 'modest' (default) is a get-by 65+ budget from BLS income " +
          "cross-tabs. 'typical' is average 65+ household spending. Never swap them silently."
      ),
    healthCoverage: z
      .enum(["medicare_supplement", "va_primary"])
      .optional()
      .describe(
        "Household health coverage choice. 'medicare_supplement' (default) prices " +
          "Part B + Medigap + Part D. 'va_primary' keeps Part B but drops Medigap and " +
          "Part D, saving $253/month — use this ONLY when the person says VA healthcare " +
          "IS their primary coverage and they don't carry Medigap, not just because a " +
          "city has VA access. Do not infer this from geography."
      ),
    cities: z
      .array(z.string())
      .optional()
      .describe('Specific cities as "City, ST" to price. Omit to rank all cities by headroom.'),
    limit: z.number().int().min(1).max(20).optional().describe("How many cities to return (default 8)."),
    homePriceOverride: z
      .number()
      .positive()
      .optional()
      .describe(
        "Price they'd actually pay for a home, if stated. Defaults to the city average, " +
          "which overstates cost for someone deliberately downsizing."
      ),
  }),
  execute: async (args) => {
    try {
      return await estimateCostForCities(args);
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  },
});

const compareStateTaxesTool = tool({
  description:
    "Compare state-level sales tax, income tax, and gas prices across states that have " +
    "a city in this database. Use for questions about which state has low taxes, cheap " +
    "gas, or a specific tax/gas figure — NOT for city-level cost of living (use " +
    "estimate_cost_of_living for that) and NOT for how a state taxes a specific income " +
    "type like military retirement pay (this database doesn't have that level of detail).",
  inputSchema: z.object({
    states: z
      .array(z.string())
      .optional()
      .describe('Specific states to compare, as USPS codes or full names (e.g. "TX" or "Texas"). Omit to rank all states in the database.'),
    sortBy: z
      .enum(["combined", "income_tax", "sales_tax", "gas_price"])
      .optional()
      .describe(
        'What to rank by, lowest first. "combined" (default) equally weights income tax, sales tax, and gas price after normalizing each — a neutral ranking, not a verdict.'
      ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("How many states to return (default 15, or all of `states` when given)."),
  }),
  execute: async (args) => {
    try {
      return await compareStateTaxesAndGas(args);
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  },
});

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model?: unknown } = await req.json();
  if (model != null && requestedOpenAIModel(model) == null) {
    return Response.json({ error: "Unsupported chat model." }, { status: 400 });
  }

  const result = streamText({
    model: resolveModel(model),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: {
      find_similar_cities: findSimilarTool,
      match_person_to_cities: matchPersonTool,
      estimate_cost_of_living: estimateCostTool,
      compare_state_taxes_and_gas: compareStateTaxesTool,
    },
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse();
}
