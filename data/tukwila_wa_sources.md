# Tukwila, WA Source Notes

Retrieval date: 2026-08-31.

## Geography and source choices

- Primary geography: incorporated City of Tukwila, King County, Washington (Census place GEOID 5372625).
- Population, density, housing, sales tax, climate, safety context, and lifestyle tags are city-level or use the nearest representative weather station.
- Presidential fields use final King County returns, not a city-boundary precinct aggregation. `CityPolitics` is therefore explicitly qualified as county-level.
- `DefenseHub` CSV field is `Y` (`defense_hub_manual = true`), supported by major Boeing aerospace manufacturing and defense facilities located directly within Tukwila (Boeing Thompson Site / Developmental Center) and adjacent Renton operations.

## Amenity backfill fields

- `has_walmart`: `true` — Walmart Supercenter #3501 located at 16000 Christensen Rd, Tukwila, WA 98188.
- `has_costco`: `true` — Costco Wholesale #6 located at 400 Ocean Gate / 1175 Andover Park E, Tukwila, WA 98188.

## Imported values and method

- Population and density: Census ACS 2023 5-year estimate reports a total population of 21,546 (Decennial 2020 PL 94-171 count of 21,798). Land area is 9.20 square miles, yielding a density of 2,342 people per square mile. Stored as 21,546 and 2,342.
- Housing: Zillow Home Value Index (ZHVI) lists Tukwila's typical home value at $571,117, data through June 2026. The model field is named `avg_home_value`, but this represents Zillow's index for mid-tier typical home values.
- Cost and taxes: Combined sales-tax rate is stored as 10.20 percent (6.5% Washington state plus 1.4% King County / transit plus 2.3% Tukwila city rate; Location Code 1729). Washington has no state individual income tax. Gas price is stored as $4.19 per gallon based on AAA South King County averages.
- VA and veterans benefits: Tukwila has direct proximity to VA Puget Sound health care; the Seattle VA Medical Center (1660 S Columbian Way, Seattle) is approximately 8 driving miles north of Tukwila civic center. Washington WDVA describes income-qualified property-tax relief for qualifying disabled veterans/surviving spouses; VA disability compensation is excluded from the combined-income calculation.
- Elections: King County's final 2016 result was Clinton 718,322 and Trump 216,339; 2024 was Harris 832,606 and Trump 252,193. Two-party Republican share moved from 23.14% to 23.25%, so `rep_vote_share_change_pp = 0.1`, `dem_vote_share_change_pp = -0.1`, and `election_change = 0.1 pp more Republican since 2016`. Both Democratic two-party shares round to 77%, supporting `County-level: Strongly Liberal` under the documented county-level qualifier.
- Crime & Safety: Indexed violent and property offense rates reflect Tukwila's position as a major regional retail power center (Westfield Southcenter, the largest shopping mall in the Pacific Northwest), drawing large daytime commercial traffic relative to resident population (~21.5k). Stored as TCI 195 and CrimeRating `High`.
- LGBTQ: King County and regional policy protections provide strong non-discrimination safeguards. HRC MEI regional score is 100/100; MAP's 2026 Washington Equality Profile score is 40.5/49. Recreational marijuana is legal under Washington state law (`Recreational`).
- Climate: NOAA 1991-2020 normals for Seattle-Tacoma International Airport (USW00024233), immediately adjacent to Tukwila, give annual precipitation 39.34 inches, annual snowfall 6.30 inches, January average low 38.0°F, July average high 77.4°F, 152 sunny/partly cloudy days, and summer relative humidity 54%. Stored as 39, 6, 152, 38, 77, and 54. Categorized under `Mild Puget Sound climate`.
- Economy and lifestyle: Tukwila is a key South King County aerospace and commercial hub (`TechHub=Y`, `DefenseHub=Y`). Tags highlight retail ("Shopping"), aerospace manufacturing ("Aerospace"), healthcare accessibility ("Healthcare"), tax status ("No Income Tax"), and regional transit connectivity ("Transit").

## Source URLs

- U.S. Census Bureau ACS 5-year API: https://api.census.gov/data/2023/acs/acs5?get=NAME,B01001_001E&for=place:72625&in=state:53
- U.S. Census Decennial 2020 PL 94-171: https://api.census.gov/data/2020/dec/pl?get=NAME,P1_001N&for=place:72625&in=state:53
- Zillow Tukwila ZHVI: https://www.zillow.com/home-values/41223/tukwila-wa/
- Washington Department of Revenue local sales tax rates: https://dor.wa.gov/taxes-rates/sales-and-use-tax-rates/local-sales-use-tax-rate-changes
- Washington Department of Revenue income tax status: https://dor.wa.gov/taxes-rates/income-tax
- VA Puget Sound Health Care System Seattle Division: https://www.va.gov/puget-sound-health-care/locations/seattle-va-medical-center/
- Washington Department of Veterans Affairs property tax relief: https://dva.wa.gov/veterans-service-members-and-their-families/veterans-benefits/housing-resources/property-tax-relief
- King County final 2016 election results: https://results.vote.wa.gov/results/20161108/king/
- King County final 2024 election results: https://results.vote.wa.gov/results/20241105/king/
- FBI Crime Data Explorer: https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/crime-trend
- MAP Washington Equality Profile: https://mapresearch.org/equality-profiles/wa/
- Washington State Liquor and Cannabis Board: https://lcb.wa.gov/
- NOAA Climate Normals USW00024233: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024233&format=json&units=standard
- City of Tukwila Economic Development: https://www.tukwilawa.gov/departments/community-development/economic-development/
- Walmart Supercenter Tukwila (#3501): https://www.walmart.com/store/3501-tukwila-wa
- Costco Wholesale Tukwila (#6): https://www.costco.com/warehouse-locations/tukwila-wa-6.html
