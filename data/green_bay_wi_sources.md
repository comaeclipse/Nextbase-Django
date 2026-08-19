# Green Bay, WI Source Notes

Retrieval date: 2026-08-19.

## Scope

Phase 1 city research artifact for `Green Bay, WI`. Per `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md`, this branch does not run the live Neon importer. It produces the curated city CSV and source notes, then validates the CSV with `scripts/import-csv.ts --dry-run`.

## Identity and geography

- City row: Green Bay city, Wisconsin, not the Green Bay metro area.
- County: Brown County.
- Population: 107,395 from U.S. Census Bureau QuickFacts, 2020 Census.
- Density: 2,361 people per square mile from the 2020 Census/Green Bay city profile.
- Coordinates: Census place centroid from the repo's RUCA/EPA-derived place centroid bundle: `green bay|WI`, GEOID `5531000`, latitude `44.521542`, longitude `-87.986568`.
- Sources:
  - U.S. Census QuickFacts, Green Bay city, Wisconsin: https://www.census.gov/quickfacts/fact/table/greenbaycitywisconsin/
  - City of Green Bay "About Green Bay": https://greenbaywi.gov/131/About-Green-Bay

## Housing and cost of living

- Zillow Home Value Index, Green Bay, WI: `$289,857`, data through July 31, 2026. Stored in `AvgHomeValue`.
- BestPlaces cost-of-living score: `86.1`; stored as integer `86`, which the importer derives to `Low`.
- Sources:
  - Zillow Green Bay home values: https://www.zillow.com/home-values/45548/green-bay-wi/
  - BestPlaces Green Bay cost of living: https://www.bestplaces.net/cost_of_living/city/wisconsin/green_bay

## Taxes and gas

- Sales tax: `5.5%`. Wisconsin state rate is 5.0%; Green Bay has no city sales tax; Brown County/local combined rate makes the minimum combined city rate 5.5%.
- State income-tax compatibility field: `7.65`, Wisconsin top marginal individual income tax rate. This is state-owned and ignored by `scripts/import-csv.ts`; it is included only for legacy CSV compatibility.
- Gas: AAA Green Bay regular current average `$3.8806`, stored as `$3.88`.
- Sources:
  - Wisconsin Department of Revenue sales/use tax FAQ: https://www.revenue.wi.gov/Pages/FAQS/pcs-taxrates.aspx
  - Wisconsin Department of Revenue county/city sales and use taxes: https://www.revenue.wi.gov/Pages/FAQS/pcs-county.aspx
  - Avalara Green Bay combined rate cross-check: https://www.avalara.com/us/en/taxrates/state-rates/wisconsin/cities/green-bay.html
  - Wisconsin Department of Revenue individual income tax rates: https://www.revenue.wi.gov/Pages/FAQS/pcs-taxrates.aspx
  - AAA Wisconsin gas prices: https://gasprices.aaa.com/?state=WI

## Veterans Affairs and veteran benefits

- `VA=Y`: Green Bay has an in-city VA outpatient clinic.
- Nearest outpatient-capable VA: Milo C. Huempfner VA Outpatient Clinic, 2851 University Avenue, Green Bay, WI. Stored distance: `0 miles`.
- VA hospital distance is intentionally left to Phase 2 `scripts/sync-va-facilities.ts`; it is not a CSV field.
- Wisconsin veteran-benefit summary is from the already verified state-owned benefit row in Neon and `data/state_retired_pay_tax.csv`; source URL is Wisconsin DOR military tax FAQ, verified 2026-08-11. The city importer ignores state-owned veteran benefit fields.
- Sources:
  - VA Milwaukee health care location page: https://www.va.gov/milwaukee-health-care/locations/milo-c-huempfner-department-of-veterans-affairs-outpatient-clinic/
  - Wisconsin DOR military tax FAQ: https://www.revenue.wi.gov/Pages/FAQS/pcs-military.aspx

## Politics and elections

- CSV election geography: Brown County, matching the repo's county-level default.
- 2016 Brown County presidential result: Trump 67,210; Clinton 53,382. Two-party Trump share = 55.73%, stored winner percent `56`.
- 2024 Brown County presidential result: Trump 79,132; Harris 67,937. Two-party Trump share = 53.80%, stored winner percent `54`.
- Trend math: Republican two-party share changed `-1.9` percentage points; Democratic two-party share changed `+1.9` percentage points. Stored election change: `1.9 pp more Democratic since 2016`.
- City politics label: `County-level: Lean Conservative; city: Lean Democratic`. County baseline is Republican-leaning; Marquette Law School's Wisconsin county page notes the City of Green Bay was one of the few Brown County municipalities won by the Democratic presidential ticket in 2024.
- Sources:
  - 2016 Wisconsin presidential election by county: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Wisconsin
  - 2024 Wisconsin presidential election by county: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Wisconsin
  - Marquette Law School Poll, Brown County election history: https://mulawpoll.org/counties/brown.html

## Crime and TCI

- Green Bay violent-crime rate: 495.1 per 100,000, 521 violent crimes in the latest HomeSnacks/FBI-derived city report.
- FBI 2024 national violent-crime baseline used in prior repo notes: 359.0 per 100,000.
- TCI calculation: `495.1 / 359.0 * 100 = 137.9`, stored as `138`.
- Crime label: `Moderate`. This follows nearby existing CSV bands where TCI around 130-141 remains Moderate, while Hartford at 144 was labeled High.
- Sources:
  - HomeSnacks Green Bay crime report: https://www.homesnacks.com/wi/green-bay-crime/
  - FBI Crime Data Explorer/UCR program: https://cde.ucr.cjis.gov/

## LGBTQ

- Green Bay scored `100` on HRC's 2025 Municipal Equality Index, stored as both `LGBTQ` and `LGBTQ_MEI`.
- `LGBTQStatePolicyScore` left blank because Wisconsin's normalized MAP state-policy score is not currently present in `locations_stateinfo`; this is state-owned and not part of the city import gate.
- Sources:
  - HRC Wisconsin MEI city list: https://www.hrc.org/resources/mei-state/wisconsin
  - HRC 2025 Green Bay scorecard PDF: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Green-Bay-Wisconsin.pdf

## Weather and climate

- NOAA/NCEI station: `USW00014898`, Green Bay, WI. 1991-2020 normals.
- Annual precipitation: 31.61 inches, stored as `32`.
- Annual snowfall: 55.6 inches, stored as `56`.
- January average low: 11.1 F, stored as `11`.
- July average high: 81.0 F, stored as `81`.
- Summer humidity: computed from NOAA hourly normals at station `USW00014898`; July average relative humidity is 72.7%, stored as `73`.
- Sunny days: NOAA normals do not publish the app's `SunnyDays` field. BestPlaces reports 187 sunny days per year; stored as `187`.
- Climate label: `Humid continental`.
- Sources:
  - NOAA/NCEI U.S. Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
  - NOAA monthly normals CSV for `USW00014898`: https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00014898.csv
  - NOAA hourly normals CSV for `USW00014898`: https://www.ncei.noaa.gov/data/normals-hourly/1991-2020/access/USW00014898.csv
  - Wisconsin State Climatology Office Green Bay climate normals cross-check: https://climatology.nelson.wisc.edu/first-order-station-climate-data/green-bay-climate/
  - BestPlaces Green Bay climate, sunny days: https://www.bestplaces.net/climate/city/wisconsin/green_bay

## Retail amenities

- `HasWalmart=Y`: Walmart lists two Green Bay, WI stores, including Supercenter #1453 at 2440 W Mason St and Supercenter #1908 at 2292 Main St.
- `HasCostco=N`: Costco's Green Bay-area warehouse is in Bellevue, WI, not inside Green Bay city limits. The row is city-scoped, so this stays false rather than treating the suburb as in-city access.
- Sources:
  - Walmart Green Bay store directory: https://www.walmart.com/store-directory/wi/green%20bay
  - Walmart Supercenter #1453: https://www.walmart.com/store/1453-green-bay-wi
  - Costco Bellevue warehouse: https://www.costco.com/w/-/wi/bellevue/1162
  - Costco Wisconsin warehouse list: https://www.costco.com/sitemaps/warehouses-by-state/WI

## Tech hub and defense hub

- `TechHub=N`: no source-backed evidence found that Green Bay is a major tech hub under the app's city-row convention.
- `DefenseHub=N`: no source-backed evidence found of an in-city major military installation or significant defense-contractor hub. Nearby regional defense/manufacturing assets are outside the city row and are not used as a silent proxy.
- Known caveat: this is a reviewed negative for the city row, not a statement that northeastern Wisconsin has no defense activity.

## Description and tags

- Description is based on the in-city VA clinic, Zillow/BestPlaces affordability signals, Green Bay's Fox River/Lake Michigan bay setting, parks/fishing/cultural amenities, HRC MEI score, Brown County political baseline, and weather/crime tradeoffs above.
- Tags: `["Healthcare","Fishing","Arts","Culture","Coastal","Parks","Retail"]`.

## Known gaps and caveats

- No live Neon import was run from this branch. This is intentional Phase 1 behavior under the current repo workflow.
- `LGBTQStatePolicyScore`, `StateParty`, `Governor`, `Income`, `Veterans Benefits`, and `Marijuana` are state-owned fields. The city CSV includes legacy compatibility values where useful, but `scripts/import-csv.ts` ignores them.
- `HasCostco=N` is city-scoped. The nearest warehouse is a nearby suburb (Bellevue), so it should not be stored as in-city true unless product scope changes to metro access.
- Sunny days uses BestPlaces as a secondary source because NOAA/NCEI normals do not provide that app field.
