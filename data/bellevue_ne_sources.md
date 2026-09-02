# Bellevue, NE Source Notes

- Retrieval guide: Researched and structured according to `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` and `nextbase-data-retrieval` skill instructions. Conducted in an isolated worktree (`data/ingest-bellevue-ne`) for Phase 1 (Research phase). No live database writes are performed from this branch.
- Geography and demographics: U.S. Census Bureau ACS 2024 5-year data (via Census Reporter and Census QuickFacts) for Bellevue city, Sarpy County, Nebraska (Census Place GEOID `3103950`). Population is 64,510, land area is 22.9 square miles, and population density is 2,819.2 people per square mile (stored as density 2819). Internal point centroid coordinates from Census 2024 Gazetteer are latitude 41.144932, longitude -95.93856.
- State-party convention: Nebraska Governor Jim Pillen is a Republican; following product conventions, both `StateParty` and `Governor` are recorded as `R`.
- Elections: Official Sarpy County election returns from the Sarpy County Election Commissioner and Nebraska Secretary of State.
  - 2016 Presidential: Donald Trump received 45,143 votes, Hillary Clinton received 28,033 votes (two-party total 73,176). Trump won 61.69% of the two-party vote (stored as 62).
  - 2024 Presidential: Donald Trump received 55,567 votes, Kamala Harris received 43,825 votes (two-party total 99,392). Trump won 55.91% of the two-party vote (stored as 56).
  - Trend: Republican two-party vote share changed by -5.78 percentage points (`rep_vote_share_change_pp = -5.8`), Democratic share changed by +5.78 percentage points (`dem_vote_share_change_pp = 5.8`). `ElectionChange` is `5.8 pp more Democratic since 2016`.
  - Political classification: Based on the county-level two-party vote share of 55.9% Republican (falling within the 55.0%–64.9% threshold), `CityPolitics` is classified as `County-level: Conservative`.
- Taxes: The Nebraska Department of Revenue specifies the state sales tax rate at 5.5% and the Bellevue municipal local sales tax rate at 1.5%, totaling 7.00% combined sales tax (`SalesTax = 7.00`). Nebraska's top marginal individual income tax rate is 4.55% for 2026 (`Income = 4.55`).
- Cost of living and housing: Bureau of Economic Analysis (BEA) Regional Price Parities for the Omaha, NE-IA Metropolitan Statistical Area (cbsa-36540) reports an all-items RPP of 91.911, rounding to 92 (Low). Zillow Home Value Index (ZHVI) for Bellevue, NE reports a typical home value of $302,154 as of July 31, 2026.
- VA access and veteran benefits: Bellevue-Longo Drive VA Clinic is located directly in Bellevue at 2206 Longo Drive, Suite 102. The Omaha VA Medical Center is approximately 9 miles north at 4101 Woolworth Ave. The Eastern Nebraska Veterans' Home is also located in Bellevue at 12505 Harrison Tull Drive. Nebraska exempts 100% of military retirement pay from state income tax, exempts Social Security benefits, offers homestead property tax exemptions for qualifying disabled veterans and surviving spouses, and provides veteran education and tuition assistance.
- Crime and safety: FBI Crime Data Explorer (CDE) 2023 data for the Bellevue Police Department reports 73 violent crimes (rate 113.2 per 100k) and 995 property crimes (rate 1542.4 per 100k) across a covered population of 64,510. Benchmarked against the FBI 2023 national baseline (violent 363.8/100k, property 1916.7/100k) via `scripts/compute-tci.ts`, Total Crime Index is calculated as TCI = 56, and `CrimeRating` is `Low` (TCI < 75).
- Cannabis: Decriminalized under Nebraska state statute; `Marijuana = Decriminalized`.
- LGBTQ: Human Rights Campaign (HRC) Municipal Equality Index (MEI) 2024 scorecard for Bellevue, Nebraska reports a score of 46 out of 100 (`LGBTQ = 46`, `LGBTQ_MEI = 46`). Movement Advancement Project (MAP) Nebraska Equality Profile 2026 reports Sexual Orientation Policy Score 4.25/23 and Gender Identity Policy Score -2.5/26, net policy score 1.75/49 (`LGBTQStatePolicyScore = 1.75`).
- Economy and defense: Bellevue directly adjoins and hosts Offutt Air Force Base, headquarters of U.S. Strategic Command (USSTRATCOM) and the 55th Wing. Major defense contractors have facilities serving Offutt AFB, qualifying the city as a major military and defense installation cluster (`DefenseHub = Y`). Bellevue is not an independent technology cluster hub (`TechHub = N`).
- Retail access: `HasWalmart = Y` (Walmart Supercenter #2847 at 10504 S 15th St and Walmart Neighborhood Market #3154 at 2109 Towne Center Dr are both in Bellevue). `HasCostco = N` (no warehouse located within Bellevue city limits; nearest Costco warehouse is in neighboring La Vista, NE, ~7 miles away).
- Climate: NOAA 1991–2020 30-year climate normals for the Offutt AFB / Omaha station area report 27 inches of annual snowfall, 34 inches of annual precipitation, 214 sunny days, average winter low (January) of 15°F, average summer high (July) of 87°F, and July relative humidity of 70%. Display climate is `Hot-summer humid continental`.
- Gasoline: AAA Fuel Prices reports regular gasoline in the Omaha metropolitan area at $3.82 per gallon as of September 2026.
- Tags and description: Description summarizes Bellevue's identity as Nebraska's oldest continuous town, Missouri River setting, military connection with Offutt AFB, healthcare/VA assets, and low violent crime. Tags use vetted filter vocabulary: `["Military", "Healthcare", "Hiking", "Fishing", "Culture", "Golf"]`.

## Primary Sources & URLs

- U.S. Census Bureau QuickFacts Bellevue city, Nebraska: https://www.census.gov/quickfacts/fact/table/bellevuenebraska
- Census Reporter Bellevue, NE profile (ACS 2024 5-year): https://censusreporter.org/profiles/16000US3103950-bellevue-ne/
- Nebraska Governor Jim Pillen official portal: https://governor.nebraska.gov/
- Sarpy County Election Commission 2024 General Election Results: https://www.sarpy.gov/179/Election-Commission
- Sarpy County Clarity Elections 2024 General Results: https://results.enr.clarityelections.com/NE/Sarpy/122588/web.345435/#/summary
- Sarpy County Clarity Elections 2016 General Results: https://results.enr.clarityelections.com/NE/Sarpy/64104/182607/Web01/en/summary.html
- Nebraska Department of Revenue Sales and Use Tax Rates: https://revenue.nebraska.gov/businesses/sales-and-use-tax
- Tax Foundation 2026 State Individual Income Tax Rates: https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/
- Bureau of Economic Analysis (BEA) Regional Price Parities by MSA: https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area
- Zillow Home Value Index (ZHVI) Bellevue, NE: https://www.zillow.com/home-values/37300/bellevue-ne/
- VA Nebraska-Western Iowa Health Care System: https://www.va.gov/nebraska-western-iowa-health-care/
- Bellevue-Longo Drive VA Clinic: https://www.va.gov/nebraska-western-iowa-health-care/locations/bellevue-longo-drive-va-clinic/
- Eastern Nebraska Veterans' Home: https://veterans.nebraska.gov/envh
- Nebraska Department of Veterans' Affairs Benefits Summary: https://veterans.nebraska.gov/benefits
- FBI Crime Data Explorer (CDE) Bellevue Police Department: https://cde.ucr.cjis.gov/
- HRC Municipal Equality Index 2024 Bellevue Scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-24-Scorecards/MEI-2024-Bellevue-Nebraska.pdf
- Movement Advancement Project (MAP) Nebraska Equality Profile: https://www.lgbtmap.org/equality_maps/profile_state/NE
- Offutt Air Force Base official site: https://www.offutt.af.mil/
- Walmart Store Locator (Bellevue, NE): https://www.walmart.com/store-directory/ne/bellevue
- Costco Warehouse Locator: https://www.costco.com/warehouse-locations
- NOAA NCEI U.S. Climate Normals (1991–2020): https://www.ncei.noaa.gov/access/us-climate-normals/
- AAA Fuel Prices Nebraska / Omaha metro: https://gasprices.aaa.com/?state=NE
