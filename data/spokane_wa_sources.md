# Spokane, WA Source Notes

Retrieval date: 2026-07-16.

## Geography and source choices

- Primary geography: incorporated City of Spokane, Spokane County, Washington.
- Population, density, housing, sales tax, crime, VA access, climate, and lifestyle tags are city-specific or nearest representative station values.
- Presidential results use Spokane County official/officially sourced returns because a current city-level presidential aggregation was not located during this pass. The `CityPolitics` value is therefore explicitly qualified as county-level.
- The CSV `DefenseHub` field is intentionally blank. The local RTX/Collins source data already includes onsite Spokane postings, so `scripts/recompute-defense-hub.ts` should derive the stored value from employer presence after linking rather than from a manual override.

## Imported values and method

- Population and density: Census QuickFacts lists a July 1, 2025 population estimate of 230,783, 2020 population density of 3,330.3 people per square mile, 2020 land area of 68.76 square miles, and 15,499 veterans for 2020-2024. Population and density are stored as 230,783 and 3,330.
- Housing: Zillow's Spokane ZHVI page listed a typical home value of $403,557 through 2026-06-30. The model field is named `avg_home_value`, but this is a Zillow Home Value Index, not an average or median.
- Cost and taxes: AreaVibes reports Spokane's cost of living index as 110/100, or 10 percent above the national average. Washington DOR's Q3 2026 local sales/use tax flyer lists Spokane city location code 3210 with a 0.0260 local rate plus 0.0650 state rate, for a combined 0.0910, stored as 9.10 percent. Washington DOR says Washington has no state individual income tax, stored as 0.
- VA and veterans benefits: VA.gov lists Mann-Grandstaff VA Medical Center in Spokane, so the row uses local VA access and zero miles. Washington DOR and Washington DVA document income-based property-tax exemptions or deferrals for qualifying seniors, people retired due to disability, and veterans compensated at the 80 percent service-connected rate.
- Elections: Spokane County 2016 presidential results were Clinton 93,767 and Trump 113,435. Spokane County 2024 presidential results were Harris 131,163 and Trump 145,338. Using two-party shares, Republican share changed from 54.75 percent in 2016 to 52.56 percent in 2024: `rep_vote_share_change_pp = -2.2` and `dem_vote_share_change_pp = 2.2`. Winner percentages are rounded whole two-party shares. The county-level 2024 two-party Republican share supports `County-level: Moderately Conservative`.
- Crime: AreaVibes' FBI-UCR-derived table reports 1,549 violent crimes and a violent-crime rate of 675 per 100,000 for Spokane. Dividing by the FBI 2024 national violent-crime rate of 359.1 per 100,000 yields 188.0, rounded to TCI 188. `High` follows the app convention where lower TCI is safer.
- LGBTQ: HRC's 2025 Spokane MEI scorecard gives a final score of 94. MAP's Washington profile gives Washington an overall policy score of 40.5/49 and a high rating.
- Climate: NOAA 1991-2020 normals for Spokane International Airport (USW00024157) give annual precipitation 16.45 inches, annual snowfall 45.40 inches, January low 24.7 F, and July high 84.4 F, stored as 16, 45, 25, and 84. `sun_days` and summer humidity are intentionally blank because these official normals do not provide comparable measures. The repository climate rule classifies this row as `cold_snowy`.
- Economy and lifestyle: No city-level technology-employment evidence adequate for the product's `tech_hub` flag was found, so it remains `N`. The repository's RTX source data has Spokane onsite Collins Aerospace postings, so defense hub status is left to derived employer-presence logic. Tags and description describe local VA access, healthcare, Spokane River parks, hiking, golf, arts/culture, and nearby mountain/outdoor recreation.
- Gas: AAA's Spokane regular-gas average was $4.548 on 2026-07-16, stored as $4.55; this field is volatile.

## Source URLs

- Census QuickFacts, Spokane: https://www.census.gov/quickfacts/fact/table/spokanecitywashington/PST045225
- Zillow Home Value Index, Spokane: https://www.zillow.com/home-values/20604/spokane-wa/
- AreaVibes cost of living: https://www.areavibes.com/spokane-wa/cost-of-living/
- Washington DOR Q3 2026 local sales/use tax flyer: https://dor.wa.gov/sites/default/files/2026-05/Q326_LSU-flyer-by-county.pdf
- Washington DOR income tax: https://dor.wa.gov/taxes-rates/income-tax
- Mann-Grandstaff VA Medical Center: https://www.va.gov/spokane-health-care/locations/mann-grandstaff-va-medical-center/
- Washington DVA property tax relief: https://dva.wa.gov/veterans-service-members-and-their-families/veterans-benefits/housing-resources/property-tax-relief
- Washington DOR property tax exemption for seniors, people retired due to disability, and veterans with disabilities: https://dor.wa.gov/taxes-rates/property-tax/property-tax-exemption-seniors-people-retired-due-disability-and-veterans-disabilities
- Washington Secretary of State election results archive: https://www.sos.wa.gov/elections/data-research/election-data-and-maps/election-results-and-voters-pamphlets
- Washington 2024 general results by congressional district/county part: https://www.sos.wa.gov/sites/default/files/2024-12/2024Gen%20Results%20by%20Congressional%20District%20County%20Part.pdf
- AreaVibes Spokane crime table: https://www.areavibes.com/spokane-wa/crime/
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- HRC 2025 Spokane MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Spokane-Washington.pdf
- MAP Washington equality profile: https://mapresearch.org/equality-profiles/wa/
- Washington State Liquor and Cannabis Board: https://lcb.wa.gov/
- NOAA 1991-2020 annual/seasonal normals, USW00024157: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024157&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00024157: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00024157&format=json&units=standard&includeAttributes=false
- AAA Washington gas prices: https://gasprices.aaa.com/?state=WA
- Governor Bob Ferguson official site: https://governor.wa.gov/
- City of Spokane Parks and Recreation: https://my.spokanecity.org/parksrec/
- Riverfront Spokane visitor info: https://my.spokanecity.org/riverfrontspokane/visitor-info/
- Manito Park, City of Spokane: https://my.spokanecity.org/parks/major/manito/
- Riverside State Park, Washington State Parks: https://parks.wa.gov/find-parks/state-parks/riverside-state-park
- Providence Sacred Heart Medical Center: https://www.providence.org/locations/wa/sacred-heart-medical-center
