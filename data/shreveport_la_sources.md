# Shreveport, LA Source Notes

Retrieval date: 2026-07-16.

## Geography and source choices

- Primary geography: incorporated City of Shreveport, Caddo Parish, Louisiana.
- Population, density, housing, sales tax, VA access, climate, crime, tourism/lifestyle, and LGBTQ municipal score are city or city-specific values where available.
- Presidential results are county-level for Caddo Parish because reliable city-precinct totals were not located during this ingest. The `city_politics` value is therefore qualified as county-level.

## Imported values and method

- Population and density: Census QuickFacts lists Shreveport's July 1, 2025 population estimate as 175,902, with 2020 density of 1,740.2 people per square mile, stored as 175,902 and 1,740.
- Housing: Zillow's Shreveport ZHVI page listed a typical home value of $147,051 through 2026-06-30. The model field is named `avg_home_value`, but this is a Zillow Home Value Index, not an average or median.
- Cost and taxes: AreaVibes reports Shreveport's cost-of-living index as 95/100. LATA's Caddo Parish city-to-parish index lists Shreveport A with a 4.60% local rate plus 4.45% state rate, for a 9.05% total rate; Shreveport's official sales-tax page confirms the 4.6% city/parish local component. Louisiana Revenue documents a flat 3% individual income-tax rate for taxable periods beginning on or after January 1, 2025.
- VA and veterans benefits: VA.gov lists Overton Brooks VA Medical Center at 510 East Stoner Avenue in Shreveport, so the row uses local VA access and zero miles. Louisiana Department of Veterans Affairs says military retirement benefits are exempt and documents disabled-veteran property-tax exemptions at 50%, 70%, and 100% service-connected disability tiers.
- Elections: Caddo Parish county-level presidential results give Clinton 53,483 and Trump 49,006 in 2016; 2024 county-level results give Harris 48,864 and Trump 44,471. Using two-party shares, Republican share changed from 47.82% in 2016 to 47.65% in 2024: `rep_vote_share_change_pp = -0.2` and `dem_vote_share_change_pp = 0.2`. The 2024 two-party Democratic share of 52.35% supports `County-level: Moderately Liberal`, but this is not a city-precinct classification.
- Crime: AreaVibes' FBI-derived Shreveport crime table reports a violent-crime rate of 1,229 per 100,000. Dividing by the FBI 2024 national violent-crime rate of 359.1 per 100,000 yields 342.2, rounded to TCI 342. `High` follows the app convention where lower TCI is safer. Shreveport's official 2024 crime-stat presentation is kept as a local trend cross-check, not the normalized index source.
- Cannabis and LGBTQ: Louisiana Department of Health regulates a medical marijuana program, so the row stores `Medical`. HRC's 2024 Shreveport Municipal Equality Index scorecard gives a final score of 62, stored in both display and numeric MEI fields. MAP's live Louisiana profile lists an overall LGBTQ policy score of -6.75/49, rated Negative.
- Climate: NOAA 1991-2020 normals for Shreveport Regional Airport (USW00013957) give annual precipitation 51.43 inches, annual snowfall 0.90 inches, January low 37.3 F, and August high 94.9 F, stored as 51, 1, 37, and 95. NWS Shreveport describes the summer months as consistently hot and humid; Timeanddate's Shreveport climate table gives July average humidity of 68%, stored as `HumiditySummer=68` so the repository climate rule classifies the city as `hot_humid`. `sun_days` is intentionally blank because the official normals used here do not provide a comparable measure.
- Economy and lifestyle: No city-level technology-employment evidence adequate for the product's `tech_hub` flag was found, so it remains `N`. Barksdale Air Force Base is in the Shreveport-Bossier area, and the official Barksdale site reported Shreveport-Bossier was named a 2026 Great American Defense Community, so `defense_hub_manual` is set to `Y`. Tags and description reflect the local VA medical center, Red River recreation, arts/culture, fishing, golf, and defense-community context.
- Gas: AAA's Shreveport-Bossier City regular-gas average was $3.499 on 2026-07-16, stored as $3.50; this field is volatile.

## Source URLs

- Census QuickFacts, Shreveport: https://www.census.gov/quickfacts/fact/table/shreveportcitylouisiana/PST045225
- Zillow Home Value Index, Shreveport: https://www.zillow.com/home-values/40897/shreveport-la/
- AreaVibes cost of living: https://www.areavibes.com/shreveport-la/cost-of-living/
- LATA Caddo Parish city-to-parish sales-tax index: https://lataonline.org/for-taxpayers/city-to-parish-index/caddo/
- Shreveport official sales and use tax page: https://www.shreveportla.gov/109/Sales-Use-Tax
- Louisiana Revenue income-tax reform FAQ: https://revenue.louisiana.gov/tax-education-and-faqs/faqs/income-tax-reform/what-are-the-individual-income-tax-rates-and-brackets/
- VA Shreveport health care: https://www.va.gov/shreveport-health-care/
- Louisiana Department of Veterans Affairs state benefits: https://vetaffairs.la.gov/benefits/state
- MIT Election Lab data landing page: https://electionlab.mit.edu/data
- Louisiana Secretary of State: https://www.sos.la.gov/
- Wikipedia parish tables used as secondary extraction aid for Caddo 2016 and 2024 presidential results: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Louisiana and https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Louisiana
- AreaVibes Shreveport crime table: https://www.areavibes.com/shreveport-la/crime/
- Shreveport Police Department 2024 crime-stat presentation: https://www.shreveportla.gov/DocumentCenter/View/26623/2024-Crime-Statistics
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Louisiana Department of Health medical marijuana program: https://ldh.la.gov/bureau-of-sanitarian-services/medical-marijuana
- HRC 2024 Shreveport MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-24-Scorecards/MEI-2024-Shreveport-Louisiana.pdf
- MAP Louisiana Equality Profile: https://mapresearch.org/equality-profiles/la/
- NOAA 1991-2020 annual/seasonal normals, USW00013957: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00013957&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00013957: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00013957&format=json&units=standard&includeAttributes=false
- NWS Shreveport climate information: https://www.weather.gov/shv/climate_information
- Timeanddate Shreveport climate averages: https://www.timeanddate.com/weather/usa/shreveport/climate
- AAA Louisiana gas prices: https://gasprices.aaa.com/?state=LA
- Barksdale AFB Great American Defense Community announcement: https://www.barksdale.af.mil/News/Display/Article/4484702/shreveport-bossier-named-2026-great-american-defense-community/
- Visit Shreveport-Bossier: https://www.visitshreveportbossier.org/
- Explore Louisiana, Shreveport-Bossier: https://www.explorelouisiana.com/cities/shreveport-bossier
