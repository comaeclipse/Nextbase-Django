# Dossier request prompt template

Paste everything below the line into ChatGPT (or any research model), changing only
the **TARGET CITY** line. Output maps directly onto `city-profile-stack/scripts/import/import-research-dossiers.ts`,
`city-profile-stack/scripts/import/import-location-profile-signals.ts` and `city-profile-stack/scripts/import/import-location-features.ts`.

**Do not paste predicted feature values into the prompt.** Predictions from
`city-profile-stack/scripts/tools/rank-dossier-candidates.ts --predict` exist to be falsified by the returned
dossier; showing them to the research model destroys the test.

**Block 4 is new** (added after the Casper nanogenre prototype, `casper-wy-nanogenre-prototype-v0-1.md`):
a genre-classification proposal governed by `city-profile-stack/docs/NANOGENRE_TAXONOMY.md`. It asks
for a broader source base than Blocks 1-3 (official statistics and institutional sources, not just
community discussion) because the reconciliation table it produces only works if there is real
*measured* evidence to reconcile *against* the community sentiment already gathered in Blocks 1-3.

---

**TARGET CITY: Billings, Montana**

You are producing a research dossier on the target city for a relocation-analysis
database. The database already holds dossiers for Atlanta GA, Bangor ME, Billings MT,
Casper WY, Elko NV, Nashville TN, Rapid City SD, and Sierra Vista AZ.
Do not consult, imitate, or anchor on those cities — this dossier must stand alone, and
its value depends on it being an independent reading. Do not assume the target resembles
other cities in its state or region.

Your source base is community discussion: Reddit primarily (local subreddit, state
subreddit, relocation threads, comparison threads), plus any first-hand resident accounts
you can locate. Where you use non-community sources (election results, a facility's own
website, state tax policy), label them differently — see `evidence_kind` below.

Return exactly four blocks, in this order, with nothing between them but the headings.

---

## BLOCK 1 — Narrative

A prose synthesis, 1,500–3,000 words, in Markdown, with these sections:

1. A two-paragraph opening: who likes this city and why; who dislikes it and why.
2. **How reliable is the picture?** — coverage strengths, and an explicit bulleted list of
   limitations (who is overrepresented, what gets blurred together, what changes fast,
   what topics the discourse handles badly).
3. **What people like** — bolded claim per paragraph.
4. **What people complain about** — bolded claim per paragraph.
5. **Versus nearby communities** — adjacent towns treated as part of the metro, and how they differ.
6. **Versus [the obvious in-state comparison]** — the comparison locals actually make.
7. **Who would like it** / **Who may struggle** — prose lists.
8. **The consensus in one sentence.**
9. **Sources** — flat list of URLs.

Rules for the narrative:

- Where accounts contradict each other, say so and say which reading is better supported.
  Do not resolve a genuine disagreement into a single tidy claim.
- Where a theme appears but thinly, say it is under-sampled rather than dropping or inflating it.
- Attribute strong claims ("one resident described…", "commenters repeatedly…") so strength
  of evidence is visible in the prose itself.
- On race, addiction, homelessness, religion and politics: report what residents say,
  flag when the discourse itself is inflammatory or prejudiced, and never generalize an
  account to the whole population.

---

## BLOCK 2 — Signals JSON

Human-readable, sourced observations. 15–30 of them. Emit a single JSON object:

```json
{
  "city": "<City>",
  "state": "<Two-letter USPS abbreviation>",
  "signals": [
    {
      "key": "lowercase_snake_case_unique_within_this_city",
      "dimension": "one of: access | amenities | community | commute | economy | growth | healthcare | housing | mobility | outdoors | weather",
      "polarity": "positive | caution | neutral",
      "strength": 1,
      "label": "Under ~60 characters, user-facing",
      "detail": "2–4 sentences. State the observation, its scope, and its limits. If accounts conflict, say so here.",
      "audience": "Who this actually matters to. Optional but strongly preferred.",
      "geography_scope": "city | regional",
      "evidence_kind": "community_sentiment | community_sentiment_under_sampled | community_sentiment_requires_independent_verification | community_sentiment_and_state_policy | single_resident_account | precinct_results_and_community_sentiment | user_provided_facility_verification",
      "confidence": "limited | medium | high",
      "source_urls": ["https://..."],
      "source_retrieved_on": "YYYY-MM-DD"
    }
  ]
}
```

Hard requirements:

- `strength` is an integer 1–5 — how loud and consistent the theme is, not how bad it is.
- `polarity` is `neutral` for descriptive context that different people will read
  differently (political lean, religious visibility, climate character). Reserve `caution`
  for things a majority of readers would count against the place.
- `confidence` is `limited` for ordinary Reddit sentiment, `medium` when many independent
  accounts converge, `high` only for verifiable non-community facts (state tax policy, a
  named facility's published location).
- Every signal needs at least one real, working `https://` URL. Do not invent URLs. If you
  cannot source a theme, drop it and note it in the gaps list instead.

---

## BLOCK 3 — Features JSON

The quantified layer. Emit a single JSON object:

```json
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
  "gaps": [
    "Plain-language note for each thing the research could not establish"
  ]
}
```

### The rules that matter most

**1. Features describe the PLACE, never the people.** `specialist_healthcare_access: 0.2`
is a claim about the city. "bad for people with complex healthcare needs" is a claim about
people and must not appear as a feature. Persona language belongs in Block 1 prose only.

**2. Omit rather than guess.** If the research does not speak to a feature, leave it out.
A missing feature falls back to a structural estimate, which is the correct outcome. A
fabricated one silently corrupts the model. Expect to return roughly 25–40 features, not all 45.

**3. `value` is 0.0–1.0 and its meaning depends on the feature's `kind`:**
- **capacity** — more is better for essentially everyone. 1.0 = abundant, 0.0 = absent.
- **intensity** — a magnitude that is neither good nor bad; some people seek it, others
  avoid it. 1.0 = very intense, 0.0 = absent. Score the magnitude, not whether you approve.
- **position** — a spectrum with a meaningful middle. 0.5 = genuinely mixed.

**4. `confidence` is 0.0–0.9 and measures EVIDENCE QUALITY, not how strongly the narrative
was worded.** A single vivid comment is 0.3–0.4 no matter how memorable. Many independent
accounts converging is 0.7–0.85. If the researched accounts contradict each other, put the
value mid-range and the confidence low — that disagreement is the finding.

**5. Never round toward a stereotype.** If the evidence says this city's healthcare is
genuinely decent, say 0.7 even if that seems high for its size. Do not adjust a value to
seem plausible for the region.

**6. Sensitive features** (`political_conservatism`, `lgbtq_municipal_policy`,
`lgbtq_social_acceptance`, `religious_culture_prominence`, `racial_inclusion_climate`,
`substance_problem_visibility`): report what residents describe about the local climate.
Never state or imply anything about individual residents, and never use demographic
composition as a proxy for climate. Where the discourse is inflammatory, keep the value
mid-range, keep confidence at or below 0.45, and say why in `evidence`.

**7. `lgbtq_municipal_policy` and `lgbtq_social_acceptance` are different questions.**
Policy is ordinances, city employment rules and services. Acceptance is what daily life
feels like. A city can score high on one and low on the other. Only fill `lgbtq_municipal_policy`
if you find actual policy evidence.

**8. `evidence` is required on every feature** and must name the specific finding, not
restate the feature label.

### Feature vocabulary — use these keys exactly

**environment**
- `outdoor_recreation_access` (capacity) — 1.0 = trails, water, mountains or public land reachable daily; 0.0 = recreation requires a trip
- `public_land_access` (capacity) — 1.0 = large federal/state tracts open nearby for dispersed use; 0.0 = surrounding land private or access-restricted
- `natural_scenery` (capacity) — 1.0 = the landscape is a stated reason people stay; 0.0 = unremarkable or unattractive
- `winter_severity` (intensity) — 1.0 = cold, snow and winter driving define the year; 0.0 = winter is a non-event
- `summer_heat_severity` (intensity) — 1.0 = heat materially limits daytime activity; 0.0 = summers stay comfortable
- `humidity_burden` (intensity) — 1.0 = warm-season air is muggy daily; 0.0 = dry air
- `wind_exposure` (intensity) — 1.0 = persistent wind shapes driving, upkeep, recreation and mood; 0.0 = wind is an occasional event
- `severe_storm_risk` (intensity) — 1.0 = hail or violent storms are a property and insurance consideration; 0.0 = rare enough to ignore
- `water_recreation_access` (capacity) — 1.0 = fishing, floating, paddling or boating close to home; 0.0 = requires a trip

**access**
- `geographic_isolation` (intensity) — 1.0 = the nearest large metro is a trip, not an errand; 0.0 = metro services routinely reachable
- `urban_amenity_depth` (capacity) — 1.0 = restaurants, retail, services and culture have real variety; 0.0 = choices few and repeat quickly
- `specialty_retail_access` (capacity) — 1.0 = uncommon goods, parts and services available locally; 0.0 = anything unusual is ordered or bought out of town
- `major_airport_access` (capacity) — 1.0 = a hub airport is an easy drive; 0.0 = air travel starts with a long drive or connecting hop
- `car_dependence` (intensity) — 1.0 = daily life impractical without a vehicle; 0.0 = errands, work and care reachable without driving

**healthcare**
- `routine_healthcare_access` (capacity) — 1.0 = primary care, urgent care and pharmacies easy to reach; 0.0 = even routine care means waits or travel
- `specialist_healthcare_access` (capacity) — 1.0 = specialists and complex care available without leaving the region; 0.0 = specialist care means another metro
- `va_outpatient_access` (capacity) — 1.0 = a VA clinic handles routine visits close to home; 0.0 = routine VA care is a long drive
- `va_hospital_access` (capacity) — 1.0 = a VA medical center, not just a clinic, is within reach; 0.0 = VA hospital services are far away

**economy**
- `employment_opportunity_depth` (capacity) — 1.0 = many employers hiring across many roles; 0.0 = few openings, slow turnover
- `employment_diversity` (capacity) — 1.0 = no single industry dominates; 0.0 = one industry drives most income and its cycles hit everyone
- `high_wage_trade_opportunity` (capacity) — 1.0 = skilled trades pay well above the local cost base; 0.0 = trade work pays at or below it
- `remote_work_viability` (capacity) — 1.0 = connectivity and services support full-time remote work; 0.0 = infrastructure or isolation makes it fragile
- `commute_burden` (intensity) — 1.0 = typical work trips consume a large share of the day; 0.0 = short and predictable
- `local_wage_adequacy` (capacity) — 1.0 = ordinary local jobs cover ordinary local costs; 0.0 = local pay does not keep up with local costs
- `tourism_pressure` (intensity) — 1.0 = visitor volume shapes traffic, housing, wages and the rhythm of the year; 0.0 = not a factor
- `growth_pressure` (intensity) — 1.0 = in-migration or development outpacing housing and infrastructure; 0.0 = stable
- `economic_cycle_exposure` (intensity) — 1.0 = employment, housing and confidence swing with a commodity cycle; 0.0 = insulated from any single cycle

**housing**
- `housing_affordability` (capacity) — 1.0 = cheap relative to the national picture; 0.0 = steep in absolute terms
- `housing_value_for_size` (capacity) — 1.0 = cheap for a place this size, the small-town discount is real; 0.0 = costs far more than a place this size normally would
- `rental_availability` (capacity) — 1.0 = rentals secured without a wait; 0.0 = waiting lists make arriving without a lease risky

**culture**
- `political_conservatism` (position, sensitive) — 1.0 = strongly conservative; 0.5 = genuinely mixed; 0.0 = strongly progressive
- `lgbtq_municipal_policy` (capacity, sensitive) — 1.0 = ordinances, employment policy and services are protective; 0.0 = no municipal protections beyond state law
- `lgbtq_social_acceptance` (capacity, sensitive) — 1.0 = residents report an accepting day-to-day climate; 0.0 = residents report having to seek out compatible circles
- `family_infrastructure` (capacity) — 1.0 = schools, youth sports, extracurriculars and safe independence for kids all present; 0.0 = families assemble or drive for these
- `religious_culture_prominence` (intensity, sensitive) — 1.0 = churches and religious norms visibly present in community life; 0.0 = religion is largely private
- `racial_inclusion_climate` (capacity, sensitive) — 1.0 = residents of color report an unremarkable, welcoming experience; 0.0 = residents of color report recurring hostility or exclusion
- `social_integration_ease` (capacity) — 1.0 = newcomers find friends without an existing connection; 0.0 = networks established, interconnected and slow to open
- `social_anonymity` (intensity) — 1.0 = you can live privately, reputation does not travel; 0.0 = everyone knows everyone
- `alcohol_centered_social_scene` (intensity) — 1.0 = bars, casinos or drinking are the default way people socialize; 0.0 = plenty of social life without alcohol at the center
- `nightlife_depth` (capacity) — 1.0 = evenings offer real variety; 0.0 = few options that repeat
- `dating_pool_depth` (capacity) — 1.0 = large, varied pool of single adults; 0.0 = small and socially interconnected
- `cultural_distinctiveness` (intensity) — 1.0 = a strong identity of its own; 0.0 = interchangeable with anywhere else

**risk**
- `perceived_everyday_safety` (capacity) — 1.0 = residents describe ordinary daily life as feeling safe; 0.0 = residents describe daily caution as necessary
- `trailing_spouse_isolation_risk` (intensity) — 1.0 = a partner moving without their own job or network likely ends up isolated; 0.0 = a non-working partner can build a life independently
- `substance_problem_visibility` (intensity, sensitive) — 1.0 = addiction and related problems visible in daily life; 0.0 = not a commonly raised local concern

### Finally

End Block 3 with a `gaps` array naming everything the research could not establish —
neighborhood-level detail, school quality, current housing prices, any theme that was
under-sampled, and any topic where the discourse was too unreliable to score. The gaps
list is as valuable as the features; do not pad it and do not skip it.

---

## BLOCK 4 — Genre classification proposal

Blocks 1-3 are community-sentiment evidence. This block additionally requires
**official/structural evidence** — Census/ACS, BLS, NWS climate normals, FAA/DOT where
relevant, and the city's own planning documents — because the reconciliation table below
only works if there is real measured evidence to check the community sentiment against.
Cite every structural figure with a source URL, same as Blocks 1-3.

Governed by `city-profile-stack/docs/NANOGENRE_TAXONOMY.md`. Read that document's §1-3
(what a genre is, the three-level hierarchy, and the six admission rules) before writing
this block — do not invent a genre label without checking it against all six criteria.

Emit a single JSON object:

```json
{
  "city": "<City>",
  "state": "<Two-letter USPS abbreviation>",
  "genre_classification_proposed": {
    "broad": ["<0-4 broad-genre labels this city plausibly belongs to>"],
    "micro_primary": "<the single best-fit microgenre label>",
    "micro_secondary": ["<0-3 additional microgenre labels — multi-label membership is expected, not an error>"],
    "nano_primary": { "label": "<the single best-fit nanogenre label>", "confidence": "very_high | high | medium | low" },
    "nano_secondary": [
      { "label": "<additional nanogenre label>", "confidence": "very_high | high | medium | low" }
    ],
    "one_sentence_description": "<the whole classification compressed into one sentence a resident would recognize>"
  },
  "reconciliation": [
    {
      "question": "<a plain-language question the classification depends on, e.g. 'Is there anything to do?'>",
      "measured_evidence": "<what the official/structural sources say, with citation>",
      "experienced_evidence": "<what community sentiment says, with citation>",
      "resulting_trait": "<the reconciled trait — do NOT average or pick a winner if they diverge; name the divergence itself if there is one>"
    }
  ],
  "gaps": [
    "Anything the classification could not establish, same spirit as Block 3's gaps list."
  ]
}
```

Rules that matter most:

1. **A genre label here is a proposal, not an admission.** Per NANOGENRE_TAXONOMY.md §3 /
   §12 decision 1, a nanogenre needs 2 independently-researched cities before it enters
   the real taxonomy (3 for microgenre, 5 for broad genre). Do not claim or imply this
   city's labels are already part of an approved taxonomy — they are this city's evidence-based
   candidate, to be compared against other cities' proposals later.
2. **Hold divergence, don't average it.** If measured and experienced evidence disagree
   (e.g. an active events calendar vs. residents calling nightlife thin), both sides of
   `reconciliation` must stay visible in `resulting_trait` as a named divergence — never
   collapse it into a single tidy score. This is the single most valuable output of this
   block; do not smooth it away for a cleaner-looking table.
3. **A genre bundle, not a checklist match.** A genre label is defensible only if it names
   a *recurring co-occurring bundle* of traits with real explanatory value — "why this city
   feels the way it does," not a restatement of one Block 3 feature. If a distinction is
   real but doesn't rise to a bundle, it belongs in Block 3 as a feature, not here as a genre.
4. **Confidence reflects evidence strength, same discipline as Block 3.** `very_high` needs
   multiple independent measured *and* experienced sources agreeing; `low` means one thin
   or contested source drove the label.
