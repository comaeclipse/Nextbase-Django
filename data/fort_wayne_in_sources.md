# Fort Wayne, IN Source Notes

- Retrieval guide: `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` was reviewed for the active TS/Neon import path, source priority, one-city scoped `climate_category` update guidance, and verification checklist.
- Current DB baseline before import: Fort Wayne, IN was not present. Baseline coverage was 80 `locations_location` rows, 50 `locations_stateinfo` rows, 60 missing tags, 60 missing TCI, 51 missing descriptions, 54 missing VA-access fields, and 58 missing election trend fields.
- Geography and demographics: Census Reporter reports Fort Wayne, IN at 273,425 population, 111.8 square miles, and 2,446.5 people per square mile from ACS 2024 1-year data. Density is rounded to 2,447.
- Current state-party convention: the row follows the existing product convention of using the current governor party for `state_party` and `governor`; Indiana's official governor page identifies Mike Braun as governor, and Ballotpedia identifies him as Republican, so both fields are `R`.
- Elections: Allen County official presidential totals were used because I could not prove a city-only precinct aggregation from the available current files without a verified Fort Wayne precinct crosswalk. The 2016 Allen County official summary reports Trump 83,867 and Clinton 55,379. The 2024 Allen County official results report Trump 90,283 and Harris 69,960. Two-party Republican share changed from 60.23 percent in 2016 to 56.34 percent in 2024, so `rep_vote_share_change_pp = -3.9` and `dem_vote_share_change_pp = 3.9`. Winner percentages are rounded whole two-party shares. Because the source geography is county-level and the 2024 Republican two-party share is 55-64.9 percent, `city_politics` is stored as `County-level: Conservative`.
- Taxes: Indiana Department of Revenue lists a 7 percent sales tax and a 2026 individual adjusted gross income tax rate of 2.95 percent.
- Cost and housing: PayScale reports Fort Wayne's cost of living as 7 percent lower than the national average, so `CostOfLiving` is stored as 93. Zillow's Fort Wayne ZHVI page reports a typical home value of $248,474, updated May 31, 2026.
- VA access and veteran benefits: VA lists Fort Wayne VA Medical Center at 2121 Lake Avenue in Fort Wayne, so `VA=Yes` and `DistanceToVA=0 miles`. Indiana veteran benefit sources document military pay and retired pay tax exemptions, disabled-veteran property-tax benefits, education/tuition assistance, military plates, hunting/fishing licenses, and state park privileges; the row stores a concise summary rather than eligibility detail.
- Crime: OpenCrime reports Fort Wayne's 2024 violent-crime rate as 307.5 per 100,000, with a C safety grade. Using the repo's open TCI method against the FBI 2024 national violent-crime rate of 359.1 per 100,000 gives 307.5 / 359.1 * 100 = 85.6, rounded to 86. The display label is `Moderate`.
- Cannabis: Indiana Code treats possession of marijuana, hash oil, hashish, or salvia as a misdemeanor unless enhanced circumstances apply, and current policy coverage describes Indiana as without an effective medical cannabis law. The row stores `Illegal`.
- LGBTQ: HRC's 2025 Fort Wayne Municipal Equality Index scorecard reports a final score of 39. MAP's Indiana Equality Profile reports Sexual Orientation Policy Score 1.75/23, Gender Identity Policy Score -8/26, and Overall Score -6.25/49, stored as `lgbtq_state_policy_score = -6.25`.
- Economy and tags: Greater Fort Wayne Inc. identifies Fort Wayne and Allen County as home to a growing aerospace and defense sector with the 122nd Fighter Wing and firms including BAE Systems, General Dynamics, L3Harris, Raytheon Technologies, and others, so `DefenseHub=Y`. I did not find enough evidence to classify Fort Wayne as a broad tech hub, so `TechHub=N`. Visit Fort Wayne and city pages support arts, culture, parks/trails, riverfront, and public golf tags.
- Climate: National Weather Service Fort Wayne climate guidance reports average snowfall of 33.6 inches per year. BestPlaces reports 38 inches of annual rain and 182 sunny days. WeatherSpark reports January average low of 20 F and July average high of 83 F. Timeanddate reports July average humidity of 71 percent. The display climate is `Humid continental`; the app `climate_category` should be `cold_snowy` because annual snow is at least 30 inches.
- Gas: AAA Fuel Prices reported Indiana regular gasoline at $3.256 on July 11, 2026, rounded to `$3.26`.

## URLs

- Census Reporter Fort Wayne profile: https://censusreporter.org/profiles/16000US1825000-fort-wayne-in/
- Indiana governor official page: https://www.in.gov/gov/about-the-governor/about-governor-mike-braun/
- Ballotpedia Mike Braun party cross-check: https://ballotpedia.org/Mike_Braun
- Allen County 2024 results page: https://www.allencounty.in.gov/954/2024-Results
- Allen County 2024 official results PDF: https://www.allencounty.in.gov/DocumentCenter/View/9425/2024-General-Official-Results-PDF
- Allen County 2024 office-detail PDF: https://www.allencounty.in.gov/DocumentCenter/View/9422/2024-General-Official-Office-Detail-PDF
- Allen County 2016 results page: https://www.allencounty.in.gov/960/2016-Results
- Allen County 2016 official summary PDF: https://www.allencounty.in.gov/DocumentCenter/View/9397/2016-General-Election-Summary-Final-PDF
- Indiana sales tax: https://www.in.gov/dor/i-am-a/business-corp/sales-tax/
- Indiana income tax rates: https://www.in.gov/dor/resources/tax-rates-and-reports/rates-fees-and-penalties/
- PayScale Fort Wayne cost of living: https://www.payscale.com/cost-of-living-calculator/Indiana-Fort-Wayne
- Zillow Fort Wayne home values: https://www.zillow.com/home-values/18170/fort-wayne-in/
- Fort Wayne VA Medical Center: https://www.va.gov/find-locations/facility/vha_610A4
- VA Northern Indiana health care: https://www.va.gov/northern-indiana-health-care/
- Indiana disabled veteran property tax benefits: https://www.in.gov/dva/divisions/training-and-services/disabled-veteran-property-tax-deduction/
- Indiana military and veterans benefits: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Indiana
- OpenCrime Fort Wayne: https://www.opencrime.us/cities/fort-wayne-indiana
- FBI 2024 national crime summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Indiana marijuana possession statute: https://law.justia.com/codes/indiana/title-35/article-48/chapter-4/section-35-48-4-11/
- Marijuana Policy Project Indiana: https://www.mpp.org/states/indiana/
- HRC Fort Wayne MEI 2025 scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Fort-Wayne-Indiana.pdf
- MAP Indiana Equality Profile: https://mapresearch.org/equality-profiles/in/
- Greater Fort Wayne aerospace and defense cluster: https://www.greaterfortwayneinc.com/industry-clusters/aerospace-and-defense/
- Visit Fort Wayne: https://www.visitfortwayne.com/
- Fort Wayne city newcomers parks/golf page: https://www.cityoffortwayne.in.gov/1069/Newcomers
- National Weather Service Fort Wayne climate: https://www.weather.gov/iwx/climatology_fortwayne_climate
- BestPlaces Fort Wayne climate: https://www.bestplaces.net/climate/city/in.aspx_not_found/fort_wayne
- WeatherSpark Fort Wayne climate: https://weatherspark.com/y/15330/Average-Weather-in-Fort-Wayne-Indiana-United-States-Year-Round
- Timeanddate Fort Wayne climate averages: https://www.timeanddate.com/weather/usa/fort-wayne/climate
- AAA Indiana gas prices: https://gasprices.aaa.com/?state=IN
