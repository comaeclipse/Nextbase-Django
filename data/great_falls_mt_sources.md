# Great Falls, MT Source Notes

Retrieval date: 2026-07-09.

## Geography and source choices

- Primary geography: incorporated City of Great Falls, Cascade County, Montana.
- Population and density are city-level. Presidential results are county-level because a reviewed city-boundary/precinct crosswalk was not available during this ingest; `city_politics` is therefore explicitly marked county-level.

## Imported values and method

- Population and density: Census QuickFacts lists a July 1, 2025 population estimate of 60,208 and 2020 density of 2,627.5 people per square mile, stored as 60,208 and 2,628.
- Housing: Zillow's Great Falls ZHVI page listed a typical home value of $337,690 through 2026-04-30. The model field is named `avg_home_value`, but this is a Zillow Home Value Index, not an average or median.
- Cost and taxes: Redfin's C2ER-based result reported overall cost of living 3 percent below the national average, stored as 97. Montana has no statewide sales tax. The 2026 top individual income-tax rate is 5.65 percent.
- VA and veterans benefits: Great Falls VA Clinic is at 1400 29th Street South in the city, so the row uses local access and zero miles. Montana DOR's working-military-retirement form documents a military-retirement/survivor-benefit income exclusion; Montana's disabled-veteran program provides an income-qualified property-tax reduction.
- Elections: The Montana Secretary of State's official 2016 Cascade County results were Trump 19,632 and Clinton 12,175. Official 2024 results were Trump 22,419 and Harris 14,021. Two-party Republican share changed from 61.72 percent to 61.52 percent: `rep_vote_share_change_pp = -0.2` and `dem_vote_share_change_pp = 0.2`. Winner percentages are rounded whole two-party shares (62 in each cycle). The result is within the guide's essentially-unchanged convention; county-level 61.5 percent Republican supports `County-level: Conservative`.
- Crime: A 2024 FBI-UCR-derived city table reports 574 violent crimes per 100,000 for Great Falls. Dividing by the FBI's 2024 national violent-crime rate of 359.1 per 100,000 yields 159.8, rounded to TCI 160. `High` is a descriptive label; the app convention remains lower TCI = safer.
- LGBTQ: MAP's statewide policy table gives Montana an overall tally of -1.5 out of 49 as of 2024-11-05. It is stored with its vintage noted. No current HRC Municipal Equality Index score for Great Falls was located, so municipal LGBTQ fields are blank rather than inferred.
- Climate: NOAA 1991-2020 normals for Great Falls International Airport (USW00024143) give annual precipitation 14.76 inches, annual snowfall 66.10 inches, January low 15.0 F, and July high 84.3 F, stored as 15, 66, 15, and 84. `sun_days` and summer humidity are intentionally blank because these official normals do not provide comparable measures. The snowfall drives the repository category `cold_snowy`.
- Economy and lifestyle: Malmstrom Air Force Base makes `defense_hub=Y`. No city-level technology-employment evidence adequate for the product's `tech_hub` flag was found, so it remains `N`. Tags and description describe the established military, arts/culture, river, and outdoor-recreation context without claiming a citywide statistic.
- Gas: AAA's Montana regular-gas average was $3.921 on 2026-07-01, stored as $3.92; this field is volatile.

## Source URLs

- Census QuickFacts: https://www.census.gov/quickfacts/fact/table/greatfallscitymontana/PST045225
- Zillow Home Value Index, Great Falls: https://www.zillow.com/home-values/179627/great-falls-mt/
- Redfin cost-of-living result: https://www.redfin.com/city/8379/MT/Great-Falls/housing-market
- Montana tax overview (2026 top rate and no statewide sales tax): https://www.kiplinger.com/state-by-state-guide-taxes/montana
- Great Falls VA Clinic: https://www.va.gov/montana-health-care/locations/great-falls-va-clinic/
- Montana DOR working military retirement and survivor-benefit exemption: https://www.revenue.mt.gov/publications/wmre
- Montana disabled veteran program: https://mca.legmt.gov/bills/mca/title_0150/chapter_0060/part_0030/section_0110/0150-0060-0030-0110.html
- Official Montana Secretary of State 2016 statewide canvass: https://sosmt.gov/wp-content/uploads/attachments/2016GeneralStatewideCanvass.pdf
- Official Montana Secretary of State 2024 Cascade County results: https://electionresults.mt.gov/ResultsSW.aspx?cty=07&eid=450002785&map=CTY&type=CTYALL
- Great Falls 2024 FBI-UCR-derived crime table: https://www.areavibes.com/great%2Bfalls-mt/crime/
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- MAP state policy score table: https://www.mapresearch.org/equality-map-profiles/policies-table.pdf
- NOAA 1991-2020 annual/seasonal normals, USW00024143: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00024143&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00024143: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00024143&format=json&units=standard&includeAttributes=false
- Montana Cannabis FAQ: https://revenue.mt.gov/card/cannabis/faqs
- Governor Greg Gianforte official site: https://www.governor.mt.gov/
- Malmstrom/Great Falls planning reference: https://greatfallsmt.gov/AgendaCenter/ViewFile/Agenda/_04282026-432
- AAA Montana gas prices: https://gasprices.aaa.com/page/22/?state=MT
