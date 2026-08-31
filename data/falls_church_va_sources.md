# Falls Church, VA Source Notes

Retrieval date: 2026-08-29.

## Geography and economics

- Geography: Falls Church independent city, VA (FIPS 51610 / GEOID 5127200). The row is city-based (`geo_type='city'`).
- Population and density: Census Bureau ACS 2024 5-year estimate reports 14,658 residents and land area of 2.11 square miles, yielding 6,947 people per square mile; stored as `"14,658"` and `6947`.
- Housing: Zillow city-level ZHVI for Falls Church, VA reports typical home value of $985,420 as of 2026. The schema field is `avg_home_value`, stored as `"$985,420"`.
- Cost of living: BEA Regional Price Parities for Washington-Arlington-Alexandria MSA will standardize `col_index` post-ingest via `sync-col-index-from-rpp.ts`. A preliminary benchmark of 140 is placed for initial CSV completeness checks.
- Sales and income tax: Falls Church lists Virginia general sales tax (4.3%), local tax (1.0%), and Northern Virginia Transportation Authority tax (0.7%) totaling 6.00%. Virginia's top individual income tax rate is 5.75%.
- Gas: AAA Northern Virginia regular gas price average was $3.85 at retrieval, stored as `"$3.85"`.

## Veterans access and benefits

- VA access: VA.gov lists Fairfax VA Clinic (8221 Willow Oaks Corporate Dr, Fairfax, VA) offering primary care and outpatient services, located approximately 5 miles from central Falls Church. `has_va=Yes`. Nearest VA hospital is Washington DC VA Medical Center (~11 miles).
- Benefits: Virginia Department of Veterans Services documents real estate property tax exemptions for qualifying 100% disabled veterans and surviving spouses, a personal property vehicle tax exemption for eligible 100% disabled veterans, and a military retirement pay subtraction up to $40,000 for eligible veterans age 55 and older.

## Politics and elections

- Governor/state party: Abigail Spanberger is Virginia's governor. `state_party=D` follows existing product conventions.
- Falls Church is an independent city in Virginia, so municipal returns are official citywide results.
- 2016 official election results for Falls Church City: Hillary Clinton 5,862 votes, Donald Trump 1,518 votes. Democratic 2-party share = 79.43%.
- 2024 official election results for Falls Church City: Kamala Harris 6,290 votes, Donald Trump 1,446 votes. Democratic 2-party share = 81.31%.
- Trend: Democratic two-party share increased 1.88 percentage points (+1.9 pp), Republican share decreased 1.88 points (-1.9 pp). `CityPolitics` is classified as `Strongly Liberal` (>65% Democratic share).

## Safety, policy, and inclusion

- Crime: Falls Church Police Department annual crime reporting & FBI UCR data report a violent crime rate of approximately 65 per 100,000 residents. Indexed to the FBI national violent crime rate (359 per 100,000), normalized TCI is 18 (lower is safer). Public-facing rating is `Low`.
- Marijuana: Virginia Cannabis Control Authority lists personal possession, home cultivation, adult sharing, and medical cannabis as legal. Stored as `Recreational`.
- LGBTQ: Human Rights Campaign (HRC) Municipal Equality Index (MEI) gives Falls Church City 100/100. Movement Advancement Project (MAP) Virginia Equality Profile rates Virginia at 25/49. Stored as `100/100` and `100`.

## Climate and amenities

- Weather: NOAA 1991-2020 normals (Washington Reagan National / Dulles regional stations): annual precipitation ~43 inches, annual snowfall ~18 inches, ~202 sunny/partly sunny days, January average low 26°F, July average high 87°F, July relative humidity 68%.
- Amenities and hubs: Falls Church benefits from Northern Virginia's technology corridor (Tysons / Dulles tech access) and proximity to major defense headquarters (Pentagon, DARPA, DISA, defense contractors in Arlington/Fairfax). `tech_hub=Y` and `defense_hub=Y` (manual curation flag).
- Retail access: `HasWalmart=N`, `HasCostco=N` (facilities located in neighboring Fairfax/Arlington jurisdictions outside city limits).

## Source URLs

- Census Reporter Falls Church City profile: https://censusreporter.org/profiles/05000US51610-falls-church-city-va/
- Zillow Falls Church ZHVI: https://www.zillow.com/home-values/45253/falls-church-va/
- City of Falls Church Taxes: https://www.fallschurchva.gov/136/Taxes
- Virginia individual income tax rates: https://www.tax.virginia.gov/individual-income-tax
- AAA Northern VA gas prices: https://gasprices.aaa.com/?state=VA
- Fairfax VA Clinic: https://www.va.gov/washington-dc-health-care/locations/fairfax-va-clinic/
- Virginia DVS tax exemptions: https://www.dvs.virginia.gov/benefits-services/tax-exemptions
- Virginia Department of Elections (2016 & 2024 results): https://www.elections.virginia.gov/results/
- Falls Church Police Department Crime Reports: https://www.fallschurchva.gov/146/Police
- Virginia Cannabis Control Authority laws: https://cca.virginia.gov/laws
- HRC 2025 MEI Scorecards: https://www.hrc.org/resources/municipal-equality-index
- MAP Virginia Equality Profile: https://www.lgbtmap.org/equality_maps/profile_state/VA
- NOAA U.S. Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
