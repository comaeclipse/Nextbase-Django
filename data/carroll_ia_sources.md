# Carroll, Iowa Source Notes

Retrieval date: 2026-07-10

## Identity and Geography

- Geography: Carroll city, Carroll County, Iowa.
- Population: U.S. Census QuickFacts lists Carroll city's July 1, 2025 estimate at 10,085 and 2020 land area at 5.74 square miles. Density was calculated as 10,085 / 5.74 = 1,757 people per square mile.
- Sources:
  - https://www.census.gov/quickfacts/fact/table/carrollcityiowa/BZA115223
  - https://www.cityofcarroll.com/carroll-government/contact-us-government/

## Housing and Cost of Living

- Home value: Zillow's Carroll, IA ZHVI page reports $208,569, updated 2026-05-31. Stored as `$208,569`.
- Cost of living: Apartments.com reports Carroll cost of living at 7.4% below the national average. Stored as index 93 and derived category `Low`.
- Sources:
  - https://www.zillow.com/home-values/9829/carroll-ia/
  - https://www.apartments.com/cost-of-living/carroll-ia/

## Taxes and Gas

- Sales tax: Carroll County combined 2026 sales tax is 7.00%: 6.00% Iowa state plus 1.00% county/local option.
- Income tax: Iowa's 2026 individual income tax rate is a flat 3.80%.
- Gas: AAA Iowa regular average was $3.681 on 2026-07-10; stored as `$3.68`.
- Sources:
  - https://www.avalara.com/us/en/taxrates/state-rates/iowa/counties/carroll-county.html
  - https://revenue.iowa.gov/press-release/2025-10-21/idr-announces-2026-individual-income-tax-and-interest-rates
  - https://gasprices.aaa.com/?state=IA

## Veterans Affairs

- VA access: Carroll VA Clinic is at 311 South Clark Street, Suite 275, Carroll, IA, about 1 mile from Carroll City Hall at 627 N Adams St. Stored as `VA=Yes`, `NearestVA=Carroll VA Clinic`, `DistanceToVA=1 mile`.
- Veterans benefits: Iowa exempts military retirement pay and survivor benefits from state income tax and offers disabled-veteran homestead property tax relief plus state and county veterans services.
- Sources:
  - https://www.va.gov/central-iowa-health-care/locations/carroll-va-clinic/
  - https://dva.iowa.gov/locations/carroll-va-clinic
  - https://www.carrollcountyiowa.gov/pview.aspx?catid=0&id=20972
  - https://www.cityofcarroll.com/carroll-government/contact-us-government/
  - https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Iowa
  - https://revenue.iowa.gov/taxes/tax-guidance/tax-credits-deductions-exemption/disabled-veteran-homestead-property-tax-credit

## Politics and Elections

- State party/governor: Iowa currently has Republican state government control and Governor Kim Reynolds is a Republican.
- County-level presidential results:
  - 2016 Carroll County official results: Trump/Pence 6,638; Clinton/Kaine 3,309. Two-party Republican share = 6,638 / (6,638 + 3,309) = 66.7%, stored as Trump 67.
  - 2024 Carroll County official results: Trump/Vance 7,814; Harris/Walz 3,153. Two-party Republican share = 7,814 / (7,814 + 3,153) = 71.3%, stored as Trump 71.
  - Trend: Republican two-party share rose 4.5 percentage points; Democratic share fell 4.5 percentage points.
- City politics: no city-level 2024 presidential precinct table was found in the county's published summary results. Stored with a geography qualifier as `County-level: Strongly Conservative` because Carroll County presidential and down-ballot results are strongly Republican.
- Sources:
  - https://ballotpedia.org/Party_control_of_Iowa_state_government
  - https://governor.iowa.gov/meet-governor-kim-reynolds
  - https://www.carrollcountyiowa.gov/docview.aspx?docid=31562
  - https://www.carrollcountyiowa.gov/docview.aspx?docid=31927
  - https://sos.iowa.gov/elections/pdf/2016/general/canvsummary.pdf
  - https://sos.iowa.gov/elections/pdf/2024/general/canvsummary.pdf
  - https://www.carrollcountyiowa.gov/pview.aspx?catid=0&id=20994

## Safety and Social Policy

- Crime/TCI: Direct FBI city-level extraction was not available during retrieval. Niche reports Carroll violent crime components of assault 39.5, murder 0, rape 0, and robbery 0 per 100,000. Using the repo's open proxy method against the FBI 2024 national violent crime rate of 359.1 gives 39.5 / 359.1 * 100 = 11.0, stored as TCI 11 and `Low`.
- Marijuana: Iowa has a medical cannabis program.
- LGBTQ: Carroll was not found in the HRC 2025 MEI city set during retrieval. MAP lists Iowa's overall LGBTQ policy score as -1.5/49. Stored city LGBTQ and MEI blank, state policy score -1.50, and source text `MAP Iowa state policy score; no Carroll MEI score located`.
- Sources:
  - https://www.niche.com/places-to-live/carroll-carroll-ia/crime-safety/
  - https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
  - https://hhs.iowa.gov/health-prevention/medical-cannabis
  - https://hhs.iowa.gov/health-prevention/medical-cannabis/law-enforcement-and-public-safety
  - https://reports.hrc.org/municipal-equality-index-2025
  - https://mapresearch.org/equality-profiles/ia/

## Weather and Climate

- Rain/snow/sun: BestPlaces reports 34 inches of rain, 28 inches of snow, and 209 sunny days for Carroll.
- Temperature: WeatherSpark reports January average low 14 F and July average high 85 F.
- Humidity: Time and Date reports July average humidity 69%.
- Climate label: Humid continental. The local categorizer classifies this row as `cold_snowy` because January low is below 25 F and snow is above 15 inches.
- Sources:
  - https://www.bestplaces.net/climate/city/iowa/carroll
  - https://weatherspark.com/y/9892/Average-Weather-in-Carroll-Iowa-United-States-Year-Round
  - https://www.timeanddate.com/weather/%404850478/climate
  - https://usclimatedata.com/climate/carroll/iowa/united-states/usia0129

## Hubs, Healthcare, and Lifestyle

- Healthcare: St. Anthony Regional Hospital is located in Carroll at 311 South Clark Street and offers 24/7 hospital services; the Carroll VA Clinic is at the same medical campus.
- Education/community college: DMACC has a Carroll location at 906 North Grant Road.
- Recreation and culture: Carroll has an 18-hole municipal golf course, the Sauk Rail Trail, Swan Lake State Park access, Carroll Arts Council/Community Theater, Fridley 5 Theater, and Live + Local music programming.
- Tech/defense hubs: no federal Tech Hub designation, major defense installation, or defense employment cluster was found for Carroll; stored `TechHub=N`, `DefenseHub=N`.
- Sources:
  - https://stanthonyhospital.org/patients-and-visitors/locations/st-anthony-regional-hospital
  - https://www.dmacc.edu/carroll/
  - https://www.dmacc.edu/maps.html
  - https://www.cityofcarroll.com/carroll-government/municipal-golf-course/
  - https://www.cityofcarroll.com/carroll-life/trails/
  - https://www.mycountyparks.com/county/carroll/Park/Swan-Lake-State-Park/Activity/Trails-Hiking
  - https://www.cityofcarroll.com/carroll-life/art-theater-music/
  - https://www.carrolliowa.com/newpage7539bc24
  - https://www.cityofcarroll.com/carroll-government/economic-development/
  - https://www.westerniowaadvantage.com/news-and-resources/p/item/51526/ccgp-partners-with-win-to-establish-hub-712-and-innovation-center-in-downtown-carroll
