# Pueblo, CO Source Notes

Retrieval date: 2026-07-10.

## Geography and economics

- Geography: Pueblo city in Pueblo County, CO. The row is city-based; election fields use Pueblo County returns because official city-only presidential returns were not located during this pass.
- Population and density: Census Reporter ACS 2024 1-year profile reports 111,156 people, 56.6 square miles, and 1,963.3 people per square mile; stored as `111,156` and `1963`.
- Housing: Zillow's Pueblo, CO housing market page reports a city-level ZHVI of $286,843 through 2026-05-31. The schema field is `avg_home_value`, but the source metric is ZHVI, a typical home value.
- Cost of living: CostOfLivingData's Pueblo page reports a cost index of 76, with 100 as the U.S. average, using 2023 ACS vintage data. The imported product category is therefore `Low`.
- Sales and income tax: Pueblo's official sales-tax FAQ gives a 7.6% total rate: 3.7% city, 2.9% state, and 1.0% county. Colorado's individual income tax guide lists a 4.4% tax rate for tax year 2025.
- Gas: AAA's Pueblo metro regular average was $3.615 on retrieval, rounded to `$3.62`.

## Veterans access and benefits

- VA access: VA.gov lists the PFC James Dunn VA Clinic at 4776 Eagleridge Circle, Pueblo, CO, with primary care, pharmacy, laboratory/pathology, nutrition, and patient advocate services. It is roughly 5 driving miles from central Pueblo, so `has_va=Yes`.
- Benefits: Colorado military and veterans benefits summaries document military retired pay tax subtractions, disabled veteran and surviving spouse property tax exemption, education and tuition assistance, vehicle plates, and hunting/fishing license benefits.

## Politics and elections

- Governor/state party: Governor Jared Polis (D) is current as of retrieval. `state_party=D` follows the existing product convention of using the governor's party.
- Official Pueblo County 2016 presidential results: Trump 36,265 and Clinton 35,875. Two-party Republican share = 50.27%.
- Official Pueblo County 2024 presidential results: Trump 36,068 and Harris 34,478. Two-party Republican share = 51.13%.
- Therefore Republican two-party share increased 0.86 percentage points, Democratic share decreased 0.86 points, and winner percentages are rounded to 50 and 51. Because both elections were close, the political-culture field is labeled `County-level: Mixed / Swing` rather than a stronger conservative label.

## Safety, policy, and inclusion

- Crime: A public city crime-rate cross-check reports Pueblo violent crime at about 1,424 per 100,000 residents. Indexed to the FBI 2024 national violent-crime rate of 359.1 per 100,000, the normalized TCI is 397. The public-facing label is `High`. The Pueblo Police Department's 2025 annual crime update says overall Part One crime fell 5% from 2024 to 2025 and homicides fell from 20 to 13, but the imported index remains high because the app field is cross-sectional rather than a year-over-year trend note.
- Marijuana: Colorado permits adult-use cannabis, and Pueblo's official marijuana information page explicitly covers both medical and recreational home-grow regulations. The row stores `Recreational`.
- LGBTQ: No Pueblo HRC Municipal Equality Index scorecard was found. The row stores the MAP Colorado Equality Profile overall policy score of 45.5/49 and leaves `LGBTQ_MEI` blank.

## Climate and amenities

- Weather: NOAA/NWS Pueblo describes the local climate as high plains desert, with about 11 inches of liquid precipitation per year, more than 300 days with sunshine per year, low summer humidity, and about 30 inches of annual snow. Weather Atlas city climate summaries report January low about 25.7 F, July high about 89.2 F, and July relative humidity about 41%; the NWS station digest describes summer daytime highs in the lower to middle 90s, so the row stores 92 F for the app's summer-high field.
- These values classify as `cold_snowy` under the application's fixed four-bucket rule because annual snow is at least 30 inches. This is a product classification; the source climate description is semi-arid high plains.
- Amenities and hubs: Lake Pueblo State Park supports boating, fishing, hiking, and biking; the Historic Arkansas Riverwalk is a 32-acre urban waterfront downtown; the Colorado State Fair is held in Pueblo. Pueblo has manufacturing and green-technology economic-development activity, but no city-scale technology or defense cluster meeting the product definition was sourced, so `tech_hub=N` and `defense_hub=N`.

## Source URLs

- Census Reporter Pueblo profile: https://censusreporter.org/profiles/16000US0862000-pueblo-co/
- Zillow Pueblo housing market: https://www.zillow.com/home-values/395910/pinon-pueblo-co/
- Cost-of-living proxy: https://costoflivingdata.com/cost-of-living/co/pueblo/
- Pueblo sales-tax FAQ: https://www.pueblo.us/FAQ.aspx?QID=79
- Colorado individual income tax guide: https://tax.colorado.gov/individual-income-tax-guide
- AAA Colorado/Pueblo fuel prices: https://gasprices.aaa.com/?state=CO
- PFC James Dunn VA Clinic: https://www.va.gov/eastern-colorado-health-care/locations/pfc-james-dunn-va-clinic/
- Colorado military and veterans benefits: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Colorado
- National Governors Association Jared Polis profile: https://www.nga.org/governor/jared-polis/
- Pueblo County previous election results index: https://county.pueblo.org/clerk-and-recorder-department/previous-election-results-cast-vote-records
- Pueblo County 2016 November official summary: https://live-pueblo-county.pantheonsite.io/sites/default/files/2020-01/2016%20November%20Summary.pdf
- Pueblo County 2024 general election official results: https://county.pueblo.org/clerk-and-recorder-department/2024-general-election-official-results
- Pueblo County 2024 general election summary PDF: https://county.pueblo.org/sites/default/files/2024-11/2024%20pueblo%20county%20general%20election%20-%209%20pm.pdf
- Pueblo Police 2025 crime update: https://www.pueblo.us/m/newsflash/Home/Detail/4910
- Pueblo crime-rate cross-check: https://www.areavibes.com/pueblo-co/crime/
- FBI 2024 national violent-crime rate reference: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Pueblo marijuana information: https://www.pueblo.us/1933/Marijuana-Information
- MAP Colorado Equality Profile: https://mapresearch.org/equality-profiles/co/
- NOAA U.S. Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- NWS Pueblo station digest: https://www.weather.gov/pub/stationDigest
- Pueblo Weather Atlas climate summary: https://www.weather-atlas.com/en/colorado-usa/pueblo-climate
- Lake Pueblo State Park: https://cpw.state.co.us/state-parks/lake-pueblo-state-park
- Lake Pueblo activities and trails: https://cpw.state.co.us/state-parks/lake-pueblo-state-park/lake-pueblo-state-park-activities-trails
- Historic Arkansas Riverwalk: https://www.puebloriverwalk.org/
- Colorado State Fair: https://coloradostatefair.com/
- Pueblo Economic Development Corporation: https://www.pedco.org/
