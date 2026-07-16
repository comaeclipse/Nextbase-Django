# Eureka, CA Source Notes

Retrieval date: 2026-07-15.

## Geography and source choices

- Primary geography: incorporated City of Eureka, Humboldt County, California.
- Population, density, housing, sales tax, crime, VA access, and climate are city or nearest representative station values.
- Presidential results are city-level from California's official Supplement to the Statement of Vote, so `city_politics` is not county-qualified.

## Imported values and method

- Population and density: Census QuickFacts lists a July 1, 2025 population estimate of 25,304 and 2020 density of 2,780.2 people per square mile, stored as 25,304 and 2,780.
- Housing: Zillow's Eureka ZHVI page listed a typical home value of $415,534 through 2026-06-30. The model field is named `avg_home_value`, but this is a Zillow Home Value Index, not an average or median.
- Cost and taxes: AreaVibes reports Eureka's cost of living as 124/100, or 24 percent above the national average. CDTFA's July 1, 2026 city/county rate table lists City of Eureka at 10.25 percent. Tax Foundation lists California's top marginal individual income-tax rate as 13.3 percent.
- VA and veterans benefits: VA.gov lists Eureka VA Clinic at 930 West Harris Street in Eureka, so the row uses local VA access and zero miles. California FTB documents a military retirement exclusion up to $20,000 for qualified taxpayers in tax years 2025 through 2029, subject to AGI limits. California BOE documents the Disabled Veterans' Exemption for qualified 100 percent disabled veterans and eligible surviving spouses on a principal residence.
- Elections: California's official 2016 Supplement to the Statement of Vote lists Eureka city as Clinton 6,237 and Trump 3,074. The official 2024 presidential political-district supplement lists Eureka city as Harris 7,918 and Trump 3,307. Using two-party shares, Republican share changed from 33.01 percent in 2016 to 29.46 percent in 2024: `rep_vote_share_change_pp = -3.6` and `dem_vote_share_change_pp = 3.6`. Winner percentages are rounded whole two-party shares. The 2024 two-party Democratic share of 70.5 percent supports `Strongly Liberal`.
- Crime: AreaVibes' FBI-UCR-derived table reports 259 violent crimes and a violent-crime rate of 1,016 per 100,000 for Eureka. Dividing by the FBI 2024 national violent-crime rate of 359.1 per 100,000 yields 282.9, rounded to TCI 283. `High` follows the app convention where lower TCI is safer.
- LGBTQ: MAP's live state data table gives California an overall policy score of 45 and a high overall score. A current HRC municipal MEI scorecard for Eureka was not located, so municipal LGBTQ fields are blank rather than inferred.
- Climate: NOAA 1991-2020 normals for Eureka/Arcata Airport (USW00024213) give annual precipitation 40.40 inches, annual snowfall 0.00 inches, January low 40.8 F, and August high 64.0 F, stored as 40, 0, 41, and 64. `sun_days` and summer humidity are intentionally blank because these official normals do not provide comparable measures. The repository climate rule classifies this row as `mild_coastal`.
- Economy and lifestyle: No city-level technology-employment evidence adequate for the product's `tech_hub` flag was found, so it remains `N`. No major defense-installation or contractor-hub evidence adequate for `defense_hub_manual` was found, so it remains `N`. Tags and description describe the local VA clinic, Humboldt Bay, redwood/coastal recreation, fishing, and arts/culture context.
- Gas: AAA's California regular-gas average was $5.385 on 2026-07-15, stored as $5.39; this field is volatile.

## Source URLs

- Census QuickFacts, Eureka: https://www.census.gov/quickfacts/fact/table/eurekacitycalifornia/PST045225
- Zillow Home Value Index, Eureka: https://www.zillow.com/home-values/45191/eureka-ca/
- AreaVibes cost of living: https://www.areavibes.com/eureka-ca/cost-of-living/
- CDTFA city/county sales and use tax rates: https://cdtfa.ca.gov/formspubs/cdtfa95.pdf
- Tax Foundation California profile: https://taxfoundation.org/location/california/
- Eureka VA Clinic: https://www.va.gov/san-francisco-health-care/locations/eureka-va-clinic/
- California FTB military filing situations: https://www.ftb.ca.gov/file/personal/filing-situations/military.html
- California BOE Disabled Veterans' Exemption: https://www.boe.ca.gov/proptaxes/dv_exemption.htm
- California Secretary of State 2016 Supplement to the Statement of Vote: https://elections.cdn.sos.ca.gov/sov/2016-general/ssov/ssov-complete.pdf
- California Secretary of State 2024 presidential political-district supplement: https://elections.cdn.sos.ca.gov/sov/2024-general/ssov/pres-by-political-districts.pdf
- AreaVibes Eureka crime table: https://www.areavibes.com/eureka-ca/crime/
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- MAP LGBTQ equality state table: https://mapresearch.org/equality/
- California Department of Cannabis Control laws: https://www.cannabis.ca.gov/cannabis-laws/laws-and-regulations/
- NOAA 1991-2020 annual/seasonal normals, USW00024213: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024213&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00024213: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00024213&format=json&units=standard&includeAttributes=false
- AAA California gas prices: https://gasprices.aaa.com/?state=CA
- Governor Gavin Newsom official site: https://www.gov.ca.gov/
- Visit Humboldt, Eureka: https://visithumboldt.com/location/eureka/
- Sequoia Park, City of Eureka: https://www.eurekaca.gov/631/Sequoia-Park
