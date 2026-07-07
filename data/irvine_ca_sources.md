# Irvine, CA Source Notes

Retrieval date: 2026-07-07.

## Geography

- Primary geography: Irvine city limits, Orange County, CA.
- Population and density: city limits. Density is calculated from Census QuickFacts July 1, 2024 population estimate, 318,683, divided by 2020 land area, 65.61 square miles, yielding about 4,857 people per square mile.
- Climate: Santa Ana John Wayne Airport NOAA station `USW00093184`, used as the representative nearby station for Irvine.
- VA access: straight-line distance from Irvine City Hall, 1 Civic Center Plaza, to Santa Ana VA Clinic, 1506 Brookhollow Drive. Coordinates were geocoded with OpenStreetMap/Nominatim and distance was calculated with the haversine formula.
- Elections: Irvine city-level presidential returns from California Secretary of State political-district-within-county spreadsheets. Percent fields are two-party winner share, rounded to whole percent.
- Crime: `TCI` is a violent-crime-rate proxy indexed to the 2024 national violent crime rate, not a total-crime FBI index. OpenCrime reports Irvine's 2024 violent crime rate as 84.0 per 100,000; FBI's 2024 national rate is 359.1 per 100,000, so 84.0 / 359.1 * 100 = 23.4, rounded to 23.
- Cost of living: ERI city cost-of-living estimate says Irvine is 46 percent above the national average; stored as index 146.
- Summer humidity: left blank because the NOAA monthly normals file used for John Wayne Airport does not provide a relative-humidity normal. A secondary source was reviewed but not ingested because it caused the app's climate categorizer to misclassify Irvine as hot/humid.

## Source URLs

- Census QuickFacts, Irvine city population and land area: https://www.census.gov/quickfacts/fact/table/irvinecitycalifornia/HCN010222
- Zillow Irvine ZHVI, updated 2026-05-31: https://www.zillow.com/home-values/52650/irvine-ca/
- CDTFA city and county sales tax rates, effective 2026-07-01: https://cdtfa.ca.gov/taxes-and-fees/rates.aspx
- Tax Foundation California tax profile: https://taxfoundation.org/location/california/
- AAA California gas prices, Orange County regular average on 2026-07-07: https://gasprices.aaa.com/?state=CA
- VA Santa Ana VA Clinic: https://www.va.gov/long-beach-health-care/locations/santa-ana-va-clinic/
- CalVet College Fee Waiver: https://www.calvet.ca.gov/VetServices/Pages/College-Fee-Waiver.aspx
- CalVet Property Tax Exemptions: https://www.calvet.ca.gov/VetServices/Pages/Property-Tax-Exemptions.aspx
- California Board of Equalization Disabled Veterans' Exemption: https://www.boe.ca.gov/proptaxes/dv_exemption.htm
- California Governor's Library, Gavin Newsom party: https://governors.library.ca.gov/40-newsom.html
- California Secretary of State 2024 Statement of Vote page: https://www.sos.ca.gov/elections/prior-elections/statewide-election-results/general-election-nov-5-2024/statement-vote
- California Secretary of State 2016 Statement of Vote page: https://www.sos.ca.gov/elections/prior-elections/statewide-election-results/general-election-november-8-2016/statement-vote
- NOAA Climate Normals overview: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- NOAA Climate Normals public bucket: https://registry.opendata.aws/noaa-climate-normals/
- BestPlaces Irvine sunny days: https://www.bestplaces.net/climate/city/california/irvine
- California Department of Cannabis Control, what's legal: https://www.cannabis.ca.gov/consumers/whats-legal/
- City of Irvine 2025 MEI announcement: https://www.cityofirvine.gov/index.php/news-media/news-article/city-irvine-earns-perfect-score-nationwide-municipal-equality-index-fourth
- City of Irvine Center of Innovation and Entrepreneurship: https://cityofirvine.gov/economic-development/center-innovation-entrepreneurship
- MilitaryINSTALLATIONS Camp Pendleton overview: https://installations.militaryonesource.mil/in-depth-overview/camp-pendleton
- OpenCrime Irvine 2024 violent crime rate: https://www.opencrime.us/cities/irvine-california
- FBI 2024 national crime summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
