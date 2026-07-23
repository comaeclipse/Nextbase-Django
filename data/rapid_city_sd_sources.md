# Rapid City, South Dakota Source Notes

Retrieval date: 2026-07-16.

## Geography and housing

- Geography: Rapid City city, Pennington County, South Dakota.
- Population and density: Census QuickFacts reports a July 1, 2025 population estimate of 80,589 and 2020 land area of 54.70 square miles. Density is calculated as 80,589 / 54.70 = 1,473 people per square mile.
- Home value: Zillow reports a Rapid City ZHVI of $367,620, updated in July 2026.
- Cost of living: Apartments.com, drawing its consumer-cost inputs from C2ER, reports Rapid City overall cost of living as 1.7% below the U.S. average. Stored as index 98 and derived category `Moderate`.
- Sources:
  - https://www.census.gov/quickfacts/fact/table/rapidcitycitysouthdakota/PST045225
  - https://www.zillow.com/home-values/13444/rapid-city-sd/
  - https://www.apartments.com/cost-of-living/rapid-city-sd/

## Taxes, VA access, and veteran benefits

- Sales tax: Rapid City's minimum combined 2026 rate is 6.2%. South Dakota has no individual income tax.
- VA access: the Rapid City VA Clinic is at 2165 Promise Road in Rapid City. Its local outpatient primary-care services support `VA=Yes`; distance is an approximate 2 miles from City Hall at 300 6th Street.
- Veteran benefits: South Dakota provides state/county veterans-service assistance and employment preference. Qualifying permanently and totally disabled veterans receive a $200,000 owner-occupied property-tax exemption; qualifying surviving spouses receive a $150,000 exemption. The state has no individual income tax.
- Sources:
  - https://www.avalara.com/us/en/taxrates/state-rates/south-dakota/cities/rapid-city.html
  - https://dor.sd.gov/businesses/taxes/municipal-tax/
  - https://www.va.gov/black-hills-health-care/locations/rapid-city-va-clinic/
  - https://vetaffairs.sd.gov/benefits/State/intro%20to%20state%20benefits.aspx
  - https://vetaffairs.sd.gov/benefits/State/Property%20Taxes.aspx

## Politics and elections

- State classification: Republican state government / Republican Governor Larry Rhoden as of retrieval.
- Election data uses official Pennington County presidential returns and two-party shares.
  - 2016: Trump 29,804 and Clinton 14,074. Republican two-party share = 67.93%, stored as Trump 68.
  - 2024: Trump 35,009 and Harris 20,051. Republican two-party share = 63.59%, stored as Trump 64.
  - Change: Republican two-party share declined 4.34 percentage points, so `rep_vote_share_change_pp=-4.3` and `dem_vote_share_change_pp=4.3`.
- No city-only 2024 presidential result was used; `city_politics` is explicitly qualified as county-level. Pennington County's 2024 two-party result is 63.6% Republican, which maps to `Conservative` under the repository threshold vocabulary.
- Sources:
  - https://sdsos.gov/elections-voting/assets/ElectionReturns2016_Web.pdf
  - https://sdsos.gov/elections-voting/assets/2024%20Assets/Post-Election-Audit-General/ElectionReturns2024.pdf
  - https://electionresults.sd.gov/ResultsSW.aspx?cty=02&eid=684&map=CTY&type=CTYALL

## Safety, social policy, and climate

- Safety: the FBI 2024 city submission reports 582 violent crimes and a violent-crime rate of 718.9 per 100,000. The stored `TCI=202` is the repository proxy: 718.9 / 359.1 (2024 FBI national violent-crime rate) * 100, rounded. `CrimeRating=High`. Rapid City's police department separately reports 1,065 incidents in its broader local violent-crime workload definition, so the numeric TCI follows the FBI-comparable definition.
- Marijuana: South Dakota has a medical-cannabis program; stored as `Medical`.
- LGBTQ: MAP's current South Dakota Equality Profile gives an overall policy tally of -9.5/49. Rapid City was not found in HRC's 2025 South Dakota MEI city listing, so municipal LGBTQ rating and MEI score are blank rather than inferred.
- Weather: Timeanddate's Ellsworth AFB station (7 miles from Rapid City; 1992-2021 reports) gives January average low 15 F, July average high 87 F, July humidity 57%, and annual precipitation 16.43 inches. A local climate summary reports 39.1 inches of average annual snow. `SunnyDays` is blank because a consistent source was not found. The repository climate rules classify the row `cold_snowy` because snow is at least 30 inches.
- Sources:
  - https://www.rcgov.org/departments/police-department/stats-reports-and-forms.html
  - https://crime-data-explorer.fr.cloud.gov/
  - https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
  - https://medicalcannabis.sd.gov/
  - https://mapresearch.org/equality-profiles/SD/
  - https://www.hrc.org/resources/mei-state/south-dakota
  - https://www.timeanddate.com/weather/usa/rapid-city/climate
  - https://www.city-data.com/us-cities/The-Midwest/Rapid-City-Geography-and-Climate.html

## Healthcare, outdoor access, and defense presence

- Rapid City is the regional service center for the Black Hills, with Rapid City Medical Center and the VA clinic. The city and region offer hiking, biking, public golf, and municipal parks.
- Ellsworth AFB is about 10 miles east of Rapid City, home to the 28th Bomb Wing, and had 4,100 Airmen and DoD civilians in its 2023 impact statement. `DefenseHub=Y` is a documented metropolitan-area judgment; the importer maps it to `defense_hub_manual` and the stored flag remains derived by the recompute workflow.
- `TechHub=N`: no federal Tech Hub designation was found.
- Sources:
  - https://rapidcitymedicalcenter.com/
  - https://www.rcgov.org/departments/parks-recreation/parks-division/municipal-parks/municipal-parks-322.html
  - https://www.visitrapidcity.com/things-to-do/outdoor-recreation/
  - https://www.visitrapidcity.com/things-to-do/outdoor-recreation/biking/
  - https://www.visitrapidcity.com/things-to-do/outdoor-recreation/golf/
  - https://www.ellsworth.af.mil/Portals/146/Ellsworth%202023%20Economic%20impact%20statement.pdf
