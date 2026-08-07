/*
 * Generates the research-dossier request prompt from the live ontology.
 *
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs city-profile-stack/scripts/tools/generate-dossier-prompt.ts "Nashville, Tennessee" > prompt.md
 *
 * WHY THIS IS GENERATED RATHER THAN WRITTEN
 *
 * The first template was hand-maintained. Within two dossiers it was stale:
 * `winter_severity` was split into `winter_cold_severity` and `snow_burden`,
 * the template still listed the old key, and the returned dossier used a
 * feature that no longer existed. The import caught it — but only because a
 * validation check happened to exist. A hand-written vocabulary list will drift
 * from the ontology every single time the ontology changes, and the drift is
 * silent until something downstream breaks.
 *
 * Regenerating from FEATURES means the prompt cannot be wrong. Run it fresh for
 * every dossier request.
 */
import { FEATURES, type FeatureCategory } from "../../lib/ontology";

const city = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!city) {
  console.error('Usage: generate-dossier-prompt.ts "Nashville, Tennessee"');
  process.exit(1);
}

const CATEGORY_ORDER: FeatureCategory[] = [
  "climate",
  "environment",
  "access",
  "healthcare",
  "economy",
  "housing",
  "culture",
  "risk",
];

const KIND_RULES = `**value is 0.0-1.0 and its meaning depends on the feature's kind:**
- **capacity** — more is better for essentially everyone. 1.0 = abundant, 0.0 = absent.
- **intensity** — a magnitude that is neither good nor bad; some people seek it, others
  avoid it. 1.0 = very intense, 0.0 = absent. Score the magnitude, not whether you approve.
- **position** — a spectrum with a meaningful middle. 0.5 = genuinely mixed.`;

function vocabulary(): string {
  const lines: string[] = [];
  for (const category of CATEGORY_ORDER) {
    const group = FEATURES.filter((f) => f.category === category);
    if (group.length === 0) continue;
    lines.push(`**${category}**`);
    for (const f of group) {
      const tags = [f.kind, f.sensitive ? "sensitive" : null].filter(Boolean).join(", ");
      lines.push(`- \`${f.key}\` (${tags}) — 1.0 = ${f.high}; 0.0 = ${f.low}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

const sensitive = FEATURES.filter((f) => f.sensitive).map((f) => `\`${f.key}\``).join(", ");

console.log(`**TARGET CITY: ${city}**

You are producing a research dossier on the target city for a relocation-analysis
database. Other cities already have dossiers. Do not consult, imitate, or anchor on
them — this dossier must stand alone, and its value depends on being an independent
reading. Do not assume the target resembles other cities in its state or region.

Your source base is community discussion: Reddit primarily (local subreddit, state
subreddit, relocation threads, comparison threads), plus any first-hand resident accounts
you can locate. Where you use non-community sources (election results, a facility's own
website, state tax policy, municipal ordinances), label them differently via evidence_kind.

Return exactly three blocks, in this order, with nothing between them but the headings.

---

## BLOCK 1 — Narrative

Prose synthesis, 1,500–3,000 words, Markdown:

1. Two-paragraph opening: who likes this city and why; who dislikes it and why.
2. **How reliable is the picture?** — coverage strengths, and an explicit bulleted list of
   limitations (who is overrepresented, what gets blurred together, what changes fast,
   what topics the discourse handles badly).
3. **What people like** — bolded claim per paragraph.
4. **What people complain about** — bolded claim per paragraph.
5. **Versus nearby communities.**
6. **Versus [the obvious in-state comparison]** — the comparison locals actually make.
7. **Who would like it** / **Who may struggle.**
8. **The consensus in one sentence.**
9. **Sources** — flat list of URLs.

Rules:
- Where accounts contradict, say so and say which reading is better supported. Do not
  resolve a genuine disagreement into a single tidy claim.
- Where a theme appears but thinly, say it is under-sampled rather than dropping or inflating it.
- Attribute strong claims so evidence strength is visible in the prose.
- On race, addiction, homelessness, religion and politics: report what residents say, flag
  when the discourse itself is inflammatory, never generalize an account to the whole population.

---

## BLOCK 2 — Signals JSON

15–30 sourced observations. One JSON object:

\`\`\`json
{
  "city": "<City>",
  "state": "<Two-letter USPS abbreviation>",
  "signals": [
    {
      "key": "lowercase_snake_case_unique_within_this_city",
      "dimension": "access | amenities | community | commute | economy | growth | healthcare | housing | mobility | outdoors | weather",
      "polarity": "positive | caution | neutral",
      "strength": 1,
      "label": "Under ~60 characters, user-facing",
      "detail": "2-4 sentences. State the observation, its scope, and its limits. If accounts conflict, say so here.",
      "audience": "Who this actually matters to.",
      "geography_scope": "city | regional",
      "evidence_kind": "community_sentiment | community_sentiment_under_sampled | community_sentiment_requires_independent_verification | community_sentiment_and_state_policy | single_resident_account | municipal_policy_record | user_provided_facility_verification",
      "confidence": "limited | medium | high",
      "source_urls": ["https://..."],
      "source_retrieved_on": "YYYY-MM-DD"
    }
  ]
}
\`\`\`

- \`strength\` is an integer 1–5 — how loud and consistent the theme is, not how bad it is.
- \`polarity\` is \`neutral\` for descriptive context different people read differently
  (political lean, religious visibility, climate character). Reserve \`caution\` for things
  most readers would count against the place.
- \`confidence\`: \`limited\` for ordinary sentiment, \`medium\` when many independent accounts
  converge, \`high\` only for verifiable non-community facts.
- Every signal needs at least one real, working \`https://\` URL. Do not invent URLs. If you
  cannot source a theme, drop it and note it in gaps instead.

---

## BLOCK 3 — Features JSON

\`\`\`json
{
  "city": "<City>",
  "state": "<Two-letter USPS abbreviation>",
  "dossier_key": "reddit_sentiment_2026",
  "features": {
    "<feature_key_from_the_vocabulary_below>": {
      "value": 0.0,
      "confidence": 0.0,
      "evidence": "One or two sentences naming the specific finding that produced this number.",
      "signals": ["signal_key_from_block_2"]
    }
  },
  "gaps": ["Plain-language note for each thing the research could not establish"]
}
\`\`\`

### The rules that matter most

**1. Features describe the PLACE, never the people.** \`specialist_healthcare_access: 0.2\`
is a claim about the city. "bad for people with complex healthcare needs" is a claim about
people and must not appear as a feature. Persona language belongs in Block 1 prose only.

**2. Omit rather than guess.** If the research does not speak to a feature, leave it out.
A missing feature falls back to a structural estimate, which is the correct outcome. A
fabricated one silently corrupts the model. Expect to return roughly 25–40 features, not all ${FEATURES.length}.

**3. Use ONLY the keys listed below, spelled exactly.** The vocabulary changes as the
ontology evolves; this prompt was generated from the live ontology, so anything not listed
here does not exist. In particular there is no combined "winter_severity" — cold and snow
are separate features, because they vary independently.

**4. ${KIND_RULES}**

**5. \`confidence\` is 0.0–0.9 and measures EVIDENCE QUALITY, not how strongly the narrative
was worded.** A single vivid comment is 0.3–0.4 no matter how memorable. Many independent
accounts converging is 0.7–0.85. If accounts contradict each other, put the value mid-range
and the confidence low — that disagreement is the finding.

**6. Never round toward a stereotype.** If the evidence says this city's healthcare is
genuinely decent, say 0.7 even if that seems high for its size.

**7. Sensitive features** (${sensitive}): report what residents describe about the local
climate. Never state or imply anything about individual residents, and never use demographic
composition as a proxy for climate. Where the discourse is inflammatory, keep the value
mid-range, confidence at or below 0.45, and say why in \`evidence\`.

**8. \`evidence\` is required on every feature** and must name the specific finding, not
restate the feature label.

**9. Every key in a feature's \`signals\` array must exist in Block 2 AND must actually be
about that feature.** The two blocks are one artifact. If no Block 2 signal supports a
feature, that is not a citation problem — it means the research did not establish the
feature, so **OMIT IT** and put it in \`gaps\`. Never attach a loosely related signal to
satisfy this rule. A feature whose own \`evidence\` says the topic "was not directly
discussed" or "was not a developed theme" must not be scored at all; writing a number
anyway and citing an unrelated signal is the single worst failure mode for this dataset,
because it looks like evidence and is not.

### Feature vocabulary — use these keys exactly

${vocabulary()}
### Required coverage — search for these explicitly

Do not rely on whatever the general relocation threads happen to mention. Before writing
Block 2, run a **separate targeted search** for each of the following, because each is
structurally important and each is routinely absent from general "should I move here"
threads while being heavily discussed in its own dedicated threads:

1. **Climate** — summer heat, humidity, winter cold, snow, ice, storms, allergy season.
   Search terms like "<city> summer", "<city> winters", "<city> weather", "<city> humidity",
   "is the heat overexaggerated", "<city> snow". A city can have zero weather content in
   its relocation threads and a dozen dedicated climate threads.
2. **Healthcare** — hospital quality, specialist waits, where people travel for complex care.
3. **Safety** — searched by neighborhood, not as a citywide question.
4. **Cost vs. local wages** — not just "is it expensive" but "can people who work here afford here".
5. **Making friends / social integration** — usually its own thread genre.
6. **Schools** — if the city has families in it.

If a targeted search genuinely returns nothing, say so explicitly in \`gaps\` using the
\`searched_not_found\` form below. That is a real and useful finding. What is NOT useful is
silence that merely reflects which threads you happened to read.

### Finally — the gaps array, and why its wording matters

End Block 3 with a \`gaps\` array. Every entry must begin with one of these three prefixes,
because they mean completely different things and have previously been confused:

- \`not_researched:\` — this pass did not investigate the topic. Says nothing about the city.
- \`searched_not_found:\` — a targeted search was run and the community genuinely does not
  discuss this. A real finding about the source base.
- \`discussed_but_unscoreable:\` — the community discusses it, but the discourse is too
  inflammatory, contradictory, or thin to convert into a number responsibly.

Getting this wrong corrupts the database. A previous dossier omitted climate because the
research pass never asked about it; that was recorded as "the community does not discuss
climate", which was false and became a stored fact about the city. **Absence of a topic in
your dossier is evidence about your research, not about the community.**

The gaps list is as valuable as the features. Do not pad it and do not skip it.`);
