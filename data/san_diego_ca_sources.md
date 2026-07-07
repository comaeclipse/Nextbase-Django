# San Diego, CA Source Notes

Retrieval date: 2026-07-07.

## Geography

- Primary geography: San Diego city limits, San Diego County, CA.
- Population and density: city limits. Density is calculated from Census QuickFacts July 1, 2025 population estimate, 1,406,106, divided by 2020 land area, 325.88 square miles, yielding about 4,315 people per square mile.
- Housing: Zillow Home Value Index for San Diego city, not county or metro. Stored in the model's `avg_home_value` field, but documented as ZHVI typical home value rather than average or median.
- Climate: San Diego International Airport / Lindbergh Field NOAA station `USW00023188`, used as the representative city station. Annual rain is NOAA's 1991-2020 annual precipitation normal rounded to the nearest inch. Snow is from BestPlaces because the NOAA access file for the station does not expose a simple snow normal. Winter low uses January normal low; summer high uses August normal high.
- Summer humidity: left blank because the NOAA monthly normals file used for San Diego International Airport does not provide a relative-humidity normal. A secondary source was reviewed but not ingested because coastal marine-layer humidity causes the app's current climate categorizer to misclassify San Diego as hot/humid.
- Sunshine: BestPlaces San Diego climate page, used only for annual sunny days because NOAA normals do not expose a simple sunny-days field in the monthly station file.
- VA access: straight-line distance from San Diego City Hall to Jennifer Moreno Department of Veterans Affairs Medical Center, using approximate coordinates for each site and the haversine formula. The medical center is inside San Diego city limits, so `VA` is stored as `Yes`.
- Elections: San Diego city-level presidential returns from California Secretary of State political-district-within-county supplements. Percent fields are two-party winner share, rounded to whole percent.
- Crime: `TCI` is a violent-crime-rate proxy indexed to the 2024 national violent crime rate, not a total-crime FBI index. The City of San Diego reports a 2024 violent crime rate of 4.3 per 1,000 residents, or 430 per 100,000; FBI's 2024 national rate is 359.1 per 100,000, so 430 / 359.1 * 100 = 119.7, rounded to 120.
- Cost of living: ERI city cost-of-living estimate says San Diego is 65 percent above the national average; stored as index 165.
- LGBTQ state policy score: stored as `45.00` from MAP's California overall policy score out of 49.

## Source URLs

- Census QuickFacts San Diego city population and land area: https://www.census.gov/quickfacts/fact/table/sandiegocitycalifornia/PST045225
- Zillow San Diego ZHVI, data through 2026-05-31: https://www.zillow.com/home-values/54296/san-diego-ca/
- CDTFA city and county sales tax rates, effective 2026-07-01: https://cdtfa.ca.gov/taxes-and-fees/rates.aspx
- Tax Foundation California tax profile: https://taxfoundation.org/statetaxindex/states/california/
- ERI San Diego cost of living: https://www.erieri.com/cost-of-living/united-states/california/san-diego
- AAA California gas prices, San Diego regular average on 2026-07-07: https://gasprices.aaa.com/?state=CA
- VA Jennifer Moreno Department of Veterans Affairs Medical Center: https://www.va.gov/san-diego-health-care/locations/jennifer-moreno-department-of-veterans-affairs-medical-center/
- VA San Diego locations list: https://www.va.gov/san-diego-health-care/locations/
- CalVet College Fee Waiver: https://www.calvet.ca.gov/VetServices/Pages/College-Fee-Waiver.aspx
- CalVet Property Tax Exemptions: https://www.calvet.ca.gov/VetServices/Pages/Property-Tax-Exemptions.aspx
- California Board of Equalization Disabled Veterans' Exemption: https://www.boe.ca.gov/proptaxes/dv_exemption.htm
- MyAirForceBenefits California Military and Veteran Benefits: https://myairforcebenefits.us.af.mil/Benefit-Library/State/Territory-Benefits/California
- California Governor's Library, Gavin Newsom party: https://governors.library.ca.gov/40-newsom.html
- NCSL State Partisan Composition, updated 2026-05-27: https://www.ncsl.org/about-state-legislatures/state-partisan-composition
- California Secretary of State 2024 Statement of Vote page: https://www.sos.ca.gov/elections/prior-elections/statewide-election-results/general-election-nov-5-2024/statement-vote
- California Secretary of State 2024 president by political districts supplement: https://elections.cdn.sos.ca.gov/sov/2024-general/ssov/pres-by-political-districts.pdf
- California Secretary of State 2016 Statement of Vote supplement: https://elections.cdn.sos.ca.gov/sov/2016-general/ssov/ssov-complete.pdf
- NOAA Climate Normals public bucket: https://registry.opendata.aws/noaa-climate-normals/
- NOAA monthly normals for station `USW00023188`: https://noaa-normals-pds.s3.amazonaws.com/normals-monthly/1991-2020/access/USW00023188.csv
- NOAA annual/seasonal normals for station `USW00023188`: https://noaa-normals-pds.s3.amazonaws.com/normals-annualseasonal/1991-2020/access/USW00023188.csv
- Timeanddate San Diego climate humidity, reviewed but not ingested: https://www.timeanddate.com/weather/usa/san-diego/climate
- BestPlaces San Diego climate sunny days and snowfall: https://www.bestplaces.net/climate/city/california/san_diego
- California Department of Cannabis Control, cannabis laws: https://www.cannabis.ca.gov/cannabis-laws/laws-and-regulations/
- HRC 2025 San Diego MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-San-Diego-California.pdf
- Movement Advancement Project California equality profile: https://mapresearch.org/equality-profiles/ca/
- City of San Diego crime statistics and crime mapping page: https://www.sandiego.gov/police/data-transparency/crime-statistics
- City of San Diego 2024 crime statistics summary: https://www.insidesandiego.org/san-diego-remains-one-safest-large-us-cities-crime-drops-third-straight-year
- FBI 2024 national crime summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- San Diego Regional EDC region economy overview: https://www.sandiegobusiness.org/about-the-region/
- San Diego Regional EDC software industry profile: https://www.sandiegobusiness.org/about-the-region/software/
- Port of San Diego Blue Economy: https://www.portofsandiego.org/waterfront-development/blue-economy
- San Diego Military Advisory Council reports page: https://sdmac.org/reports/
- UC San Diego Rady School 2025 military economic impact report summary: https://today.ucsd.edu/story/new-rady-school-report-military-spending-remains-cornerstone-of-san-diegos-economy
