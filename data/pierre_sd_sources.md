# Pierre, South Dakota Source Notes

Retrieval date: 2026-07-23.

## Baseline and geography

- Current Neon baseline before import: Pierre, SD was not present. South Dakota rows were Rapid City and Sioux Falls. Baseline coverage was 93 `locations_location` rows, 50 `locations_stateinfo` rows, 60 missing tags, 61 missing TCI, 51 missing descriptions, 54 missing VA-access fields, and 58 missing election-trend fields.
- Geography: Pierre city, Hughes County, South Dakota.
- Population and density: Census QuickFacts reports a July 1, 2025 population estimate of 13,848 and 2020 land area of 13.03 square miles. Density is calculated as 13,848 / 13.03 = 1,063 people per square mile.
- Sources:
  - https://www.census.gov/quickfacts/fact/table/pierrecitysouthdakota/PST045225

## Housing, cost of living, and taxes

- Home value: Zillow reports Pierre ZHVI / average home value of $304,546, updated June 30, 2026.
- Cost of living: Apartments.com reports Pierre's overall cost of living as 10.5% below the national average. Stored as index 90 and derived category `Low`.
- Sales tax: Avalara reports Pierre's minimum combined 2026 sales tax rate as 6.2%. South Dakota Department of Revenue states the state sales/use tax rate is 4.2% and municipalities may generally impose 1% to 2%.
- Income tax: South Dakota has no state individual income tax. Stored as 0.00.
- Gas: AAA reports South Dakota regular gas at $4.023 on July 23, 2026. Stored as `$4.02`; no Pierre-specific AAA metro average was available.
- Sources:
  - https://www.zillow.com/home-values/6499/pierre-sd/
  - https://www.apartments.com/cost-of-living/pierre-sd/
  - https://www.avalara.com/us/en/taxrates/state-rates/south-dakota/cities/pierre.html
  - https://dor.sd.gov/individuals/taxes/sales-use-tax/
  - https://dor.sd.gov/businesses/taxes/municipal-tax/
  - https://taxfoundation.org/location/south-dakota/
  - https://gasprices.aaa.com/?state=SD

## VA access, veteran benefits, and healthcare

- VA access: Pierre VA Clinic is at 1615 North Harrison, Suite 20, Pierre, and offers outpatient primary care. Stored as `VA=Yes`, `NearestVA=Pierre VA Clinic`, with an approximate 2-mile city-center distance.
- Veteran benefits: South Dakota provides state veterans-affairs assistance and employment preference. Qualifying permanently and totally disabled veterans receive a $200,000 owner-occupied property-tax exemption; qualifying surviving spouses receive a $150,000 exemption. The state has no individual income tax.
- Healthcare context: Avera St. Mary's Hospital is an open 24/7 hospital in Pierre at 801 E Sioux Ave.
- Sources:
  - https://www.va.gov/black-hills-health-care/locations/pierre-va-clinic/
  - https://vetaffairs.sd.gov/benefits/State/intro%20to%20state%20benefits.aspx
  - https://vetaffairs.sd.gov/benefits/State/Property%20Taxes.aspx
  - https://locations.avera.org/avera-st-marys-hospital

## Politics and elections

- State classification: Republican state government / Republican Governor Larry Rhoden as of retrieval.
- Election data uses Hughes County presidential returns and two-party shares.
  - 2016: Trump 5,174 and Clinton 2,450. Republican two-party share = 67.86%, stored as Trump 68.
  - 2024: Trump 5,379 and Harris 2,838. Republican two-party share = 65.46%, stored as Trump 65.
  - Change: Republican two-party share declined 2.40 percentage points, so `rep_vote_share_change_pp=-2.4` and `dem_vote_share_change_pp=2.4`.
- I did not find city-only presidential returns suitable for this ingest, so `CityPolitics` is explicitly qualified as county-level. Hughes County's 2024 two-party result is just over 65% Republican, which maps to `Strongly Conservative` under the repository threshold vocabulary.
- Sources:
  - https://governor.sd.gov/governor/about.aspx
  - https://sdsos.gov/elections-voting/assets/ElectionReturns2016_Web.pdf
  - https://sdsos.gov/elections-voting/assets/2024%20Assets/Post-Election-Audit-General/ElectionReturns2024.pdf

## Safety, social policy, and climate

- Crime: Direct FBI city export was not available during retrieval. OpenCrime presents an FBI-based 2024 Pierre violent-crime rate of 506.4 per 100,000. Using the repo's transparent TCI method against the FBI 2024 national violent-crime rate of 359.1 per 100,000 gives 506.4 / 359.1 * 100 = 141. `Moderate` is used because Pierre is above the national violent-crime baseline but below the high-TCI cities already labeled high in this dataset.
- Marijuana: South Dakota has a medical-cannabis program; stored as `Medical`.
- LGBTQ: HRC's 2025 Pierre MEI scorecard gives Pierre a final score of 12. MAP's South Dakota Equality Profile gives an overall policy score of -9.5/49. Stored as `LGBTQ=12`, `LGBTQ_MEI=12`, and `LGBTQStatePolicyScore=-9.50`.
- Weather: Travel South Dakota's Pierre climate table gives January low 10 F, July high 89 F, annual precipitation 19.93 inches, and annual snowfall 31 inches. Timeanddate's Pierre Regional Airport climate averages show July humidity at 64%. `SunnyDays` is blank because I did not find a consistent source matching the repo's standard. The repository climate rules classify the row `cold_snowy` because annual snow is at least 30 inches.
- Sources:
  - https://www.opencrime.us/cities/pierre-south-dakota
  - https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
  - https://medicalcannabis.sd.gov/
  - https://www.hrc.org/resources/municipalities/pierre-sd
  - https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Pierre-South-Dakota.pdf
  - https://mapresearch.org/equality-profiles/sd/
  - https://www.travelsouthdakota.com/trip-ideas/weather-seasons
  - https://www.timeanddate.com/weather/usa/pierre/climate

## Lifestyle, employers, and known gaps

- Pierre is a small state capital on the Missouri River. Source-backed lifestyle signals include Missouri River / Lake Oahe / Lake Sharpe fishing, Farm Island State Recreation Area trails and water access, Steamboat Park, and Hillsview Public Golf Course.
- `TechHub=N`: I found no federal EDA Tech Hub designation for Pierre.
- `DefenseHub` is left blank rather than set to `N`. Pierre has state military administration offices, but I did not find a major military installation or defense-employer presence that should create a retiree-facing defense-hub claim.
- Known gaps / caveats: no city-only presidential return was used, no direct FBI export was retrieved for city crime, no consistent sunny-days source was found, gas is state-level rather than Pierre-specific AAA metro data, and `DefenseHub` remains unknown rather than negatively asserted.
- Sources:
  - https://www.cityofpierre.org/189/Parks
  - https://www.travelsouthdakota.com/pierre-outdoor-fun-state-capital
  - https://www.sdmissouririver.com/plan/cities-communities/pierre-fort-pierre/
  - https://pierre.org/your-community/fishing/
  - https://www.sdmissouririver.com/directory/category/golfing-waterparks/
  - https://www.eda.gov/funding/programs/regional-technology-and-innovation-hubs
  - https://installations.militaryonesource.mil/state/SD/state-installations
