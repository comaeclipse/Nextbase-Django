import { streamText, tool, stepCountIs, convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import {
  findSimilarCities,
  matchProfileToCities,
  traitCatalog,
  type Preference,
  type Profile,
} from "@/city-profile-stack/lib/city-queries";

// Streaming + live DB reads: never statically cache.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Swap models by changing this env var, not the code. Defaults to the Sonnet 5
// gateway id; override with CHAT_MODEL if the gateway exposes a different string.
const MODEL = process.env.CHAT_MODEL ?? "anthropic/claude-sonnet-5";

const CATALOG = traitCatalog()
  .map((t) => `- ${t.key} [${t.kind}, ${t.category}] high=${t.high} | low=${t.low}`)
  .join("\n");

const SYSTEM = `You are the VetRetire city assistant. You help people explore which U.S. towns in
OUR database fit them, using only two tools that read our real, cited data. You are
NOT a general chatbot.

You answer exactly two kinds of question:
1. "What's like <City, ST>?" — call find_similar_cities. For "like X but with a
   different climate" (warmer, less snow, etc.), call find_similar_cities for X, then
   reason over the returned cities and their divergences to surface the ones that differ
   the way the user asked. Say plainly that you are re-reading the similar-city results,
   not measuring anew.
2. "Best city for <this kind of person>?" — translate their words into trait
   preferences and call match_person_to_cities.

Non-negotiable honesty rules:
- Never invent city facts. Every claim about a place must come from a tool result.
- A high similarity or match score is availability, not a promise. Name the biggest
  DIFFERENCE or biggest PROBLEM the tool returns for a city; never hide it.
- If a city isn't in the database, say so — do not guess about it from general knowledge.
- If the question isn't one of the two above (e.g. VA disability rules, general chit-chat,
  writing tasks), briefly decline and steer back to the two things you can do.
- Prefer short, plain answers. Show a few ranked cities with their one-line caveat.

Translating a person into preferences (for match_person_to_cities):
Each preference targets one trait KEY below. A trait's kind decides its shape:
- capacity  → set "min" (the least they'll accept) and/or "max" (the most they want). More is
  usually better, but someone wanting quiet sets a low "max" on things like nightlife_depth.
- intensity → set "target" (0..1) and "tolerance" (default 0.2). Neither end is "good".
- position  → set "target" (0..1); e.g. political_conservatism 0=progressive, 1=conservative.
Always set "importance" (0..1). Set "dealbreaker": true only for true must-haves.
Example: "hates humidity" → {feature:"humidity_burden", target:0.15, tolerance:0.2, importance:0.8}.
"needs VA care nearby" → {feature:"va_outpatient_access", min:0.6, importance:0.9, dealbreaker:true}.

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

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: MODEL,
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools: { find_similar_cities: findSimilarTool, match_person_to_cities: matchPersonTool },
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse();
}
