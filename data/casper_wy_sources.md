# Casper, WY Source Notes

Retrieval date: 2026-07-15.

## Geography and source choices

- Primary geography: incorporated City of Casper, Natrona County, Wyoming.
- Population is city-level. Density is the Census Reporter ACS 2024 city density, rounded to a whole number.
- Presidential results are county-level because a reviewed city-boundary/precinct crosswalk was not prepared for this ingest; `city_politics` is therefore explicitly marked county-level.

## Imported values and method

- Population and density: Census QuickFacts lists a July 1, 2025 population estimate of 58,771 for Casper. Census Reporter lists ACS 2024 city density of 2,199.3 people per square mile, stored as 2,199.
- Housing: Zillow's Casper ZHVI page listed a typical home value of $314,485, updated 2026-06-30. The model field is named `avg_home_value`, but this is a Zillow Home Value Index, not an average or median.
- Cost and taxes: Redfin's C2ER-based cost-of-living page reported Casper at 10 percent below the national average, stored as COL 90. Casper's city page says Wyoming charges 4 percent state sales tax plus Natrona County's optional 1 percent general-purpose tax; the city announced its temporary SPEC tax would end and the rate would return to 5 percent on 2026-07-01. Wyoming has no individual income tax, stored as 0.
- VA and veterans benefits: VA.gov lists Casper VA Clinic at 6000 East 2nd Street in Casper, so the row uses local VA access and zero miles. Wyoming has no individual income tax, so military retirement is not taxed by the state. Wyoming Department of Revenue and Natrona County document a veterans property-tax exemption that can reduce assessed valuation by $6,000 annually, with the option to apply it to vehicle licensing fees if not used on real property.
- Elections: Natrona County official 2024 results were Trump 24,671 and Harris 8,337. The official Wyoming Secretary of State 2016 page links the 2016 results, and the published county table reports Natrona County as Trump 23,552 and Clinton 6,577. Using two-party shares, Republican share changed from 78.17 percent in 2016 to 74.74 percent in 2024: `rep_vote_share_change_pp = -3.4` and `dem_vote_share_change_pp = 3.4`. Winner percentages are rounded whole two-party shares. County-level 74.7 percent Republican supports `County-level: Strongly Conservative`.
- Crime: AreaVibes' FBI-UCR-derived table reports 169 violent crimes and a violent-crime rate of 289 per 100,000 for Casper. Dividing by the FBI 2024 national violent-crime rate of 359.1 per 100,000 yields 80.5, rounded to TCI 80. `Low` follows the app convention where lower TCI is safer.
- LGBTQ: HRC's 2025 Municipal Equality Index scorecard gives Casper a final score of 92. MAP's live Wyoming profile lists a statewide overall policy score of -6 out of 49 and a negative rating.
- Climate: NOAA 1991-2020 normals for Casper/Natrona County International Airport (USW00024089) give annual precipitation 12.22 inches, annual snowfall 71.80 inches, January low 15.0 F, and July high 89.0 F, stored as 12, 72, 15, and 89. `sun_days` and summer humidity are intentionally blank because these official normals do not provide comparable measures. The snowfall drives the repository category `cold_snowy`.
- Economy and lifestyle: No city-level technology-employment evidence adequate for `tech_hub` was found, so it remains `N`. No major defense-installation or contractor-hub evidence adequate for `defense_hub_manual` was found, so it remains `N`. Tags and description describe the established low-tax, VA-access, river, mountain, arts, and outdoor-recreation context.
- Gas: AAA's Wyoming regular-gas average was $3.932 on 2026-07-15, stored as $3.93; this field is volatile.

## Source URLs

- Census QuickFacts, Casper: https://www.census.gov/quickfacts/fact/table/caspercitywyoming/PST045225
- Census Reporter, Casper profile: https://censusreporter.org/profiles/16000US5613150-casper-wy/
- Zillow Home Value Index, Casper: https://www.zillow.com/home-values/4002/casper-wy/
- Redfin cost-of-living result: https://www.redfin.com/cost-of-living-calculator/casper-wy
- Casper city taxes page: https://www.casperwy.gov/business/taxes/index.php
- Casper SPEC tax announcement: https://www.casperwy.gov/news_detail_T6_R191.php
- Tax Foundation Wyoming profile: https://taxfoundation.org/location/wyoming/
- Casper VA Clinic: https://www.va.gov/sheridan-health-care/locations/casper-va-clinic/
- Wyoming Department of Revenue tax relief: https://wyo-prop-div.wyo.gov/tax-relief
- Natrona County Veterans Exemption: https://www.natronacounty-wy.gov/779/Veterans-Exemption
- Official Natrona County 2024 election summary: https://www.natronacounty-wy.gov/DocumentCenter/View/12138/Official-2024-General-Election-Summary-PDF?bidId=
- Wyoming Secretary of State 2016 general results page: https://sos.wyo.gov/Elections/Docs/2016/2016GeneralResults.aspx
- 2016 Wyoming presidential county table cross-check: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Wyoming
- AreaVibes Casper crime table: https://www.areavibes.com/casper-wy/crime/
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- HRC 2025 Casper MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Casper-Wyoming.pdf
- MAP Wyoming equality profile: https://mapresearch.org/equality-profiles/WY/
- NOAA 1991-2020 annual/seasonal normals, USW00024089: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024089&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00024089: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00024089&format=json&units=standard&includeAttributes=false
- AAA Wyoming gas prices: https://gasprices.aaa.com/?state=WY
- Governor Mark Gordon official site: https://governor.wyo.gov/
- Wyoming marijuana law summary: https://norml.org/laws/wyoming-penalties-2/
