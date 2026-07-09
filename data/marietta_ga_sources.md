# Marietta, GA Source Notes

Retrieval date: 2026-07-09.

## Scope and geography

- Interpreted the requested location as the City of Marietta, Georgia; no separate municipality named "King of Marietta" was found.
- The row represents the incorporated city of Marietta in Cobb County. Population and density are city-level; presidential results are county-level because a defensible city-boundary/precinct crosswalk was not available during this ingest.

## Imported values and method

- Population and density: Census QuickFacts gives a July 1, 2025 population estimate of 63,574 and 2020 density of 2,602 people per square mile.
- Housing: Zillow's Marietta ZHVI page reports a typical home value of $479,794 through 2026-05-31. The database column is named `avg_home_value`, but the source is Zillow Home Value Index, not an average or median.
- Cost and taxes: Redfin's C2ER-based calculator reports Marietta's overall cost of living as 6 percent below the national average, stored as index 94. Georgia's Department of Revenue rate chart lists Cobb County at 6 percent sales tax effective 2026-07-01. Georgia DOR reports the current flat individual income-tax rate as 4.99 percent.
- VA and veteran benefits: West Cobb County VA Clinic is at 333 Midway Road in Marietta, so the row uses local access and a zero-mile distance. The benefit summary is limited to Georgia DOR's documented retirement/military-retirement exclusions and GDVS's indexed disabled-veteran homestead exemption.
- Elections: Cobb County official 2016 results were Clinton 160,121 and Trump 152,912, producing a Democratic two-party share of 51.15 percent. The county's official 2024 report was Harris 228,404 and Trump 168,679, producing a Democratic two-party share of 57.52 percent. Values are rounded whole winner shares (51 and 58); the change fields use unrounded two-party shares: Republican -6.4 pp and Democratic +6.4 pp. `city_politics` is expressly county-level and follows the guide's 55-64.9 percent Democratic = Liberal threshold.
- Crime: Marietta Police reported 199 violent crimes among a 2024 population of 63,914, or 3.11 per 1,000 (311 per 100,000). Dividing by the FBI's 2024 national violent-crime rate of 359.1 per 100,000 produces 86.6, rounded to TCI 87. `Moderate` is a descriptive label; lower TCI remains safer.
- LGBTQ: MAP's current Georgia profile reports an overall policy score of -0.75 out of 49, which is stored in `lgbtq_state_policy_score`. No current HRC Municipal Equality Index score for Marietta was located, so `lgbtq_rating` and `lgbtq_mei_score` are intentionally blank rather than inferred.
- Climate: NOAA 1991-2020 normals for nearby Hartsfield-Jackson Atlanta (USW00013874) provide annual precipitation 50.43 inches, annual snowfall 2.20 inches, January low 35.6 F, and July high 90.1 F, rounded to 50, 2, 36, and 90. Timeanddate's Marietta climate table reports July humidity of 70 percent. `sun_days` remains blank because these sources do not provide a comparable annual sunny-days measure. The documented values classify as `hot_humid` under the repository rule (summer high at least 88 and humidity at least 60).
- Economy and lifestyle: Dobbins Air Reserve Base is in Marietta and supports a defense-hub flag. The City of Marietta lists museums, live theatre, 18 parks, and nearby Kennesaw Mountain National Battlefield Park; this supports the description and tags. No city-level technology-employment evidence sufficient for the product's `tech_hub` flag was found, so it remains `N`.
- Gas: AAA Atlanta regular gasoline average was $3.526 on 2026-07-09, rounded to $3.53.

## Source URLs

- Census QuickFacts: https://www.census.gov/quickfacts/fact/table/mariettacitygeorgia/PST045224
- Zillow Home Value Index, Marietta: https://www.zillow.com/home-values/132095/marietta-ga/
- Redfin cost-of-living calculator and C2ER methodology: https://www.redfin.com/cost-of-living-calculator/marietta-ga
- Georgia DOR sales-tax rate chart, effective 2026-07-01: https://dor.georgia.gov/document/document/general-rate-chart-effective-july-1-2026-through-september-30-2026pdf/download
- Georgia DOR current tax updates: https://dor.georgia.gov/taxes/important-tax-updates
- West Cobb County VA Clinic: https://www.va.gov/atlanta-health-care/locations/west-cobb-county-va-clinic/
- Georgia DOR retirement and military-retirement income exclusion: https://dor.georgia.gov/retirement-income-exclusion
- Georgia Department of Veterans Service disabled-veteran homestead exemption: https://veterans.georgia.gov/disabled-veteran-homestead-tax-exemption
- Cobb County official 2016 results: https://s3.us-west-2.amazonaws.com/cobbcounty.org.if-us-west-2/prod/2019-07/2016Nov_OfficialResultsByPrecinct.pdf
- Cobb County official 2024 results: https://assets.cobbcounty.gov/files/2024-11/ElectionSummaryReportRPT_0.pdf
- Marietta Police 2019-2024 crime-by-population report: https://www.mariettaga.gov/DocumentCenter/View/18148/Marietta-Police-Crimes-by-Population-2019-2024
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- MAP Georgia equality profile: https://mapresearch.org/equality-profiles/ga
- NOAA 1991-2020 annual/seasonal normals, USW00013874: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00013874&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00013874: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00013874&format=json&units=standard&includeAttributes=false
- Marietta climate averages: https://www.timeanddate.com/weather/%40z-us-30068/climate
- Dobbins Air Reserve Base: https://www.afrc.af.mil/dobbins/
- City of Marietta things to do: https://mariettaga.gov/826/Things-to-Do
- AAA Georgia/Atlanta gas prices: https://gasprices.aaa.com/?state=GA
