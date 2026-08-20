# Bozeman, MT Source Notes

Retrieval date: 2026-08-20.

## Geography and source choices

- Primary geography: incorporated City of Bozeman, Gallatin County, Montana.
- Population, density, housing, VA access, HRC MEI, Walmart, and Costco are city-level.
- Presidential election fields use Gallatin County results because a reviewed city-boundary precinct crosswalk was not prepared for this ingest; `city_politics` is explicitly marked county-level.
- Weather uses two NOAA 1991-2020 normals stations: `USC00241044` (Bozeman Montana State University) for city-representative snowfall, precipitation, winter low, and summer high; `USW00024132` (Bozeman/Gallatin Field) was checked and lacks a snowfall normal in the NCEI annual/seasonal response. Sunshine and July humidity use documented secondary climate sources because comparable NOAA normals do not provide those exact product fields.

## Imported values and method

- Population and density: Census QuickFacts lists Bozeman city's July 1, 2025 population estimate as 58,814 and 2020 population density as 2,587.2 people per square mile, stored as 58,814 and 2,587.
- Housing: Zillow's Bozeman ZHVI page reports a typical home value of $727,000, with data through 2026-07-31. The model field is named `avg_home_value`, but this is Zillow Home Value Index typical value, not a mean sale price.
- Cost and taxes: AreaVibes reports Bozeman's cost-of-living index as 128 on a U.S. baseline of 100. Montana Department of Revenue says Montana has no general sales tax, so sales tax is stored as 0. The city CSV includes Montana's 5.65 percent top individual income-tax rate only for compatibility; `scripts/import-csv.ts` ignores state-owned tax fields.
- VA and veterans benefits: VA Montana lists the Travis W. Atkins Department of Veterans Affairs Clinic at 1101 East Main Street in Bozeman, so the row uses local VA access and zero miles. Montana state benefit/tax details are state-owned and already maintained in `locations_stateinfo`; the CSV summary is included for legacy compatibility only.
- Elections: County-level presidential results are used. The 2016 Gallatin County result was Clinton 24,246 and Trump 23,802; two-party Democratic share was 50.46 percent, rounded to 50. The 2024 Gallatin County result was Harris 34,938 and Trump 32,695; two-party Democratic share was 51.66 percent, rounded to 52. Republican two-party share moved from 49.54 percent in 2016 to 48.34 percent in 2024, so `rep_vote_share_change_pp = -1.2`, `dem_vote_share_change_pp = 1.2`, and `election_change = 1.2 pp more Democratic since 2016`.
- Crime: AreaVibes reports 254 violent crimes and a violent crime rate of 434 per 100,000 residents. Dividing by the FBI 2024 national violent-crime rate of 359.1 per 100,000 yields 120.9, rounded to TCI 121. The `Moderate` label follows nearby repo examples where roughly 100-140 is moderate. Limitation: AreaVibes is a third-party presentation of crime statistics rather than a locally maintained normalized index.
- Cannabis: Montana adult-use cannabis is treated as recreational.
- LGBTQ: HRC's 2025 Bozeman Municipal Equality Index final score is 84. MAP's Montana Equality Profile gives Montana an overall state policy score of -1.75 out of 49; the importer ignores this state-owned column, but it is retained in the CSV for compatibility and source review.
- Technology and defense: Bozeman is marked `TechHub=Y` because official EDA and MSU materials identify the Headwaters regional technology hub and Montana State's photonics/smart-sensor work in Bozeman. It is marked `DefenseHub=Y` as a human curation input because the Defense Innovation Unit lists a Defense Innovation OnRamp Hub physically in Bozeman and describes it as centered in Montana's defense, aerospace, and advanced manufacturing ecosystem.
- Retail: Walmart lists Bozeman Supercenter #2084 at 1500 N 7th Ave, Bozeman, MT. Costco lists warehouse #96 at 2505 Catron St, Bozeman, MT. Both are in-city, so `HasWalmart=Y` and `HasCostco=Y`.
- Climate: NOAA 1991-2020 normals for Bozeman Montana State University station `USC00241044` give annual snowfall 91.30 inches, annual precipitation 20.03 inches, DJF average low 15.4 F, and JJA average high 78.4 F, stored as 91, 20, 15, and 78. BestPlaces reports 188 sunny days per year, and Weather Atlas reports July average relative humidity of 52 percent; these are secondary sources and should be treated as less authoritative than NOAA station normals.
- Gas: AAA's state gas price averages page showed Montana regular gasoline at about $4.3924 per gallon on 2026-08-20, stored as $4.39. This field is volatile.
- Geography/vibes: Bozeman is tagged for mountains, hiking, fishing, and outdoor culture because the city sits in the Gallatin Valley near Bridger Range/Gallatin Range access and promotes the Main Street to the Mountains trail system. This file does not update `data/city-vibes.json` or `data/geography-proximity.json`; those are post-import or separate artifact steps under the current two-phase workflow.

## Source URLs

- Census QuickFacts, Bozeman city: https://www.census.gov/quickfacts/fact/table/bozemancitymontana/PST045225
- Zillow Home Value Index, Bozeman: https://www.zillow.com/home-values/44281/bozeman-mt/
- AreaVibes cost of living: https://www.areavibes.com/bozeman-mt/cost-of-living/
- Montana Department of Revenue general sales tax guidance: https://revenue.mt.gov/taxes/general-sales-tax
- Montana Department of Revenue 2026 income tax brackets: https://revenue.mt.gov/news/recent-news/HB-337
- Travis W. Atkins Department of Veterans Affairs Clinic: https://www.va.gov/montana-health-care/locations/travis-w-atkins-department-of-veterans-affairs-clinic/
- Montana Secretary of State 2016 Gallatin County results: https://electionresults.mt.gov/ResultsSW.aspx?cty=16&eid=14&map=CTY&type=CTYALL
- Montana Secretary of State 2024 Gallatin County results: https://electionresults.mt.gov/ResultsSW.aspx?cty=16&eid=450002785&map=CTY&type=CTYALL
- AreaVibes crime: https://www.areavibes.com/bozeman-mt/crime/
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Montana adult-use cannabis FAQ: https://montanafreepress.org/2021/12/22/montana-marijuana-faq/
- HRC 2025 Bozeman MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Bozeman-Montana.pdf
- MAP Montana Equality Profile: https://mapresearch.org/equality-profiles/mt/
- NOAA 1991-2020 annual/seasonal normals, USC00241044: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USC00241044&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 annual/seasonal normals, USW00024132: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024132&format=json&units=standard&includeAttributes=false
- BestPlaces Bozeman climate: https://www.bestplaces.net/climate/city/montana/bozeman
- Weather Atlas Bozeman climate: https://www.weather-atlas.com/en/montana-usa/bozeman-climate
- AAA state gas price averages: https://gasprices.aaa.com/state-gas-price-averages/
- Walmart Bozeman Supercenter: https://www.walmart.com/store/2084-bozeman-mt
- Costco Bozeman warehouse: https://www.costco.com/warehouse-locations/bozeman-mt-96.html
- Montana State University Headwaters Tech Hub announcement: https://www.montana.edu/news/23233/
- U.S. EDA Headwaters Hub: https://www.eda.gov/funding/programs/regional-technology-and-innovation-hubs/2023/Headwaters-Hub
- Defense Innovation Unit OnRamp Hub Montana: https://www.diu.mil/onramp-hub-montana
- City of Bozeman Economic Development: https://www.bozemanmt.gov/departments/economic-development
