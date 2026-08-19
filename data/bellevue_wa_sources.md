# Bellevue, WA Source Notes

Retrieval date: 2026-08-07.

## Geography and source choices

- Primary geography: incorporated City of Bellevue, King County, Washington (Census place GEOID 5305210).
- Population, density, housing, sales tax, climate, safety context, and lifestyle tags are city-level or use the nearest representative station.
- Presidential fields use final King County returns, not a city-boundary precinct aggregation. `CityPolitics` is therefore explicitly qualified as county-level.
- The `DefenseHub` CSV field is intentionally blank. There was no reviewed Bellevue-specific evidence adequate for a manual defense-hub judgment; the derived field remains governed by employer-location linkage and recomputation.

## Imported values and method

- Population and density: Census QuickFacts reports a July 1, 2025 population estimate of 154,193 and a 2020 density of 4,538.2 people per square mile. Stored as 154,193 and 4,538.
- Housing: Zillow lists Bellevue's ZHVI / typical home value at $1,470,486, data through 2026-06-30. The model field is named `avg_home_value`, but this is Zillow's index, not an average or median.
- Cost and taxes: AreaVibes' 2026 modeled index is 203 on a U.S.=100 basis. This is a directional, modeled comparison rather than an official price index. Bellevue's combined sales-tax rate is stored as 10.30 percent (6.5 percent state plus 3.8 percent local); Washington has no individual income tax.
- VA and veterans benefits: Bellevue has nearby VA Puget Sound care; the Seattle VA Medical Center is approximately 10 straight-line miles from Bellevue civic center. The historic Bellevue outpatient clinic should not be represented as current: VA's current location directory no longer lists it. Washington WDVA describes income-qualified property-tax relief for qualifying disabled veterans/surviving spouses; VA disability compensation is excluded from the combined-income calculation.
- Elections: King County's final 2016 result was Clinton 718,322 and Trump 216,339; 2024 was Harris 832,606 and Trump 252,193. Two-party Republican share moved from 23.14% to 23.25%, so `rep_vote_share_change_pp = 0.1`, `dem_vote_share_change_pp = -0.1`, and `election_change = 0.1 pp more Republican since 2016`. Both Democratic two-party shares round to 77%, supporting `County-level: Strongly Liberal` under the documented county-level qualifier.
- Crime: FBI 2024 city data reports a Bellevue violent-crime rate of 362.33 per 100,000. Indexing it to the FBI 2024 national violent-crime rate of 359.1 yields 100.9, stored as TCI 101 and the non-alarmist label `Moderate`. Bellevue Police reports overall crime fell 6% in 2024; that local trend is contextual, not the cross-city index source.
- LGBTQ: Bellevue's visitor bureau records its 2025 HRC Municipal Equality Index score as 100/100. MAP's 2026 Washington Equality Profile score is 40.5/49. Municipal policy and state policy are stored separately.
- Climate: NOAA 1991-2020 normals for Seattle-Tacoma International Airport (USW00024233), a representative nearby station, give annual precipitation 39.34 inches, annual snowfall 6.30 inches, January average low 38.0 F, and July average high 77.4 F. Stored as 39, 6, 38, and 77. `sun_days` and `humidity_summer` remain blank because this NOAA product does not provide comparable measures. These values fall in the repository's `mild_coastal` category.
- Economy and lifestyle: Bellevue is a technology center; `TechHub=Y` reflects its established Eastside technology employment base. Tags summarize Lake Washington access, trails/Cascade access, arts/culture, and medical services. Bellevue is within the project thresholds for Lake Washington, Puget Sound saltwater coastline, and Cascade mountain access; vibes are `lake_living`, `mountain_living`, `great_outdoors`, and `nightlife`.

## Source URLs

- Census QuickFacts, Bellevue: https://www.census.gov/quickfacts/fact/table/bellevuecitywashington/PST045225
- Zillow Bellevue ZHVI: https://www.zillow.com/home-values/3619/bellevue-wa/
- AreaVibes cost of living: https://www.areavibes.com/bellevue-wa/cost-of-living/
- Washington Department of Revenue, income tax: https://dor.wa.gov/taxes-rates/income-tax
- Washington DOR local sales/use-tax rate flyers: https://dor.wa.gov/taxes-rates/sales-and-use-tax-rates/local-sales-use-tax-rate-changes
- VA Puget Sound locations: https://www.va.gov/puget-sound-health-care/locations/
- Seattle VA Medical Center: https://www.va.gov/puget-sound-health-care/locations/seattle-va-medical-center/
- Washington DVA property-tax relief: https://dva.wa.gov/veterans-service-members-and-their-families/veterans-benefits/housing-resources/property-tax-relief
- King County final 2016 results: https://results.vote.wa.gov/results/20161108/king/
- King County final 2024 results: https://results.vote.wa.gov/results/20241105/king/
- FBI 2024 Table 8 city data: https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/crime-trend
- Bellevue Police 2024 Annual Report: https://bellevuewa.gov/sites/default/files/media/pdf_document/2025/bpd-25-35179-annual-report-2024-web_0.pdf
- Bellevue HRC MEI recognition: https://www.visitbellevue.com/media/awards-and-accolades/
- MAP Washington Equality Profile: https://mapresearch.org/equality-profiles/wa/
- Washington State Liquor and Cannabis Board: https://lcb.wa.gov/
- NOAA annual normals, USW00024233: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024233&format=json&units=standard&includeAttributes=false
- NOAA monthly normals, USW00024233: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00024233&format=json&units=standard&includeAttributes=false
- City of Bellevue economic development: https://bellevuewa.gov/business/economic-development
- City of Bellevue parks and trails: https://bellevuewa.gov/city-government/departments/parks/parks-and-trails
