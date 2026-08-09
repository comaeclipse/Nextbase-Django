# Hudson, New Hampshire — source notes

Retrieved 2026-08-06. The curated row represents **Hudson town**, not only the smaller Census-designated place. The map/pace crosswalk necessarily uses the available Census place centroid for Hudson (GEOID 3337860); this is a geography approximation recorded here rather than a claim that the CDP population is the town population.

## Identity and geography

- **Population:** U.S. Census Bureau [QuickFacts: Hudson town, Hillsborough County](https://www.census.gov/quickfacts/fact/table/hudsontownhillsboroughcountynewhampshire/SBO001223), July 1, 2025 estimate: **26,001**.
- **Density:** calculated as 26,001 people divided by **28.282** square miles of land from the U.S. Census Bureau [2024 Gazetteer county subdivisions file](https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_cousubs_33.txt), Hudson town internal point 42.760497, -71.409393. Rounded result: **919 people/sq mi**.

## Housing and cost

- **Typical home value:** Zillow [Hudson, NH home values](https://www.zillow.com/home-values/398779/hudson-nh/), retrieved 2026-08-06: **$544,332** ZHVI. The data field retains the application’s historical `AvgHomeValue` name, but this is a Zillow Home Value Index, not an average sale price.
- **Cost-of-living index:** [HomeSnacks’ June 2026 city profile](https://www.homesnacks.com/nh/hudson-cost-of-living/) reports Hudson at approximately the same index as nearby Nashua (**117**). This is a secondary proxy, not an official or licensed C2ER locality index; it is retained as a weak-source field.
- **Sales and income tax:** entered as 0% for the application’s state tax fields. New Hampshire’s statewide treatment should not be confused with Hudson’s locally set property-tax rate; the [NH DRA 2025 municipal-rate report](https://www.revenue.nh.gov/sites/g/files/ehbemt736/files/documents/2025-municipal-tax-rates.pdf) lists Hudson’s total property-tax rate separately.

## VA access

- **Nearest confirmed medical facility:** [Manchester VA Medical Center](https://www.va.gov/manchester-health-care/locations/manchester-va-medical-center/) at 718 Smyth Road, Manchester. The **17 miles** field is a straight-line calculation from the Hudson Census place centroid to the facility address; it is not a driving-distance estimate. Hudson has no confirmed VA medical facility in the reviewed VA sources.

## Weather

- **Representative station:** NOAA/NCEI 1991–2020 normals, Nashua/Boire Field (`USW00014710`), accessed through the [NCEI normals service](https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00014710&format=json&dataTypes=MLY-PRCP-NORMAL%2CMLY-TMAX-NORMAL%2CMLY-TMIN-NORMAL). Monthly precipitation totals sum to **40 inches** annually (rounded); January mean low is **17°F** and July mean high **84°F**. Snowfall, sunshine, and summer humidity are intentionally blank because they were not available in the reviewed station response.

## Anduril presence

- **Official corporate confirmation:** [Anduril’s October 2025 AIRS acquisition announcement](https://www.anduril.com/news/anduril-industries-acquires-american-infrared-solutions) says AIRS will continue operating from its New Hampshire facilities and describes its cooled-infrared camera/component design and manufacture.
- **Hudson-specific onsite signal:** Anduril’s public Greenhouse endpoint, [jobs snapshot](https://boards-api.greenhouse.io/v1/boards/andurilindustries/jobs), retrieved 2026-08-06, listed **8 Hudson-only postings**. Titles included process technician, process/manufacturing engineers, engineering technician (vacuum and cryogenic systems), buyer, and embedded/firmware engineers. The job descriptions identify the AIRS team’s vertically integrated manufacturing work.
- The employer-location row therefore uses `Onsite=8`, `Hybrid=0`, `Remote=0`, `TotalPostings=8`, and a `public_ats_snapshot` source. The job-board location is evidence of an in-person Hudson site; it is not a claim about total facility employment.

## Supplemental values from the supplied research

- **Snow, sunshine, and humidity:** [Timeanddate Hudson climate](https://www.timeanddate.com/weather/%405087752/climate), using Nashua/Boire Field four miles away and 1992–2021 observations: **56.4 inches** annual snowfall, **199** sunny days, and **68.3%** average June–August relative humidity. The importer stores rounded integers (56 inches, 199 days, 68%). These are secondary climate estimates, not NOAA normals.
- **Gas:** [AAA New Hampshire prices](https://gasprices.aaa.com/?state=NH), retrieved 2026-08-06: state regular average **$4.0320** (stored as **$4.03**). It is a statewide benchmark, not a Hudson station survey, and changes daily.
- **Cannabis:** [RSA 318-B:2-c](https://gc.nh.gov/rsa/html/XXX/318-B/318-B-2-c.htm) makes possession of up to three-quarters of an ounce a violation rather than legal adult-use possession, subject to the listed civil penalty. The city field therefore says medical legal / limited possession decriminalized, rather than recreational legal.

## Elections update (2026-08-09)

City-level (Hudson **town**, not Hillsborough County — consistent with this file's geography note above, since the town's own presidential vote is what's meaningful here) 2016/2024 returns now filled. 2016 town return: Trump 7,220 / Clinton 5,306 (D 42.36% / R 57.64% two-party, stored `election_2016_percent = 58`). 2024 town return (NH Secretary of State): Trump 8,045 / Harris 6,449 (D 44.49% / R 55.51% two-party, stored `election_2024_percent = 56`). `rep_vote_share_change_pp = -2.13`, `dem_vote_share_change_pp = +2.13`, `election_change = "2.1 pp more Democratic since 2016"`. Sources: Town of Hudson election-results archive, https://www.hudsonnh.gov/clerk/page/2016-election-resultsballots and https://www.hudsonnh.gov/clerk/page/2024-election-resultsballots ; NH Secretary of State 2024 presidential results, https://www.sos.nh.gov/sites/g/files/ehbemt561/files/inline-documents/sonh/2024-ge-president.xls

## Deliberately unfilled fields

Local politics classification (`CityPolitics`), crime grade, and municipal LGBTQ score remain blank pending source-backed research. The attachment's 58-point LGBTQ figure is explicitly analytical, not an HRC Municipal Equality Index score, so it was not written as a municipal rating. No values were inferred from county, state, or nearby-city data.
