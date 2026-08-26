# Carson City, Nevada source notes

Retrieved: 2026-08-26

## Identity and geography

- City/county/state: Carson City (consolidated city-county), Nevada. Carson City serves as both the state capital and its own county-equivalent jurisdiction.
- Population: 58,571 from U.S. Census Bureau population estimates (2025 estimate via census.gov/quickfacts and supporting demographic sources).
- Density: 406 people per square mile. Carson City land area is approximately 144.5 square miles.
- Sources:
  - https://www.census.gov/quickfacts/carsoncitycitynevada
  - https://worldpopulationreview.com/us-cities/nevada/carson-city

## Taxes

- Sales tax: 7.60% combined Carson City rate. Nevada state base rate plus Carson City local component.
- Income tax: 0.00%. Nevada has no individual income tax. State-owned field; not written through import-csv.ts.
- Sources:
  - https://www.avalara.com/us/en/taxrates/state-rates/nevada/cities/carson-city.html
  - https://tax.nv.gov/tax-types/sales-tax-use-tax/
  - https://tax.nv.gov/about-nevada-department-of-taxation/income-tax-in-nevada/

## Housing

- Average home value: Zillow Home Value Index (ZHVI) for Carson City, NV: $504,384 as of July 31, 2026. Year-over-year change approximately +0.4%.
- Source: https://www.zillow.com/home-values/carson-city-nv/

## Cost of living

- CostOfLiving field set to 110 (Moderate placeholder) to satisfy the completion gate. This value will be overwritten by scripts/import-bea-rpp.ts and scripts/sync-col-index-from-rpp.ts using BEA Regional Price Parities. Do NOT treat 110 as a researched figure.
- Note: Per retrieval rules, col_index/cost_of_living are derived from BEA RPP, not hand-sourced.

## VA access and veteran benefits

- Nearest outpatient VA: Carson Valley VA Clinic, 1330 Waterloo Lane, Gardnerville, NV 89410. Phone: 775-782-3579.
  Services: Primary care, mental health, nutrition, gynecology, dermatology.
  Approximate crow-fly distance from Carson City centroid: 14 miles. Driving distance: 16-20 miles via US-395 South.
  Within the 25-mile outpatient access radius: Yes. has_va = Yes.
- Nearest VA hospital: Ioannis A. Lougaris Veterans' Administration Medical Center, 975 Kirman Avenue, Reno, NV 89502.
  Approximate crow-fly distance: 27 miles. Driving distance: approximately 30 miles.
- Veteran benefits: Nevada has no individual income tax; military retirement income is not taxed at the state level. Disabled veterans property-tax exemption available. State-owned field; stored in locations_stateinfo (NV row verified 2026-08-11).
- Sources:
  - https://www.va.gov/sierra-nevada-health-care/locations/carson-valley-va-clinic/
  - https://www.va.gov/sierra-nevada-health-care/locations/ioannis-a-lougaris-veterans-administration-medical-center/
  - https://www.carsoncity.gov/1239/Veterans-Services (VA transportation resource)
  - https://tax.nv.gov/faqs/veterans-tax-exemptions-faqs/

## Politics

- State party/governor: Nevada Governor Joe Lombardo is Republican. State-owned field; uses existing NV stateinfo row convention.
- City politics: Carson City voted for Trump in both 2016 and 2024 at the city level (city is a consolidated city-county; results are city-level, not county-proxy). Classification: Conservative.
- 2016 presidential results (Carson City, NV Secretary of State official results):
  - Trump: 13,125 votes; Clinton: 9,610 votes; Johnson: 1,159; other: 1,122.
  - Two-party: Trump 57.7% (13,125 / 22,735), Clinton 42.3%.
  - Stored as Trump 58%.
- 2024 presidential results (Carson City, NV Secretary of State official results):
  - Trump: 16,873 votes (54.31%); Harris: 13,375 votes (43.05%). Total with minor candidates ~31,082.
  - Two-party: Trump 55.8% (16,873 / 30,248), Harris 44.2%.
  - Stored as Trump 56%.
- Trend: rep_vote_share_change_pp = 55.8 - 57.7 = -1.9 pp (Republicans lost 1.9 pp since 2016; city moved slightly more Democratic).
  dem_vote_share_change_pp = +1.9 pp.
  ElectionChange: "1.9 pp more Democratic since 2016".
- Sources:
  - https://www.nvsos.gov/silverstate2016gen/county-results/carsoncity.shtml
  - https://www.nvsos.gov/SOSelectionPages/results/2024StateWideGeneral/CarsonCity.aspx
  - https://ballotpedia.org/Joe_Lombardo

## Crime

- AreaVibes data (2024 FBI UCR data released September 2025, via AreaVibes):
  NOTE: AreaVibes discloses that Carson City crime stats are estimated, not directly reported by the FBI in the UCR program, due to agency reporting gaps. Values are modeled estimates based on demographic data.
  - Estimated violent crime: 284 per 100,000 (estimate).
  - Estimated total crime: 1,839 per 100,000 (estimate).
  - National violent crime baseline: 359 per 100,000 (AreaVibes/FBI national).
  - TCI = (284 / 359) * 100 = 79.1, rounded to 79. (Lower is safer in this app's convention.)
  - CrimeRating: Low (below national baseline).
- Local trend context: Carson City Sheriff's Office reported a 17% reduction in overall Group A crime and similar downward violent crime trend in 2023.
- Source: https://www.areavibes.com/carson+city-nv/crime/
- Source caveat: TCI is derived from an estimated (not directly FBI-reported) figure. Use as relative comparison only.

## Cannabis

- Marijuana: Recreational. Nevada adults 21+ may legally possess and use cannabis. State-owned field.
- Source: https://ccb.nv.gov/laws-regulations/

## LGBTQ

- LGBTQ state policy score: MAP Nevada Equality Profile 42.25 / 49 (High tier). This is the same state-level score used for Reno, NV.
- LGBTQ_MEI: "Not Rated" — No 2025 HRC Municipal Equality Index scorecard found for Carson City, NV. Carson City did not appear in publicly summarized 2025 MEI rankings. Gap recorded.
- Source: https://mapresearch.org/equality-profiles/nv/

## Climate

- Station: Western Regional Climate Center / WRCC Carson City historical station (261480/261485). The NOAA API station USC00261480 returned an empty dataset; values sourced from search-corroborated secondary sources using WRCC-referenced figures.
- Annual precipitation: ~10 inches (rain_annual rounded to 10).
- Annual snowfall: ~21 inches (snow_annual rounded to 21).
- Sunny days: ~266 days per year.
- January average low: ~24°F (AverageLowWinter).
- July average high: ~88°F (AverageHighSummer).
- Summer humidity (July): ~32% (HumiditySummer).
- Climate label: High desert.
- Climate notes: High-desert semi-arid, 4,700 ft elevation. Abundant sunshine, warm dry summers, cold winters with moderate snowfall that melts quickly. Four distinct seasons.
- Sources:
  - https://carsoncitychamber.com/about-carson-city/
  - https://weatherspark.com/y/1547/Average-Weather-in-Carson-City-Nevada-United-States-Year-Round
  - https://www.ncei.noaa.gov/access/us-climate-normals/ (attempted; station returned empty for USC00261480)
  - Source caveat: Climate values are from secondary cross-referenced sources rather than a direct NOAA API pull. Verify against WRCC/NCEI when next refreshing.

## Gas

- Gas price: AAA Nevada statewide average $4.82 per gallon as of August 26, 2026. Reno metro average is $5.08. Carson City is grouped with the Nevada statewide figure.
- Source: https://gasprices.aaa.com/?state=NV

## Economy, activities, and tags

- Tech hub: No. Carson City's economy is government-led (state capital), with aerospace/defense manufacturing (Click Bond, PCC Structurals, Chromalloy Nevada) and healthcare (Carson Tahoe Health). No federally designated tech hub; the Nevada Tech Hub designation is centered on Reno-Sparks-Tahoe. TechHub = N.
- Defense hub: No strong basis for a manual true flag. Click Bond and PCC Structurals are aerospace/defense manufacturers in Carson City, but these are manufacturing employers rather than a major military installation or RTX-affiliated contractor. DefenseHub = N (manual false veto not set; default null/N judgment). Recompute script will confirm.
- Walmart: Yes (two Walmart Supercenters in Carson City: 3770 US Hwy 395 S and 3200 Market St).
- Costco: Yes (Costco Wholesale at 700 Old Clear Creek Rd, Carson City, NV).
- Sources:
  - https://www.walmart.com/store/finder?query=Carson+City+NV
  - https://www.costco.com/warehouse-locations (Carson City, NV — 700 Old Clear Creek Rd)
  - https://clickbond.com/
  - https://www.pcc-inc.com/

## Amenity backfill fields

- has_walmart: Yes — Two Walmart Supercenter locations confirmed in Carson City (3770 US Hwy 395 S; 3200 Market St).
- has_costco: Yes — One Costco Wholesale confirmed at 700 Old Clear Creek Rd, Carson City, NV.
- Sources: Walmart.com store finder; Costco.com warehouse finder.