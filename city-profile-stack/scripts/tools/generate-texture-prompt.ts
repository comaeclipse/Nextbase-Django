/*
 * Generates the TEXTURE prompt — the one that goes after vibe rather than facts.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/generate-texture-prompt.ts "Elko, Nevada" "Atlanta, Georgia"
 *
 * The main dossier prompt (generate-dossier-prompt.ts) asks what a city HAS.
 * This asks what a city IS LIKE — the stuff no statistical database contains
 * and no relocation summary survives: that nothing is open past nine, that
 * people do yoga in the park while a band plays on the corner, that the whole
 * town shows up for a high-school football game, that every third car has a
 * kayak on it.
 *
 * Takes any number of cities, because dossiers are cheap and comparison across
 * cities is where texture becomes legible.
 */
import { FEATURES } from "../../lib/ontology";

const cities = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (cities.length === 0) {
  console.error('Usage: generate-texture-prompt.ts "Elko, Nevada" ["Atlanta, Georgia" ...]');
  process.exit(1);
}

const character = FEATURES.filter((f) => f.category === "character");
const vocab = character
  .map((f) => `- \`${f.key}\` (${f.kind}) — 1.0 = ${f.high}; 0.0 = ${f.low}`)
  .join("\n");

console.log(`**TARGET CITIES: ${cities.join(" · ")}**

I do not want a relocation summary. I have those. I want the **texture** of these
places — the specific, concrete, observable things that tell you what it is
actually like to be there, which never survive into a "pros and cons" list.

Your source is what residents actually say: Reddit local and state subreddits,
relocation and "what is it really like" threads, and especially the offhand
comments in threads about something else entirely. The best texture is usually
found sideways — somebody complaining about parking mentions that the whole
downtown shuts at eight, and *that* is the finding.

---

## What I am asking for

Concrete details, in residents' own words wherever possible. Examples of the
kind of thing that is useful:

- "There is no 24-hour anything. Not even a Waffle House."
- "People do yoga in the park while a jazz band plays on the corner."
- "Everybody waves from their truck. You will feel rude within a week."
- "Half the bumper stickers are for the same local brewery."
- "Nobody locks their side door and they think it is weird that I do."
- "You can tell who is new because they are the only ones wearing a coat."
- "The town shuts down for the high school game and I mean everything."
- "Every third car has a kayak or a dog or both."
- "There are more breweries than grocery stores and that is not a joke."

Examples of what is NOT useful, and which I will discard:

- "It has a vibrant arts scene." — generic, unfalsifiable, could be anywhere.
- "The people are friendly." — every city claims this. What do they *do*?
- "Great restaurants and outdoor recreation." — marketing copy.
- "Good quality of life." — means nothing.

**The test: could this sentence be true of two hundred other American cities?
If yes, throw it out.** I want the detail that is only true here, or is
unusually true here.

---

## BLOCK A — Texture markers

15–30 per city. JSON:

\`\`\`json
{
  "city": "<City>",
  "state": "<Two-letter USPS abbreviation>",
  "markers": [
    {
      "marker_key": "lowercase_snake_case_unique_within_this_city",
      "domain": "street_life | commerce | pace | social_norms | aesthetics | sound | ritual | food_culture | transport_habit | local_lore",
      "observation": "The concrete thing, one or two plain sentences. What would you SEE or NOTICE.",
      "verbatim": "The resident's own words, quoted exactly, if you found a good line. Null if not.",
      "salience": 3,
      "valence": "charming | grating | neutral | contested",
      "evidences": ["character_feature_key", "..."],
      "evidence_kind": "community_sentiment | single_resident_account | community_sentiment_under_sampled",
      "confidence": "limited | medium | high",
      "source_urls": ["https://..."],
      "source_retrieved_on": "YYYY-MM-DD"
    }
  ]
}
\`\`\`

Rules that matter:

- **\`verbatim\` is the most valuable field.** Quote residents exactly. Do not
  clean up their grammar, soften their profanity, or make it sound neutral.
  "It's dead as hell after 9" is better data than "limited evening activity."
- **\`salience\` 1–5** is how much this *defines* the place, not how vivid it is.
  A single beloved diner can be vivid and peripheral (2). Everything closing at
  nine is mundane and defining (5).
- **\`valence: contested\`** whenever residents split on whether it is charming or
  grating. That split is a finding — it is usually the exact thing that makes
  one person stay and another leave. Say who loves it and who hates it in the
  observation.
- **\`domain: sound\`** is under-used and worth hunting for. What does the place
  sound like — trains, cicadas, sirens, wind, nothing at all?
- **\`local_lore\`** means the stories residents tell about themselves. Local
  nicknames, running jokes, the thing everyone warns newcomers about, the
  event everyone references.
- Every marker needs a real \`https://\` source URL. Do not invent them.

---

## BLOCK B — Character scores

Score these from the markers you found. **Omit any you did not find real
evidence for** — an unscored feature is a correct outcome, an invented one
poisons the dataset.

\`\`\`json
{
  "city": "<City>",
  "state": "<Two-letter USPS abbreviation>",
  "features": {
    "<key from below>": {
      "value": 0.0,
      "confidence": 0.0,
      "evidence": "Which specific markers produced this number.",
      "markers": ["marker_key", "..."]
    }
  },
  "gaps": ["not_researched: ... | searched_not_found: ... | discussed_but_unscoreable: ..."]
}
\`\`\`

Values are 0.0–1.0. \`capacity\` means more is more of the thing; \`intensity\`
means a magnitude that is neither good nor bad — score the magnitude, not
whether you approve.

Confidence is 0.0–0.9 and measures **evidence quality**, not how strongly the
narrative was worded. One vivid comment is 0.3 no matter how memorable it is.
Many independent residents describing the same thing is 0.8.

### Character vocabulary — use these keys exactly

${vocab}

---

## Finally

If two or more cities are listed above, add a short **comparison** section at
the end: for each character feature where the cities genuinely differ, one
sentence naming the difference in concrete terms. Not "City A is more
walkable" — rather "In City A people are on the sidewalk at 10pm; in City B
the sidewalks are for getting from the car to the door."

And end with **the one detail per city that a visitor would notice in the first
hour and never see mentioned in any official description.**`);
