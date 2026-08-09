import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import {
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
OUR database fit them, using only three tools that read our real, cited data. You are
NOT a general chatbot.

You answer exactly three kinds of question:
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
- band "unknown" means we couldn't price it. That is NOT the same as unaffordable —
  never present it as one.
- Relay "caveats": the estimate does not know their health, home equity, cars,
  dependents, or how their state taxes their particular income.
- If the tool returns ready:false, tell them the cost feature isn't available yet and
  offer the other two things you can do. Do NOT estimate costs yourself.

Unsupported dimensions:
- There is NO tax / low-taxes trait, and estimate_cost_of_living does NOT model state
  taxes on someone's income. If the user asks to rank by low taxes, or asks whether a
  state will tax their pension or Social Security, decline that dimension and say it
  isn't something this database covers yet. You may offer housing or cost-of-living
  affordability only if you clearly label it as affordability, not taxes.
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
    "Estimate the monthly cost of living in our cities for someone on a fixed income, " +
    "and rank them by how much money is left over. Use this whenever the user gives a " +
    "specific dollar figure — a budget, pension, VA disability payment, or Social " +
    "Security check. Returns a per-city cost BREAKDOWN, not a verdict: present the " +
    "components and say it is an estimate. Does NOT model state income tax.",
  inputSchema: z.object({
    monthlyIncome: z.number().positive().describe("Their monthly income in dollars, e.g. 2400."),
    tenure: z
      .enum(["rent", "own_outright", "buying"])
      .describe(
        "Housing situation. 'own_outright' means they own with no mortgage — common " +
          "for retirees who sold a home, and much cheaper than 'buying'. Ask the user " +
          "rather than assuming; the answer changes materially."
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
    },
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse();
}
