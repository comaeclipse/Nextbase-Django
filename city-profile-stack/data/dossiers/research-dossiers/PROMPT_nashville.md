**TARGET CITY: Nashville, Tennessee**

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

```json
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
```

- `strength` is an integer 1–5 — how loud and consistent the theme is, not how bad it is.
- `polarity` is `neutral` for descriptive context different people read differently
  (political lean, religious visibility, climate character). Reserve `caution` for things
  most readers would count against the place.
- `confidence`: `limited` for ordinary sentiment, `medium` when many independent accounts
  converge, `high` only for verifiable non-community facts.
- Every signal needs at least one real, working `https://` URL. Do not invent URLs. If you
  cannot source a theme, drop it and note it in gaps instead.

---

## BLOCK 3 — Features JSON

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
  "gaps": ["Plain-language note for each thing the research could not establish"]
}
```

### The rules that matter most

**1. Features describe the PLACE, never the people.** `specialist_healthcare_access: 0.2`
is a claim about the city. "bad for people with complex healthcare needs" is a claim about
people and must not appear as a feature. Persona language belongs in Block 1 prose only.

**2. Omit rather than guess.** If the research does not speak to a feature, leave it out.
A missing feature falls back to a structural estimate, which is the correct outcome. A
fabricated one silently corrupts the model. Expect to return roughly 25–40 features, not all 50.

**3. Use ONLY the keys listed below, spelled exactly.** The vocabulary changes as the
ontology evolves; this prompt was generated from the live ontology, so anything not listed
here does not exist. In particular there is no combined "winter_severity" — cold and snow
are separate features, because they vary independently.

**4. **value is 0.0-1.0 and its meaning depends on the feature's kind:**
- **capacity** — more is better for essentially everyone. 1.0 = abundant, 0.0 = absent.
- **intensity** — a magnitude that is neither good nor bad; some people seek it, others
  avoid it. 1.0 = very intense, 0.0 = absent. Score the magnitude, not whether you approve.
- **position** — a spectrum with a meaningful middle. 0.5 = genuinely mixed.**

**5. `confidence` is 0.0–0.9 and measures EVIDENCE QUALITY, not how strongly the narrative
was worded.** A single vivid comment is 0.3–0.4 no matter how memorable. Many independent
accounts converging is 0.7–0.85. If accounts contradict each other, put the value mid-range
and the confidence low — that disagreement is the finding.

**6. Never round toward a stereotype.** If the evidence says this city's healthcare is
genuinely decent, say 0.7 even if that seems high for its size.

**7. Sensitive features** (`political_conservatism`, `lgbtq_municipal_policy`, `lgbtq_social_acceptance`, `religious_culture_prominence`, `racial_inclusion_climate`, `substance_problem_visibility`): report what residents describe about the local
climate. Never state or imply anything about individual residents, and never use demographic
composition as a proxy for climate. Where the discourse is inflammatory, keep the value
mid-range, confidence at or below 0.45, and say why in `evidence`.

**8. `evidence` is required on every feature** and must name the specific finding, not
restate the feature label.

**9. Every key in a feature's `signals` array must exist in Block 2.** The two blocks are
one artifact; a feature citing a signal you did not emit breaks the evidence chain.

### Feature vocabulary — use these keys exactly

**climate**
- `winter_cold_severity` (intensity) — 1.0 = Deep cold is a normal part of winter; sub-zero outbreaks happen; 0.0 = Winter afternoons are comfortable in a light jacket
- `snow_burden` (intensity) — 1.0 = Snow accumulates, persists, and shapes driving and daily planning; 0.0 = Snow is rare or melts within a day
- `summer_heat_severity` (intensity) — 1.0 = Summer heat materially limits daytime activity; 0.0 = Summers stay comfortable
- `humidity_burden` (intensity) — 1.0 = Warm-season air is muggy enough to be a daily consideration; 0.0 = Dry air; heat is felt as sun rather than mugginess
- `precipitation_seasonality` (position) — 1.0 = Summer-monsoon pattern: dry spring, dramatic late-summer storms; 0.0 = Cool-season pattern: wettest in winter and spring, drier late summer
- `winter_daylight_deficit` (intensity) — 1.0 = Midwinter days are short enough to shape mood and daily routine; 0.0 = Daylight stays long enough year-round to be a non-issue
- `outdoor_comfort_season` (capacity) — 1.0 = Most of the year is pleasant to spend outdoors; 0.0 = Heat, cold, or both confine people indoors for much of the year
- `climate_control_dependence` (intensity) — 1.0 = Comfort and safety depend on mechanical heating or cooling working; 0.0 = The climate is livable without much heating or cooling
- `wind_exposure` (intensity) — 1.0 = Persistent wind shapes driving, building upkeep, recreation, and mood; 0.0 = Wind is an occasional weather event, not a condition
- `severe_storm_risk` (intensity) — 1.0 = Hail, sudden storms, or violent weather are a property and insurance consideration; 0.0 = Severe weather is rare enough to ignore

**environment**
- `outdoor_recreation_access` (capacity) — 1.0 = Trails, water, mountains, or public land are reachable from town daily; 0.0 = Meaningful outdoor recreation requires a trip
- `public_land_access` (capacity) — 1.0 = Large tracts of federal or state land are open nearby for dispersed use; 0.0 = Surrounding land is private, developed, or access-restricted
- `natural_scenery` (capacity) — 1.0 = The surrounding landscape is a stated reason people stay; 0.0 = Surroundings are unremarkable or actively unattractive
- `water_recreation_access` (capacity) — 1.0 = Fishing, floating, paddling, or boating are available close to home; 0.0 = Water recreation requires a trip

**access**
- `geographic_isolation` (intensity) — 1.0 = The nearest large metro is a trip, not an errand; 0.0 = A large metro's services are routinely reachable
- `urban_amenity_depth` (capacity) — 1.0 = Restaurants, retail, services, and culture have real variety; 0.0 = Choices are few and repeat quickly
- `specialty_retail_access` (capacity) — 1.0 = Uncommon goods, parts, and services can be bought locally; 0.0 = Anything unusual is ordered online or bought out of town
- `major_airport_access` (capacity) — 1.0 = A hub airport is an easy drive; 0.0 = Air travel starts with a long drive or a connecting hop
- `car_dependence` (intensity) — 1.0 = Daily life is impractical without a reliable vehicle; 0.0 = Errands, work, and care are reachable without driving

**healthcare**
- `routine_healthcare_access` (capacity) — 1.0 = Primary care, urgent care, and pharmacies are easy to reach; 0.0 = Even routine care involves waits or travel
- `specialist_healthcare_access` (capacity) — 1.0 = Specialists and complex care are available without leaving the region; 0.0 = Specialist care means travelling to another metro
- `va_outpatient_access` (capacity) — 1.0 = A VA clinic handles routine visits close to home; 0.0 = Routine VA care requires a long drive
- `va_hospital_access` (capacity) — 1.0 = A VA medical center — not just a clinic — is within reasonable reach; 0.0 = VA hospital services are far away

**economy**
- `employment_opportunity_depth` (capacity) — 1.0 = Many employers hire across many roles; 0.0 = Openings are few and turn over slowly
- `employment_diversity` (capacity) — 1.0 = No single industry dominates the local economy; 0.0 = One industry drives most local income and its cycles hit everyone
- `high_wage_trade_opportunity` (capacity) — 1.0 = Skilled trades and industrial work pay well above the local cost base; 0.0 = Trade work pays at or below what the local cost base demands
- `remote_work_viability` (capacity) — 1.0 = Connectivity and services support working remotely full time; 0.0 = Infrastructure or isolation makes remote work fragile
- `commute_burden` (intensity) — 1.0 = Typical work trips consume a large share of the day; 0.0 = Getting to work is short and predictable
- `local_wage_adequacy` (capacity) — 1.0 = Ordinary local jobs cover ordinary local costs; 0.0 = Local pay does not keep up with local housing and living costs
- `tourism_pressure` (intensity) — 1.0 = Visitor volume shapes traffic, housing, wages, and the rhythm of the year; 0.0 = Tourism is not a factor in daily life
- `growth_pressure` (intensity) — 1.0 = Rapid in-migration or development is outpacing housing and infrastructure; 0.0 = The place is stable; what is there now is roughly what will be there
- `economic_cycle_exposure` (intensity) — 1.0 = Employment, housing, and local confidence swing with a commodity cycle; 0.0 = The local economy is insulated from any single market cycle

**housing**
- `housing_affordability` (capacity) — 1.0 = Housing is cheap relative to the national picture; 0.0 = Housing costs are steep in absolute terms
- `housing_value_for_size` (capacity) — 1.0 = Housing is cheap for a place this size — the expected small-town discount is real; 0.0 = Housing costs far more than a town this size normally would
- `rental_availability` (capacity) — 1.0 = Rentals can be secured without a wait; 0.0 = Waiting lists and competition make arriving without a lease risky

**culture**
- `political_conservatism` (position, sensitive) — 1.0 = Strongly conservative; 0.0 = Strongly progressive
- `lgbtq_municipal_policy` (capacity, sensitive) — 1.0 = City ordinances, employment policy and services are protective; 0.0 = No municipal protections beyond what the state requires
- `lgbtq_social_acceptance` (capacity, sensitive) — 1.0 = Residents report an accepting day-to-day social climate; 0.0 = Residents report having to seek out compatible circles deliberately
- `family_infrastructure` (capacity) — 1.0 = Schools, youth sports, extracurriculars, and safe independence for kids are all present; 0.0 = Families have to assemble these themselves or drive for them
- `religious_culture_prominence` (intensity, sensitive) — 1.0 = Churches and religious norms occupy a visible place in community life; 0.0 = Religion is largely a private matter locally
- `racial_inclusion_climate` (capacity, sensitive) — 1.0 = Residents of color report an unremarkable, welcoming day-to-day experience; 0.0 = Residents of color report recurring hostility or exclusion
- `social_integration_ease` (capacity) — 1.0 = Newcomers find friends without an existing connection; 0.0 = Social networks are established, interconnected, and slow to open
- `social_anonymity` (intensity) — 1.0 = You can live privately; reputation does not travel; 0.0 = Everyone knows everyone and a conflict follows you
- `alcohol_centered_social_scene` (intensity) — 1.0 = Bars, casinos, or drinking are the default way people socialize; 0.0 = Plenty of social life happens without alcohol at the center
- `nightlife_depth` (capacity) — 1.0 = Evenings offer real variety; 0.0 = Evening options are few and repeat
- `dating_pool_depth` (capacity) — 1.0 = A large, varied pool of single adults; 0.0 = Small and socially interconnected
- `cultural_distinctiveness` (intensity) — 1.0 = The place has a strong identity of its own, not a generic template; 0.0 = Culturally interchangeable with anywhere else

**risk**
- `perceived_everyday_safety` (capacity) — 1.0 = Residents describe ordinary daily life as feeling safe; 0.0 = Residents describe daily caution as necessary
- `trailing_spouse_isolation_risk` (intensity) — 1.0 = A partner who moves without their own job or network is likely to end up isolated; 0.0 = A non-working partner can build a life independently
- `substance_problem_visibility` (intensity, sensitive) — 1.0 = Addiction and related social problems are visible in daily life; 0.0 = Not a commonly raised local concern

### Finally

End Block 3 with a `gaps` array naming everything the research could not establish —
neighborhood-level detail, school quality, current housing prices, any under-sampled theme,
and any topic where the discourse was too unreliable to score. The gaps list is as valuable
as the features; do not pad it and do not skip it.
