# Savannah, Georgia — Nanogenre Classification Proposal v1

Seventh genre-classification proposal produced through the PROMPT_TEMPLATE.md Block 4
process (after Victorville, Gilbert, Odessa, Cheyenne, North Platte and Grand
Junction). Delivered in the same research pass as the `reddit_sentiment_2026` dossier
(`savannah-ga.md`); this companion carries the official/structural evidence and the
measured-vs-experienced reconciliation that Blocks 1–3 deliberately exclude.

Savannah was selected deliberately as **corpus diversification**: the first coastal,
southeastern, tourism-intensive city, chosen to deflate the interior-regional-service-hub
family's 71% prevalence (see the Grand Junction proposal's recurrence note 1).

### Executive classification

| Level                  | Assignment                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| **Broad genres**       | Coastal Historic Tourism City · Port-Logistics Regional Hub · Arts-College-Influenced Small City |
| **Primary microgenre** | **Historic Coastal Port-and-Tourism Hub**                             |
| Secondary microgenre   | Arts-School-Influenced Heritage City                                  |
| Secondary microgenre   | Tourism-Intensive Small Regional Hub                                  |
| **Primary nanogenre**  | **Walkable-Historic-Core, Car-Dependent Coastal Port-Tourism City** (high confidence) |
| Secondary nanogenre    | Visitor-Core / Resident-City Split Heritage Hub (high confidence)     |
| Secondary nanogenre    | Arts-College-Inflected Coastal Port City (medium confidence)          |

**In one sentence:** Savannah is a historic coastal port city with an exceptionally
walkable, tourism-and-arts-dense core embedded in a more car-dependent regional economy
shaped by logistics, local-wage pressure and thinner big-metro service depth.

All labels are **proposals, not admissions** — per NANOGENRE_TAXONOMY.md §3 / §12
decision 1, a nanogenre needs 2 independently-researched cities before entering
`genre-ontology.ts` (3 for micro, 5 for broad). Savannah is currently the only city
carrying these exact labels.

**Recurrence notes for the next taxonomy review:**

1. **Corpus diversification worked as intended — and is not finished.** None of the
   interior-regional-service-hub family's vocabulary applies to Savannah; the family's
   prevalence falls from 5 of 7 (71%) to 5 of 8 (63%) — still far above the 40% broad
   cap, so more structurally different cities are needed before any broad admission.
2. **The falsification table quantifies the diversification.** 7 of 38 returned
   features were falsified (criterion |diff| ≥ 0.30) — the count rose from North
   Platte's 3 and Grand Junction's 5 precisely because propagation had no coastal,
   humid-subtropical or tourism-intensive neighbors to borrow from. The misses are the
   corpus's blind spots, not noise: humidity (0.33 predicted vs 0.93 — the humidity
   mirror of the borrowed-wind bias), tourism pressure (0.45 vs 0.88), historic-core
   walkability (0.55 vs 0.93 — the same feature that was Victorville's largest miss,
   in the opposite direction), borrowed interior winters (snow_burden 0.39 vs 0.03;
   winter_cold_severity 0.51 vs 0.16), Deep South urban politics (0.62 vs 0.30), and a
   single-source lumpy institutional fact (lgbtq_municipal_policy 0.20 vs 0.88).
   Propagation also predicted wind_exposure 0.69 for a city whose researcher could not
   find wind as a lived condition at all — the third borrowed-wind observation.
3. **The wage-housing squeeze appears again** (local_wage_adequacy 0.33; "Savannah
   costs too much for Savannah wages") — now **six of eight** classified cities.
   This reinforces the standing assessment that the squeeze is a trait, not a genre
   (§3 #3 reasonable-rarity failure); it stays in `local_wage_adequacy` /
   `housing_affordability` and out of genre labels.
4. **Two recurring divergence families each gain a fifth city.** Low-commute-versus-
   car-dependence (commute_burden 0.35 vs car_dependence 0.76; Census mean travel
   20.7 minutes) and amenity-existence-versus-depth (amenities punch above city size,
   yet nightlife/dating/professional depth thins fast) both recur in a city that is
   otherwise structurally alien to the prior four — strong evidence these families are
   genuinely general, not an interior-West artifact.
5. **The healthcare capacity-versus-navigability divergence gains a third city**
   (after North Platte and Grand Junction): an ACS-verified Level I trauma center and
   $3.09B in healthcare receipts coexist with healthcare_navigability 0.34.
6. **New candidate family: the visitor-core/resident-city split.** Savannah is the
   corpus's first city where tourism intensity is a defining structural force
   (tourism_pressure 0.88). The "Visitor-Core / Resident-City Split Heritage Hub"
   nano-secondary can only be tested against other historic tourism cities —
   Charleston is the obvious genre-neighbor comparison and remains unresearched.

## Reconciliation: measured vs. experienced

### 1. Is Savannah actually a small city or does it function like a larger regional center?

- **Measured:** The Census Bureau estimates 149,440 city residents in 2025, yet
  Savannah recorded about $4.57 billion in 2022 retail sales, $3.09 billion in
  healthcare and social-assistance receipts, $1.39 billion in accommodation/food sales
  and $1.33 billion in transportation/warehousing receipts.
  ([Census QuickFacts](https://www.census.gov/quickfacts/fact/table/savannahcitygeorgia/PST045224))
- **Experienced:** Residents repeatedly say Savannah has more restaurants,
  entertainment, visitors and activity than its population suggests, while also warning
  that specialized options repeat much faster than in Atlanta or another major metro.
  ([Reddit](https://www.reddit.com/r/howislivingthere/comments/1tg46p6/how_is_living_in_savannah_ga_debating_on_moving/))
- **Resulting trait:** Small-city population with regional-service and visitor-facing
  amenity intensity above its size, but without major-metro depth.

### 2. Is Savannah affordable?

- **Measured:** Census 2020-24 estimates put median gross rent at $1,382, median
  owner-occupied home value at $248,900 and median household income at $57,137. BLS
  reports a May 2025 Savannah-area mean wage of $28.24 per hour versus $33.54
  nationally.
  ([Census QuickFacts](https://www.census.gov/quickfacts/fact/table/savannahcitygeorgia/PST045224),
  [BLS Savannah OEWS](https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_savannah.htm))
- **Experienced:** Local renters strongly describe a wage-rent mismatch, while some
  arrivals from high-cost metros continue to view Savannah as relatively affordable.
  ([Reddit](https://www.reddit.com/r/savannah/comments/1qs751n/psa_fair_market_rents_2026_and_rental_help_2026/))
- **Resulting trait:** Moderate absolute housing costs paired with weak affordability
  relative to many locally earned wages; transplant affordability and resident
  affordability legitimately diverge.

### 3. Is Savannah primarily a tourist town or a working port city?

- **Measured:** BLS reports transportation/material-moving occupations at 13.1% of
  Savannah-area employment and food-preparation/service at 11.0%. A University of
  Georgia study for Georgia Ports reports that port activity supports 55,753 jobs in
  Chatham County — the most of any county — and describes Savannah as one of the
  nation's busiest container gateways.
  ([BLS Savannah OEWS](https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_savannah.htm),
  [Coastal Courier on the UGA ports study](https://coastalcourier.com/news/study-ports-back-7k-jobs-liberty/),
  [Georgia Ports press release](https://gaports.com/press-releases/georgia-ports-support-nearly-112000-jobs-in-coastal-region/))
- **Experienced:** Downtown discussions can make Savannah sound tourism-dominated,
  while job threads repeatedly name the port, logistics, Gulfstream, warehousing and
  manufacturing.
  ([Reddit](https://np.reddit.com/r/savannah/comments/um7reb/top_employers_in_the_area/))
- **Resulting trait:** A dual city: heritage tourism and arts dominate the visible
  central-city experience while logistics, port activity, aerospace and industry anchor
  a less-visible working regional economy.

### 4. Does Savannah have enough healthcare?

- **Measured:** Memorial Health University Medical Center operates the only American
  College of Surgeons-verified Level I trauma center in southeast Georgia, while Census
  data show more than $3.0 billion in local healthcare/social-assistance receipts in
  2022.
  ([GHA release on the ACS verification](https://gha.org/Portals/0/Documents/Newsroom/Hospital%20Happenings/0914Press%20Release%20re%20Memorial%20Health%20Earns%20Level%201%20Trauma%20Center%20verification%20from%20ACS%2009-12-23%20-%20FINAL.pdf),
  [Census QuickFacts](https://www.census.gov/quickfacts/fact/table/savannahcitygeorgia/PST045224))
- **Experienced:** Residents nevertheless describe trouble establishing primary care,
  getting offices to return calls and navigating referrals, while comparison
  discussions often give larger neighboring metros an advantage for specialty depth.
  ([Reddit](https://www.reddit.com/r/savannah/comments/1udq25g/doctors_offices_is_it_just_me/))
- **Resulting trait:** Substantial regional acute-care capacity coexisting with
  frustrating outpatient navigability and thinner complex-specialty depth than a major
  metro.

### 5. Is the famous summer climate exaggerated?

- **Measured:** NWS 1991-2020 normals for July show a 92.3°F average maximum, 73.7°F
  average minimum, 83.0°F mean temperature and about 24.6 days per July reaching at
  least 90°F. January normals are much milder at roughly 61.4°F average maximum and
  40.0°F average minimum. (Cited NWS SAV CLM product is a rotating URL; the normals
  were corroborated via the
  [NCEI API](https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&dataTypes=MLY-TMAX-NORMAL,MLY-TMIN-NORMAL&stations=USW00003822&format=json)
  for the Savannah airport station: Jan 61.4/40.0°F, Jul 92.3/73.7°F, Jul mean 83.0°F —
  all exact. The 24.6-days figure is not exposed by that endpoint and rests on the
  original retrieval.)
- **Experienced:** Residents often say thermometer heat is only part of the story:
  persistent humidity and mugginess are what force daily adaptation. Winter, by
  contrast, is commonly treated as a relocation advantage.
  ([Reddit](https://www.reddit.com/r/savannah/comments/x842px/),
  [Reddit](https://www.reddit.com/r/savannah/comments/1uttw0c/stay_cool_yall/))
- **Resulting trait:** A strongly summer-loaded climate burden: long hot conditions
  made more oppressive by lived humidity, balanced by mild winters.

### 6. Is Savannah socially progressive or traditionally Southern?

- **Measured:** Savannah's municipal unlawful-discrimination ordinance (§2-3066)
  explicitly protects sexual orientation and gender identity in employment, housing and
  public accommodations. At the broader county scale, official 2024 presidential
  results show Chatham County voting 82,758 for Harris and 57,336 for Trump; county
  results should not be mistaken for the preferences of every Savannah resident.
  ([City Code §2-3066](https://online.encodeplus.com/regs/savannah-ga/doc-viewer.aspx?secid=590),
  [HRC municipality profile](https://www.hrc.org/resources/municipalities/savannah-ga),
  [Chatham County 2024 results](https://en.wikipedia.org/wiki/Chatham_County,_Georgia))
- **Experienced:** Community threads repeatedly describe Savannah proper as more
  progressive than surrounding South Georgia while warning that the cultural
  environment changes outside the urban core.
  ([Reddit](https://www.reddit.com/r/howislivingthere/comments/1tg46p6/how_is_living_in_savannah_ga_debating_on_moving/))
- **Resulting trait:** A comparatively progressive municipal/county-centered civic
  environment embedded within a more politically and culturally mixed regional and
  state context; the geographic divergence is more accurate than either a simple
  "liberal" or "conservative" label.

### 7. Is Savannah easy to travel from despite its smaller size?

- **Measured:** Savannah/Hilton Head International currently lists nonstop service to
  major markets including Atlanta, Baltimore, Boston, Charlotte, Chicago and
  Washington, with some routes seasonal.
  ([SAV nonstop destinations](https://savannahairport.com/flights/airlines-nonstop-destinations/))
- **Experienced:** Residents appreciate having a nearby airport but sometimes cite
  direct-flight limitations as a downside compared with a hub city.
- **Resulting trait:** Better air connectivity than the city's population might imply,
  but still regional-airport rather than hub-level access.

## Gaps

- The proposed genre labels have only been tested against Savannah in this dossier;
  the taxonomy's minimum-membership thresholds still require independently researched
  comparison cities before any broad, micro or nano label can be admitted.
- The "Arts-School-Influenced Heritage City" component is strongly visible
  experientially, but this pass did not quantify SCAD's structural effect on housing,
  employment or population turnover well enough for very-high confidence.
- Savannah and Charleston appear to be an especially important genre-neighbor
  comparison, but Charleston was used here only as community comparison evidence and
  was not independently researched to the same structural standard.
- The visitor-core/resident-city split is strongly supported inside Savannah, but
  whether it is sufficiently nonredundant to justify its own nanogenre must be tested
  against other historic tourism cities.
- Block 4's reconciliation citations were delivered entirely as
  `:contentReference[oaicite]` placeholders (no URLs); every measured claim was
  independently re-verified during this pass and the citation URLs above were
  reconstructed from those verifications — all figures matched exactly.
