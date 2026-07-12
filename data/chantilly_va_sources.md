# Chantilly, VA Source Notes

Retrieval date: 2026-07-10.

## Geography and economics

- Geography: Chantilly CDP in Fairfax County, VA. The row is CDP-based, while political and crime fields use the local reporting geographies noted below.
- Population and density: Census Reporter ACS 2024 5-year profile reports 24,036 people and 2,002.7 people per square mile; stored as `24,036` and `2003`.
- Housing: Zillow city-level ZHVI for Chantilly, VA reports $819,232 as of 2026-05-31. The schema field is `avg_home_value`, but the source metric is ZHVI, a typical home value.
- Cost of living: CostOfLivingData's Chantilly page reports a cost index of 193, with 100 as the U.S. average, using 2023 ACS vintage data. The imported product category is therefore `High`.
- Sales and income tax: Fairfax County lists Virginia general sales tax, county local tax, and Northern Virginia transportation tax totaling 6.0%. Virginia's top individual income tax rate is 5.75%.
- Gas: AAA Washington metro regular average was $3.911 on retrieval, rounded to `$3.91`.

## Veterans access and benefits

- VA access: VA.gov lists Fort Belvoir VA Clinic at 9300 Dewitt Loop, Fort Belvoir, VA, offering primary care and specialty services. It is roughly 25 driving miles from central Chantilly, so `has_va=Yes`.
- Benefits: Virginia Department of Veterans Services documents real estate property tax exemptions for certain disabled veterans and surviving spouses. Virginia also has a personal property vehicle tax exemption for eligible 100% disabled veterans. Virginia Tax guidance supports the military retirement pay subtraction used in the summary.

## Politics and elections

- Governor/state party: Abigail Spanberger is Virginia's current governor as of retrieval. `state_party=D` follows the existing product convention of using the governor's party.
- Chantilly is a CDP rather than an incorporated municipality, so this row uses Fairfax County Precinct 920 - Chantilly for the presidential trend and explicitly labels the political-culture field `Precinct-level: Liberal`.
- Fairfax County official 2016 precinct result for 920 - Chantilly: Clinton 1,132 and Trump 627. Two-party Democratic share = 64.35%.
- Fairfax County official 2024 precinct result for 920 - Chantilly: Harris 1,053 and Trump 645. Two-party Democratic share = 62.01%.
- Therefore Democratic two-party share decreased 2.34 percentage points, Republican share increased 2.34 points, and winner percentages are rounded to 64 and 62.

## Safety, policy, and inclusion

- Crime: Chantilly is not an incorporated city police jurisdiction. The row uses a secondary FBI-based city crime-rate summary showing violent crime at about 92 per 100,000 residents. Indexed to the FBI 2024 national violent-crime rate of 359.1 per 100,000, the normalized TCI is 26. This follows the app convention where lower is safer. The public-facing label is `Low`.
- Marijuana: Virginia Cannabis Control Authority lists personal possession, home cultivation, adult sharing, and medical cannabis as legal, while buying or selling adult-use cannabis remains illegal until the retail market opens. The row stores `Recreational` because adult personal possession/use is legal, with the retail caveat documented here.
- LGBTQ: Chantilly has no separate HRC MEI. The county scorecard is the nearest local policy geography; HRC's 2025 Fairfax County scorecard gives 100, and MAP's Virginia Equality Profile gives 25/49 overall.

## Climate and amenities

- Weather: NOAA 1991-2020 normals are the reference framework. City-level summaries based on NOAA/secondary climate data report roughly 43 inches of annual rain, 21-22 inches of annual snow, 197 sunny days, January low about 25 F, July high about 88 F, and July relative humidity about 71 percent.
- These weather values classify as `cold_snowy` under the application's fixed four-bucket rule because January low is 25 F or lower and annual snow is at least 15 inches. This is a product classification, not a Koppen classification.
- Amenities and hubs: Smithsonian's Steven F. Udvar-Hazy Center is in Chantilly and displays more than 3,000 aviation and space objects. Fairfax County Park Authority documents Ellanor C. Lawrence Park as a 650-acre park in western Fairfax County. Fairfax County / regional economic-development materials support Dulles Corridor technology access and Northern Virginia aerospace/defense cluster relevance, so `tech_hub=Y` and `defense_hub=Y`.

## Source URLs

- Census Reporter Chantilly profile: https://censusreporter.org/profiles/16000US5114744-chantilly-va/
- Zillow Chantilly ZHVI: https://www.zillow.com/home-values/30829/chantilly-va/
- Cost-of-living proxy: https://costoflivingdata.com/cost-of-living/va/chantilly/
- Fairfax County consumer taxes: https://www.fairfaxcounty.gov/taxes/consumer-taxes
- Virginia individual income tax rates: https://www.tax.virginia.gov/sites/default/files/2016-12/TAXTABLE.pdf
- AAA DC fuel prices: https://gasprices.aaa.com/?state=DC
- Fort Belvoir VA Clinic: https://www.va.gov/washington-dc-health-care/locations/fort-belvoir-va-clinic/
- Virginia DVS tax exemptions: https://www.dvs.virginia.gov/benefits-services/tax-exemptions
- Governor of Virginia biography: https://www.governor.virginia.gov/about-the-governor/
- Fairfax County 2016 official election results: https://www.fairfaxcounty.gov/elections/sites/elections/files/Assets/result/historical/2016_11_NOVEMBER_GENERAL_RESULTS.pdf
- Fairfax County 2024 official election results: https://www.fairfaxcounty.gov/elections/sites/elections/files/Assets/Documents/PDF/2024-11-05%20General%20and%20Special%20Elections%20-%20Official%20Results.pdf
- Chantilly crime cross-check: https://www.areavibes.com/chantilly-va/crime/
- FBI 2024 national violent-crime rate reference: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Virginia Cannabis Control Authority laws: https://cca.virginia.gov/laws
- HRC 2025 Fairfax County MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Fairfax-County-Virginia.pdf
- MAP Virginia Equality Profile: https://mapresearch.org/equality-profiles/va/
- NOAA U.S. Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- BestPlaces Chantilly climate summary: https://www.bestplaces.net/climate/city/virginia/chantilly
- Weather Atlas Chantilly July humidity: https://www.weather-atlas.com/en/virginia-usa/chantilly-weather-july
- Smithsonian Udvar-Hazy Center: https://airandspace.si.edu/visit/udvar-hazy-center
- Ellanor C. Lawrence Park: https://www.fairfaxcounty.gov/parks/eclawrence
- Fairfax County Economic Development Authority: https://fairfaxcountyeda.org/
- Virginia Economic Development Partnership aerospace: https://www.vedp.org/industry/aerospace
