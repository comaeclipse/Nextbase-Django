# Missoula, MT Source Notes

Retrieval date: 2026-07-23.

## Geography and source choices

- Primary geography: incorporated City of Missoula, Missoula County, Montana.
- Population and density are city-level. Presidential election fields are county-level because a reviewed city-boundary precinct crosswalk was not available during this ingest; `city_politics` is therefore explicitly marked county-level.
- NOAA weather uses Missoula International Airport station `USW00024153`.

## Imported values and method

- Population and density: Census QuickFacts lists a July 1, 2025 population estimate of 78,903 and 2020 density of 2,130.3 people per square mile, stored as 78,903 and 2,130.
- Housing: Zillow's Missoula ZHVI page reported a typical home value of $576,303 with data through 2026-06-30. The model field is named `avg_home_value`, but this is a Zillow Home Value Index, not an average or median.
- Cost and taxes: AreaVibes reports Missoula's cost-of-living index as 114 on a U.S. baseline of 100. Montana Department of Revenue says Montana has no general-use sales tax, so sales tax is stored as 0. The 2026 Montana top individual income-tax rate is 5.65 percent.
- VA and veterans benefits: VA Montana lists the David J. Thatcher VA Clinic at 3885 West Broadway Street in Missoula, so the row uses local VA access and zero miles. Montana DOR documents a working military retirement exemption; Montana's disabled-veteran program provides income-qualified property-tax relief.
- Elections: County-level presidential results are used. The 2016 Missoula County result was Clinton 31,543 and Trump 22,250; two-party Democratic share was 58.64 percent, rounded to 59. The 2024 Missoula County result was Harris 42,903 and Trump 27,306; two-party Democratic share was 61.11 percent, rounded to 61. Republican two-party share moved from 41.36 percent in 2016 to 38.89 percent in 2024, so `rep_vote_share_change_pp = -2.5`, `dem_vote_share_change_pp = 2.5`, and `election_change = 2.5 pp more Democratic since 2016`.
- Crime: AreaVibes reports 471 violent crimes and a violent crime rate of 597 per 100,000 residents. Dividing by the FBI 2024 national violent-crime rate of 359.1 per 100,000 yields 166.3, rounded to TCI 166. The `High` label follows the existing app convention where lower TCI is safer. Limitation: this is an FBI-derived third-party presentation rather than a locally maintained normalized index.
- Cannabis: Montana adult-use cannabis is treated as recreational.
- LGBTQ: HRC's 2025 Missoula Municipal Equality Index final score is 95. MAP's Montana Equality Profile gives Montana an overall policy score of -1.75 out of 49, with a negative rating. Both are stored because the app keeps municipal and state policy signals separately.
- Climate: NOAA 1991-2020 normals for Missoula International Airport give annual precipitation 14.11 inches, annual snowfall 43.00 inches, January average low 18.0 F, and July average high 85.4 F, stored as 14, 43, 18, and 85. `sun_days` and `humidity_summer` are intentionally blank because these NOAA normals do not provide comparable values. The snowfall drives the repository category `cold_snowy`.
- Gas: AAA's Montana regular-gas average was $4.2600 as of 2026-07-23, stored as $4.26. This field is volatile.
- Economy and lifestyle: Visit Montana describes Missoula as a center for education, medicine, retail, and the arts in the northern Rockies; Destination Missoula describes mountain/trail access and local dining/music. No strong city-level technology-employment evidence adequate for the product's `tech_hub` flag was found, so it remains `N`. No strong Missoula-specific defense hub or major military-installation evidence was found, so `DefenseHub` is stored as `N`.
- Geography/vibes: Missoula is tagged `mountain_living` and `great_outdoors` because it sits where five northern Rockies valleys converge. It is marked near mountains. It is also marked near lake because Frenchtown Pond State Park is within the project's approximate 30-mile lake-access standard; this is a lifestyle signal, not a parcel-level distance guarantee.

## Source URLs

- Census QuickFacts, Missoula city: https://www.census.gov/quickfacts/fact/table/missoulacitymontana/PST045225
- Zillow Home Value Index, Missoula: https://www.zillow.com/home-values/53359/missoula-mt/
- AreaVibes cost of living: https://www.areavibes.com/missoula-mt/cost-of-living/
- Montana Department of Revenue general sales tax guidance: https://revenue.mt.gov/taxes/general-sales-tax
- Montana Department of Revenue 2026 income tax brackets: https://revenue.mt.gov/news/recent-news/HB-337
- David J. Thatcher VA Clinic: https://www.va.gov/montana-health-care/locations/david-j-thatcher-va-clinic/
- Montana DOR military tax guidance: https://revenue.mt.gov/taxes/military
- Montana disabled veteran property-tax relief statute: https://mca.legmt.gov/bills/mca/title_0150/chapter_0060/part_0030/section_0110/0150-0060-0030-0110.html
- Montana Secretary of State 2016 statewide canvass PDF: https://sosmt.gov/wp-content/uploads/attachments/2016GeneralStatewideCanvass.pdf
- Montana Secretary of State 2024 county results: https://electionresults.mt.gov/ResultsSW.aspx?cty=32&eid=450002785&map=CTY&type=CTYALL
- 2016 Montana presidential county table cross-check: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Montana
- 2024 Montana presidential county table cross-check: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Montana
- AreaVibes crime: https://www.areavibes.com/missoula-mt/crime/
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Montana adult-use cannabis FAQ: https://montanafreepress.org/2021/12/22/montana-marijuana-faq/
- HRC 2025 Missoula MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Missoula-Montana.pdf
- MAP Montana Equality Profile: https://mapresearch.org/equality-profiles/mt/
- NOAA 1991-2020 annual/seasonal normals, USW00024153: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024153&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00024153: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00024153&format=json&units=standard&includeAttributes=false
- AAA Montana gas prices: https://gasprices.aaa.com/?state=MT
- Visit Montana, Missoula: https://visitmt.com/cities-towns/missoula
- Destination Missoula: https://destinationmissoula.org/
- Frenchtown Pond State Park: https://fwp.mt.gov/stateparks/frenchtown-pond
