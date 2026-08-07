# Victorville, CA Source Notes

Retrieval date: 2026-08-06.

## Geography and methodology

- Geography is the incorporated City of Victorville, San Bernardino County, California (Census place FIPS 0682590). The row is a city, not the Victor Valley metro.
- Population is the Census July 1, 2025 estimate (141,395); density is Census 2020 density (1,828.9 people per square mile), rounded to 1,829.
- The checked-in Census 2024 Gazetteer crosswalk gives the city point as 34.527735, -117.353579 and is used by the map/pace workflows.

## Imported values and provenance

- **Housing:** Zillow reported a June 30, 2026 Victorville ZHVI of $437,583. `avg_home_value` retains the legacy field name, but the source is Zillow's typical-home-value index, not a mean or median.
- **Cost and taxes:** Salary.com's July 27, 2026 model reports Victorville living costs as 16 percent above the U.S. average, stored as a 116 index (U.S. = 100). This is a documented proxy, not an official price index. The current City of Victorville rate is 8.75%; the CDTFA current-rate page is the authoritative primary source. California's top marginal individual income-tax rate is 13.3%.
- **VA and benefits:** VA Loma Linda lists the Victorville VA Clinic as one of its community-based outpatient clinics. The row uses `Yes` and `0 miles` under the established in-city-facility convention. California FTB says qualifying taxpayers may exclude up to $20,000 of military retirement/SBP income for tax years 2025-2029, subject to income limits; the BOE documents its Disabled Veterans' Exemption for qualified veterans at the 100% disability rate.
- **Climate:** NOAA 1991-2020 normals at Victorville station USC00049325 report 5.57 inches annual precipitation, 0.00 inches annual snowfall, January average low 33.2 F, and July average high 97.5 F; stored rounded as 6, 0, 33, and 98. BestPlaces supplies the secondary 289-days-with-sun estimate, explicitly using a different weather-data methodology than NOAA normals. Timeanddate reports 30 percent humidity from George Air Force Base / Victorville observations about six miles from the city (2012-2021); this value is stored as the summer humidity proxy and is consistent with WeatherSpark's approximately 1 percent muggy-time measure. The climate label is a descriptive High Desert / hot-arid label, not a global climate-category rewrite.
- **Politics:** The county registrar's certified 2016 result was Clinton 340,833 and Trump 271,240. Its certified 2024 result was Trump 378,416 and Harris 362,114. Two-party Republican share changed from 44.31% to 51.10%, or +6.79 percentage points (stored +6.8); the counterpart Democratic change is -6.8. The product fields are county-level because a verified Victorville-only presidential aggregation was not obtained, so `city_politics` is explicitly county-qualified. California governor Gavin Newsom is a Democrat as of retrieval.
- **Safety:** The San Bernardino County Sheriff's 2024 Annual Crime Report lists 1,425 Victorville violent crimes. Dividing by the Census 2025 population gives 1,008 per 100,000; indexed to the FBI 2024 national violent-crime rate of 359.1 yields TCI 280 (rounded). `High` follows the app convention where lower TCI is safer. The county report notes that its 2023 break is not comparable to the 2024 presentation.
- **Defense employer and hub:** Victorville's Southern California Logistics Airport Authority approved a Standard Sublease Agreement with Anduril Industries for Building 682C in 2025. A matching sourced `defense_employer_locations` row is imported with no job-posting counts because the municipal sublease, rather than an ATS snapshot, establishes this physical site. `DefenseHub=Y` is a supported manual curation input; `defense_hub` is then derived by the repository script. The city airport describes SCLA as a former George Air Force Base facility serving flight testing, aircraft research and development, and related industrial activity.
- **Lifestyle:** Mojave Narrows Regional Park and the City of Victorville's Mojave Riverwalk support the Hiking and Fishing tags. `TechHub=N`; no sourced evidence sufficient for that product flag was found.

## Deliberately blank or weak fields

- `sun_days` and `humidity_summer` are secondary-source proxies rather than NOAA-normal values. Gas is `$5.16` regular from Way's Victorville average, dated June 15, 2026; it is volatile and the same page listed individual July station prices from $4.39 upward.
- Municipal LGBTQ score/rating is blank. No current HRC Municipal Equality Index scorecard or primary local LGBTQ-policy source was found; California-wide policy must not be substituted for a city score.
- The cost-of-living index is a modeled secondary-source proxy; all other populated core values above use federal, state, county, municipal, VA, NOAA, or Zillow sources.

## Source URLs

- Census QuickFacts: https://www.census.gov/quickfacts/fact/table/victorvillecitycalifornia/LND110210
- Zillow Victorville ZHVI: https://www.zillow.com/home-values/96856/victorville-ca-92393/
- Salary.com cost of living: https://www.salary.com/research/cost-of-living/victorville-ca
- CDTFA current rates: https://cdtfa.ca.gov/taxes-and-fees/sales-use-tax-rates.htm
- Tax Foundation California profile: https://taxfoundation.org/location/california/
- VA Loma Linda locations: https://www.va.gov/directory/guide/cboc.cfm?id=76&parm=VA+Loma+Linda+Healthcare+System
- California FTB military tax guidance: https://www.ftb.ca.gov/file/personal/filing-situations/military.html
- California BOE Disabled Veterans' Exemption: https://www.boe.ca.gov/proptaxes/dv_exemption.htm
- San Bernardino County 2016 certified results: https://results.rov.sbcounty.gov/results/20161108/content/results.aspx
- San Bernardino County 2024 certified results: https://results.rov.sbcounty.gov/Results/20241105/
- San Bernardino County Sheriff's 2024 Annual Crime Report: https://wp.sbcounty.gov/sheriff/wp-content/uploads/sites/17/2024-Annual-Crime-Report.pdf
- FBI 2024 violent-crime rate: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- NOAA annual normals: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USC00049325&format=json&units=standard&includeAttributes=false
- NOAA monthly normals: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USC00049325&format=json&units=standard&includeAttributes=false
- BestPlaces climate: https://www.bestplaces.net/climate/city/california/victorville
- Timeanddate Victorville climate: https://www.timeanddate.com/weather/usa/victorville/climate
- Way Victorville gas prices: https://www.way.com/gas/prices/california/victorville
- Victorville SCLAA agenda, Anduril Building 682C sublease: https://victorvilleca.primegov.com/Portal/Meeting?meetingTemplateId=8666
- SCLA description: https://www.victorvilleca.gov/Government/City-Departments/Airport/About-SCLA
- Mojave Narrows Regional Park: https://parks.sbcounty.gov/park/mojave-narrows-regional-park/
- Victorville Mojave Riverwalk: https://www.victorvilleca.gov/Home/Components/News/News/275/
