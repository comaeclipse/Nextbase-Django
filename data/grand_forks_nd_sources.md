# Grand Forks, ND Source Notes

Retrieval date: 2026-08-09.

## Geography and source choices

- Primary geography: Grand Forks city limits, Grand Forks County, ND.
- Population and density: Census QuickFacts city limits. QuickFacts lists a July 1, 2025 population estimate of 60,365 and 2020 density of 2,121.6 people per square mile; density is stored as 2,122.
- Housing: Zillow city-level ZHVI for Grand Forks, ND, data through 2026-06-30, typical home value $303,687. The legacy CSV column is `AvgHomeValue`, but the source is Zillow's typical-home-value index, not a mean or median.
- Cost of living: ERI reports Grand Forks cost of living as 20 percent below the national average; stored as an index of 80. This is a secondary modeled proxy, not an official price index.
- Sales tax: Grand Forks city sales/use tax is 2.25 percent; combined with North Dakota's 5.00 percent state sales tax, the row stores 7.25 percent.
- Income tax: North Dakota's top marginal individual income-tax rate is 2.50 percent under current North Dakota Office of State Tax Commissioner tables.
- VA access: Grand Forks VA Clinic is an outpatient-capable VA clinic in Grand Forks at 1407 24th Avenue South, Suite 100, so `VA=Yes`, `NearestVA=Grand Forks VA Clinic (Grand Forks, ND)`, and `DistanceToVA=0 miles`. Nearest VA medical center is Fargo VA Medical Center in Fargo; it is populated post-import by a scoped SQL update as `80 miles`.
- Elections: Grand Forks County presidential returns are used because a current city-level presidential aggregation was not located. Percent fields are two-party winner share rounded to whole percent. 2016: Trump 16,340 / (16,340 + 10,851) = 60.1 percent. 2024: Trump 18,123 / (18,123 + 12,469) = 59.2 percent. `rep_vote_share_change_pp = -0.8`; `dem_vote_share_change_pp = 0.8`.
- Crime: TCI is a violent-crime-rate proxy indexed to the FBI 2024 national violent-crime rate of 359.1 per 100,000. OpenCrime's FBI-derived 2024 Grand Forks city violent-crime rate is 358.6 per 100,000, so 358.6 / 359.1 * 100 = 99.9, stored as 100. Crime rating is `Moderate`.
- Weather: NOAA/NCEI 1991-2020 normals for Grand Forks International Airport (`USW00014916`) give annual precipitation 21.74 inches, annual snowfall 48.4 inches, January average low -3.1 F, and July average high 80.7 F. July humidity is from Timeanddate's 1992-2021 Grand Forks International Airport climate table. `SunnyDays=200` uses the same conservative North Dakota Tourism statewide proxy used for other ND rows because a comparable city-specific official sunshine normal was not located.
- LGBTQ: HRC 2025 Grand Forks MEI final score is 50. State policy score uses MAP North Dakota overall policy score, 10.5/49. The MAP score is stored separately as state policy; it is not substituted for municipal policy.
- Economic hubs: `TechHub=Y` because the Grand Forks Region EDC identifies the region as a specialized unmanned and autonomous systems ecosystem anchored by UND and Northland Community & Technical College. `DefenseHub=Y` is a manual curation input because Grand Forks Air Force Base is an active U.S. Air Force installation near the city, and the same UAS/autonomous-systems cluster includes defense-oriented activity.
- Lifestyle tags and description: Greenway and tourism sources support Hiking, Fishing, Golf, Arts, and Culture; VA clinic and Grand Forks AFB support Healthcare and Military; low taxes are supported by the North Dakota income-tax and Grand Forks sales-tax sources.

## Source URLs

- Census QuickFacts, Grand Forks city population and density: https://www.census.gov/quickfacts/fact/table/grandforkscitynorthdakota/PST045225
- Zillow Grand Forks ZHVI, updated 2026-06-30: https://www.zillow.com/home-values/4948/grand-forks-nd/
- ERI Grand Forks cost of living: https://www.erieri.com/cost-of-living/united-states/north-dakota/grand-forks
- Grand Forks city sales/use tax: https://www.grandforksgov.com/government/city-departments/finance-and-administrative-services/sales-tax
- North Dakota individual income tax: https://www.tax.nd.gov/individual-income-tax
- AAA North Dakota regular gas average, checked 2026-08-09: https://gasprices.aaa.com/?state=ND
- Stacker Grand Forks gas average, current as of 2026-08-03: https://stacker.com/stories/north-dakota/grand-forks/how-gas-prices-have-changed-grand-forks-last-week/
- Grand Forks VA Clinic: https://www.va.gov/fargo-health-care/locations/grand-forks-va-clinic/
- Fargo VA Medical Center: https://www.va.gov/fargo-health-care/locations/fargo-va-medical-center/
- North Dakota military service members tax guidance: https://www.tax.nd.gov/military-service-members
- North Dakota disabled veterans property-tax credit: https://www.tax.nd.gov/property-tax-exemptions-credits/property-tax-credits/disabled-veterans-property-tax-credit
- North Dakota Governor Kelly Armstrong official biography: https://www.governor.nd.gov/governor-kelly-armstrong
- North Dakota Secretary of State 2024 election results: https://results.sos.nd.gov/ResultsSW.aspx?map=CTY&text=All&type=SW
- North Dakota Secretary of State 2016 election results: https://results.sos.nd.gov/ResultsSW.aspx?eid=292&map=CTY&text=All&type=SW
- OpenCrime Grand Forks 2024 FBI-derived crime rate: https://www.opencrime.us/cities/grand-forks-north-dakota
- FBI 2024 national crime summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- North Dakota medical marijuana program: https://www.hhs.nd.gov/mm
- HRC 2025 Grand Forks MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Grand-Forks-North-Dakota.pdf
- MAP North Dakota equality profile: https://mapresearch.org/equality-profiles/nd/
- NOAA/NCEI 1991-2020 monthly normals, station `USW00014916`: https://noaa-normals-pds.s3.amazonaws.com/normals-monthly/1991-2020/access/USW00014916.csv
- NOAA/NCEI 1991-2020 annual/seasonal normals, station `USW00014916`: https://noaa-normals-pds.s3.amazonaws.com/normals-annualseasonal/1991-2020/access/USW00014916.csv
- Timeanddate Grand Forks climate averages: https://www.timeanddate.com/weather/usa/grand-forks/climate
- North Dakota Tourism weather overview: https://www.ndtourism.com/information/north-dakota-weather-climate-and-what-pack
- Grand Forks Air Force Base official site: https://www.grandforks.af.mil/
- Grand Forks Region EDC overview: https://grandforks.org/
- Grand Forks Region EDC unmanned and autonomous systems: https://grandforks.org/grand-forks-industries/unmanned-autonomous-systems/
- Visit Grand Forks Greenway: https://www.visitgrandforks.com/directory/the-greenway/
- North Dakota Tourism Grand Forks and East Grand Forks: https://www.ndtourism.com/cities/grand-forks-east-grand-forks

## Known limitations

- `CostOfLiving=80` is based on a secondary modeled cost-of-living source.
- `SunnyDays=200` is a statewide North Dakota Tourism proxy, not a city-specific NOAA sunshine normal.
- `Gas=$3.75` is volatile and city-specific as of 2026-08-03; the contemporaneous AAA state average on 2026-08-09 was about $3.86.
- Election fields are Grand Forks County, not city precinct-level results.
- Post-import monthly weather normals matched Grand Forks station `USC00323621` (0.5 mi). Hourly moisture normals matched `USW00014914` (69.9 mi), so humidity-derived fields should be treated as regional rather than block-level local.
