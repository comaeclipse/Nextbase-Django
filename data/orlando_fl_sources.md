# Orlando, FL Source Notes

Retrieval date: 2026-07-07.

## Geography

- Primary geography: Orlando city limits, Orange County, FL.
- Population and density: city limits, using Census Reporter ACS 2024 1-year profile for Orlando, FL. Stored population is 334,871. Stored density is 3,014 people per square mile, rounded from the source's 3,013.8 value.
- Climate: NOAA 1991-2020 monthly normals for Orlando International Airport station `USW00012815`, used as the representative city station. Annual rain is the rounded sum of monthly precipitation normals. Snow is 0. Winter low uses January normal low; summer high uses July normal high. Summer humidity uses Timeanddate's July Orlando climate average because the NOAA monthly normals access file does not include relative humidity.
- Sunshine: BestPlaces Orlando climate page, used only for annual sunny days because NOAA normals do not expose a simple sunny-days field in the monthly station file.
- VA access: straight-line distance from Orlando City Hall, 400 South Orange Avenue, to Orlando VA Medical Center, 13800 Veterans Way. Coordinates were geocoded with OpenStreetMap/Nominatim and distance was calculated with the haversine formula.
- Elections: Orange County presidential returns, not city-boundary precinct results. Florida publishes precinct files, but this repo does not currently have a GIS crosswalk to map precincts to Orlando city limits. Percent fields are two-party winner share, rounded to whole percent.
- Crime: `TCI` is a violent-crime-rate proxy indexed to the national violent crime rate, not a total-crime FBI index. OpenCrime reports Orlando's 2022 violent crime rate as 835.8 per 100,000 and national average as 388.7; 835.8 / 388.7 * 100 = 215.0, rounded to 215. Orlando Police reported 2024 overall crime down 18% and violent crime down 10%, but did not publish a normalized rate in the source reviewed, so the normalized TCI remains the older FBI/OpenCrime value.
- Cost of living: ERI city cost-of-living estimate says Orlando is 13 percent above the national average; stored as index 113.
- LGBTQ state policy score: stored as `-5.50` to match the existing Florida rows' MAP overall policy score convention in the live database.

## Source URLs

- Census QuickFacts Orlando land area and FIPS: https://www.census.gov/quickfacts/fact/table/orlandocityflorida/PST045225
- Census Reporter Orlando ACS 2024 1-year profile: https://censusreporter.org/profiles/16000US1253000-orlando-fl/
- Zillow Orlando ZHVI, updated 2026-05-31: https://www.zillow.com/home-values/13121/orlando-fl/
- Florida Department of Revenue discretionary sales surtax information: https://floridarevenue.com/taxes/taxesfees/Pages/discretionary.aspx
- Florida Department of Revenue 2026 discretionary surtax PDF: https://floridarevenue.com/Forms_library/current/dr15dss_26.pdf
- Tax Foundation Florida tax profile / no individual income tax: https://taxfoundation.org/statetaxindex/states/florida/
- ERI Orlando cost of living: https://www.erieri.com/cost-of-living/united-states/florida/orlando
- AAA Florida gas prices, Orlando regular average on 2026-07-07: https://gasprices.aaa.com/?state=FL
- VA Orlando VA Medical Center: https://www.va.gov/orlando-health-care/locations/orlando-va-medical-center/
- Florida Department of Veterans' Affairs housing/property tax exemptions: https://floridavets.org/benefits-services/housing/
- Florida Veterans' Benefits Guide: https://floridavets.org/wp-content/uploads/2012/08/FDVA-Benefits-Guide.pdf
- Florida Governor Ron DeSantis official page: https://www.flgov.com/
- Florida Department of State election results archive: https://dos.fl.gov/elections/data-statistics/elections-data/election-results-archive/
- Florida Department of State precinct-level election results: https://dos.fl.gov/elections/data-statistics/elections-data/precinct-level-election-results/
- NOAA Climate Normals public bucket: https://registry.opendata.aws/noaa-climate-normals/
- NCEI U.S. Climate Normals overview: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- Timeanddate Orlando climate humidity: https://www.timeanddate.com/weather/usa/orlando/climate
- BestPlaces Orlando climate sunny days: https://www.bestplaces.net/climate/city/florida/orlando
- Florida Office of Medical Marijuana Use: https://knowthefactsmmj.com/
- HRC 2025 Orlando MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-2025-Orlando-Florida.pdf
- Movement Advancement Project Equality Maps: https://www.lgbtmap.org/equality-maps
- Orlando Economic Partnership simulation industry: https://business.orlando.org/l/simulation/
- OpenCrime Orlando violent crime rate: https://www.opencrime.us/cities/orlando-florida
- Orlando Police Department records and open data: https://www.orlando.gov/Public-Safety/OPD/OPD-Records-Open-Data
- WFTV Orlando Police 2024 crime statistics summary: https://www.wftv.com/news/local/orange-county/orlando-police-department-releases-2024-crime-statistics/4FWHZSHXK5EJPCY5NXHQJPNVFQ/
