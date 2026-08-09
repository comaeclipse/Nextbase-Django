# Hamilton, WA Source Notes

Retrieval date: 2026-08-07.

## Geography and source choices

- Primary geography: incorporated Town of Hamilton, Skagit County, Washington. Hamilton is a distinct Census-recognized incorporated place and must not be conflated with Sedro-Woolley, Mount Vernon, or Skagit County as a whole.
- Population is the 2020 Decennial Census count of 297, retained in preference to volatile ACS small-area estimates. A 30-resident swing in ACS would represent a ~10 % population change, making the decennial figure the more defensible anchor. No density estimate is stored because reliable sub-county density for a place this small requires the same Census data that has not yet been released for post-2020 geography.
- Political, crime, cost-of-living, housing, LGBTQ-city-level, and election fields are blank. The reasons are documented field by field below; in every case the absence of a reliable Hamilton-specific source is the controlling reason. County or regional proxies were rejected.
- `DefenseHub` is set to `Y` (→ `defense_hub_manual = true`) based on Janicki Industries' large physical aerospace/defense manufacturing campus in Hamilton, not based on the Anduril Resident Supplier Quality Engineer job posting. See the Defense section below.

## Imported values and method

### Population
- 2020 Decennial Census: 297 residents. Stored as "297" with no comma separator.
- Source: U.S. Census Bureau, 2020 Decennial Census, P1 Total Population, Hamilton town, WA (GEOID 5329640).

### Taxes
- Washington has no individual state income tax. `Income` stored as 0.
- Combined sales-tax rate: Washington state base 6.5 %; Hamilton's local jurisdiction code adds 2.2 % (2.1 % pre-April 2026 local + 0.1 % Skagit County increment effective April 1, 2026). Combined rate stored as 8.7 %.
- Source: Washington Department of Revenue, Q1 2026 local sales/use-tax rate flyer (see URL below). The combined rate is quarterly; the source URL should be re-verified each quarter.

### Veterans benefits
- Washington has no individual state income tax, so military retirement pay is not subject to Washington income tax.
- Washington DVA administers income-based and disability-based property-tax relief programs for qualifying veterans and surviving spouses.
- Source: Washington DVA property-tax relief page (see URL below).

### VA access
- `VA`: No — there is no VA facility inside Hamilton.
- `NearestVA`: Mount Vernon VA Clinic. This is the nearest identified outpatient VA point of care, in Mount Vernon (~17 straight-line miles from Hamilton centroid).
- `DistanceToVA`: blank — let `sync-va-facilities.ts` calculate great-circle distance from Hamilton's centroid coordinates (48.5244 N, 121.9903 W).
- Nearest VA hospital is almost certainly the Seattle VA Medical Center (~68 straight-line miles), but this should be confirmed by the VA sync script, not manually set.

### Defense / employer
- Janicki Industries operates a major and expanding aerospace, space, and defense manufacturing campus in Hamilton. The existing footprint was reported at approximately 485,000 sq ft in 2024; Janicki has announced a further 162,000 sq ft manufacturing building, a 20,000 sq ft storage expansion, and approximately 350 additional jobs.
- Janicki explicitly works in aerospace, space, and defense and has received supplier recognition from Northrop Grumman and Boeing.
- `DefenseHub`: Y → `defense_hub_manual = true`. This is a rare case where the industrial footprint relative to the residential population (Janicki ~1,200+ WA employees vs. Hamilton population ~297) makes a manual defense-hub designation clearly warranted independent of the employer-location linkage.
- Anduril caveat: a current Anduril "Resident Supplier Quality Engineer — Hamilton, Washington" posting exists. The title is consistent with an Anduril employee stationed at a supplier's facility (most plausibly Janicki), not with Anduril operating its own Hamilton campus. Hamilton should NOT be added to `defense_employer_locations` as an Anduril-owned physical facility on the basis of this posting alone. If Anduril opens its own Hamilton facility or signs a facility lease, revisit.
- `TechHub`: N. Hamilton has aerospace engineering, precision manufacturing, and composites expertise but lacks a diversified technology labor market.

### Climate
- Climate category: Marine West Coast (cool, wet Pacific-influenced climate; Hamilton is in the upper Skagit Valley near the Cascade foothills and receives more orographic precipitation than the Puget Sound lowlands).
- `AverageHighSummer` (76 °F) and `HumiditySummer` (70 %) are secondary-source proxy values from a Hamilton-specific weather summary (timeanddate.com, averaging July data). These values are directionally plausible given Hamilton's inland position relative to Mount Vernon.
- `Snow`, `Rain`, `SunnyDays`, `AverageLowWinter` remain blank. No NOAA normals station has been confirmed for Hamilton itself; the nearest NOAA GHCN station should be identified and matched before filling these fields. Do not substitute the Seattle-Tacoma or Mount Vernon station without a station-matching note.

### LGBTQ
- No HRC Municipal Equality Index score exists for Hamilton (expected for a town of ~300).
- `LGBTQ` and `LGBTQ_MEI` remain blank.
- `LGBTQStatePolicyScore` = 40.5: MAP Movement Advancement Project 2026 Washington Equality Profile score (49-point state policy tally).
- Source: MAP Washington Equality Profile 2026 (see URL below).

### Cannabis
- Washington permits adult-use recreational cannabis (21+) statewide. `Marijuana`: Recreational.

### Cost of living, housing, crime
- All blank. Salary.com's modeled COL index (proprietary secondary methodology) is not sufficient for ingestion. No Zillow ZHVI series for Hamilton as a distinct city-level geography was confirmed; individual property Zestimates vary too widely to infer a city statistic. Crime data at the place level does not exist for a community policed by Skagit County Sheriff's Office — and even if it did, one violent incident per year would produce rates of >333 per 100,000 (statistically meaningless).

### Politics and elections (2026-08-09)
- This file previously noted county-level Skagit County results were not an adequate substitute for a 300-person foothill town — that reasoning held, and the fix was to go one level more local, not less: **Hamilton precinct**, not county. Washington State precinct-level results: 2016 Trump 56 / Clinton 18 (D 24.32% / R 75.68% two-party, stored `election_2016_percent = 76`); 2024 Trump 66 / Harris 39 (D 37.14% / R 62.86% two-party, stored `election_2024_percent = 63`). `rep_vote_share_change_pp = -12.82`, `dem_vote_share_change_pp = +12.82`, `election_change = "12.8 pp more Democratic since 2016"` — note this is a large swing off a very small raw-vote base (74 total votes in 2016, 105 in 2024), so read the percentage-point figure with that in mind. Independently re-fetched and confirmed against the primary source (2024 precinct page) before writing, not just taken as given. Sources: WA Secretary of State precinct results, https://results.vote.wa.gov/results/20161108/skagit/precincts-1.html (2016) and https://results.vote.wa.gov/results/20241105/skagit/precincts-162430.html (2024).

### Coordinates
- `Latitude` = 48.5244, `Longitude` = −121.9903. These are Census 2024 Gazetteer internal-point coordinates for Hamilton town, WA (estimated GEOID 5329640). The Census GEOID should be verified against the 2024 Gazetteer places file before running `prepare-map-coordinates.ts`.
- If Hamilton is not present in the pace bundle's `place_centroids` (likely given its sub-RUCA scale), `prepare-map-coordinates.ts` will throw. The Latitude/Longitude columns in this CSV allow `import-csv.ts` to set coordinates directly, bypassing the pace lookup. The `location-map-coordinates.json` entry was added manually and may need to be regenerated once a pace-bundle entry is available.

## Source URLs

- 2020 Census Hamilton town, WA: https://data.census.gov/table/DECENNIALPL2020.P1?g=160XX00US5329640
- Washington Department of Revenue, income tax: https://dor.wa.gov/taxes-rates/income-tax
- Washington DOR Q1 2026 local sales/use-tax rate flyer (Hamilton jurisdiction): https://dor.wa.gov/sites/default/files/2025-11/Q126_LSU_flyer.pdf
- Washington DVA property-tax relief: https://dva.wa.gov/veterans-service-members-and-their-families/veterans-benefits/housing-resources/property-tax-relief
- VA Puget Sound locations (includes Mount Vernon clinic): https://www.va.gov/puget-sound-health-care/locations/
- Janicki Industries Hamilton campus expansion announcement: https://www.janicki.com/janicki-industries-expansion-in-hamilton-washington-to-create-350-new-jobs/
- Janicki Industries Cascadia Daily profile (existing campus, defense scope): https://www.cascadiadaily.com/2024/may/30/tech-innovator-janicki-creates-niche-for-products-on-the-water-in-the-air-and-in-space/
- Anduril Resident Supplier Quality Engineer posting (Hamilton, WA): https://www.ihirequalitycontrol.com/jobs/view/528070302
- MAP Washington Equality Profile 2026: https://mapresearch.org/equality-profiles/wa/
- Washington State Liquor and Cannabis Board (recreational cannabis): https://lcb.wa.gov/education/using_and_having_cannabis
- World Population Review — Hamilton, WA: https://worldpopulationreview.com/us-cities/washington/hamilton
- Timeanddate.com Hamilton climate proxy: https://www.timeanddate.com/weather/%405796579/climate
- Skagit County Sheriff 2025 Annual Report (context only; no Hamilton-level crime data): https://skagitcounty.net/Sheriff/Documents/2025%20annual%20report.pdf
