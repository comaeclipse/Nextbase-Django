# Florence, Alabama source notes

Retrieved: 2026-08-06

## Identity and geography

- Geography: Florence city, Lauderdale County, Alabama; Census place GEOID `0126896`.
- Population: 42,716 (Census July 1, 2024 estimate). 2020 land area is 26.52 square miles, producing a stored density of 1,611 people per square mile (42,716 / 26.52, rounded).
- Sources:
  - https://www.census.gov/quickfacts/fact/table/florencecityalabama/LND110220
  - https://www.census.gov/programs-surveys/geography/guidance/geo-identifiers.html

## Housing and cost of living

- Housing field: `$216,121`, Zillow's citywide June 30, 2026 Zillow Home Value Index (ZHVI) / typical home value. It is **not** a median sale price or an average of listings.
- Zillow also reported a May 2026 median sale price of $203,717, a June median list price of $287,067, 291 for-sale listings, 14.8% of sales above list, and 18 median days to pending. These are retained in these notes rather than added to the legacy city row because the schema currently has only one citywide home-value field.
- User-provided 2701 Milford St. history is intentionally not written as a citywide value: its August 2026 Zestimate of $339,300 and listing changes describe one 3,500-square-foot property, not Florence's market.
- Cost of living: Apartments.com reports Florence 16.8% below the national average in data published June 2026. Stored as `CostOfLiving=83` (100 - 16.8, rounded), with the product's `Low` category derived by the importer. Apartments.com states that its analysis uses C2ER's Cost of Living Index and quarterly updates.
- Sources:
  - https://www.zillow.com/home-values/11455/florence-al/
  - https://www.zillow.com/research/zhvi-user-guide/
  - https://www.apartments.com/cost-of-living/florence-al/

## Taxes, VA access, and veterans benefits

- Sales tax: Florence's minimum combined 2026 general sales-tax rate is 9.50%; stored as `9.50`. Alabama's top marginal individual income-tax rate is 5.00%; stored as `5.00`.
- Veterans benefits: Alabama Department of Revenue lists military retirement pay as exempt from Alabama income tax. The summary is intentionally brief; the state-level table remains the source of detailed benefit eligibility.
- VA: the Florence VA Clinic is an outpatient clinic at 410 Cox Boulevard, Sheffield, AL. Its straight-line distance from the Florence place centroid to the facility address is approximately four miles, so `VA=Yes` and `DistanceToVA=4 miles` are stored. This is an approximate straight-line distance, not a driving route.
- Sources:
  - https://www.avalara.com/us/en/taxrates/state-rates/alabama/cities/florence.html
  - https://www.revenue.alabama.gov/individual-corporate/individual-income-tax-filing-information/
  - https://www.revenue.alabama.gov/individual-corporate/income-exempt-from-alabama-income-taxation/
  - https://www.va.gov/birmingham-health-care/locations/florence-va-clinic/

## Politics and social policy

- State party/governor: stored as `R` / `R`, matching the app's compact state-control/governor-party convention.
- Politics uses Lauderdale County, not a claimed citywide result. Alabama's official 2016 certified results show 27,899 Trump votes and 9,952 Clinton votes: Republican two-party share 73.70%, stored as 74. Official 2024 results report 32,708 Trump votes and 10,326 Harris votes: Republican two-party share 76.00%, stored as 76. The change is +2.30 percentage points Republican; city politics is accordingly stored as `County-level: Strongly Conservative`.
- Cannabis: Alabama has a state medical-cannabis program; the row is labelled `Medical`, not recreational.
- LGBTQ: HRC's 2025 Florence Municipal Equality Index scorecard gives a final municipal score of 12. MAP's current Alabama Equality Profile has a -10.5 / 49 state policy score. Both are stored with their distinct municipal/state meanings.
- Sources:
  - https://www2.alabamavotes.gov/downloads/election/2016/general/2016-Official-General-Election-Results-Certified-2016-11-29.pdf
  - https://www.sos.alabama.gov/newsroom/alabama-state-canvassing-board-certifies-2024-general-election-results
  - https://www.albme.gov/licensing/md-do/registrations/medical-cannabis/
  - https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Florence-Alabama.pdf
  - https://mapresearch.org/equality-profiles/al/

## Climate

- Representative station: Muscle Shoals / Northwest Alabama Regional Airport, near Florence. NOAA/NWS 1991-2020 normals supply annual precipitation 54.24 inches, January normal low 33.5 F, and July normal high 91.6 F; stored as 54, 34, and 92.
- Timeanddate's airport-based climatology reports July humidity 71%; it is a secondary source because the selected NOAA normals product does not carry this measure. Stored as 71, which produces the app's `hot_humid` category under the documented classifier.
- Annual snow is stored as 2 inches from a secondary long-run Florence climate summary. Sunny days is intentionally blank: no compatible, source-backed annual sunny-day count was found.
- Sources:
  - https://www.weather.gov/hun/muscleshoalsnormalsandextremesdatabase
  - https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
  - https://www.timeanddate.com/weather/usa/florence-al/climate
  - https://www.bestplaces.net/climate/city/alabama/florence

## Lifestyle, hubs, and unfilled fields

- Vibes: `southern_living`, `lake_living`, `great_outdoors`, and `quiet_retreat`. The attached Reddit synthesis is stored as qualitative resident sentiment, not a representative survey: it consistently describes a quiet, car-oriented Shoals community with a more active downtown/UNA core, water recreation, and limited big-city entertainment. The accompanying resident-perception graphic has only 18 Florence votes, so its 72% “quiet area” / 72% “lots of parks” readings are corroborative rather than a population estimate. Its low walkability/transit and sidewalk readings support the existing car-dependence caveat, not a pace override.
- The `lake_living` facet is source-backed by direct Florence Harbor Marina access to Pickwick Lake. `great_outdoors` is source-backed by Florence's parks, boat ramps, fishing piers, trails, kayaking, and Wildwood Park's trail network. These are broad discovery facets, not neighborhood-level guarantees.
- Pace remains the classifier's `suburban` candidate in `needs_review` because it is near a score boundary. “Quiet” is a vibe and is not evidence that the city should be called `small_town` or `rural`.
- Sources:
  - User-provided Reddit synthesis and resident-perception graphic, accessed 2026-08-06; linked discussion threads are preserved in the attached text.
  - https://florenceal.org/parks-recreation/
  - https://florenceal.org/wildwood-park/
  - https://www.visitflorenceal.com/directory/florence-harbor-marina/
  - https://www.tva.com/environment/recreation/tvacation/river-shoals-region
- No affirmative or negative manual `TechHub`/`DefenseHub` value was written: there were no live `defense_employer_locations` matches, but absence from that table is not enough to create a hard manual veto. `defense_hub` remains derived after the recompute pass.
- `TCI` and `CrimeRating` are blank. A compatible, direct city-level FBI extraction was not obtained in this retrieval, so no consumer-site crime score was substituted.
- Sources:
  - https://florenceal.org/parks-recreation/
  - https://florenceal.org/walking-trails-2/
  - https://www.una.edu/about/
  - https://www.nps.gov/mush/planyourvisit/hours.htm
  - https://www.visitflorenceal.com/about/local-links/
