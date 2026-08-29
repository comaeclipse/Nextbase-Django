# Flagstaff, AZ Source Notes

Retrieval date: 2026-08-29.

## Geography and source choices

- Primary geography: incorporated City of Flagstaff, Coconino County, Arizona.
- Population, density, housing, VA access, HRC MEI, Walmart, and Costco are city-level.
- Presidential election fields use Coconino County official general election results; `city_politics` is explicitly marked `County-level: Liberal`.
- Weather uses NOAA 1991-2020 climate normals for station `USW00003103` (Flagstaff Pulliam Airport) for snowfall, precipitation, winter low, and summer high. Sunshine and July humidity use documented secondary climate sources because comparable NOAA normals do not provide those exact product fields.

## Imported values and method

- Population and density: U.S. Census Bureau 2020 Census records Flagstaff city population as 76,831 and land area as 63.87 square miles. Population density is calculated as 76,831 / 63.87 = 1,203 residents per square mile, stored as `76,831` and `1,203`.
- Housing: Zillow Home Value Index (ZHVI) for Flagstaff city reports a typical home value of $721,900 as of August 2026. The model field is named `avg_home_value`, but this is Zillow Home Value Index typical value.
- Cost and taxes: Combined Transaction Privilege Tax (sales tax) rate for Flagstaff, AZ is 9.386 percent (5.600% Arizona State + 1.300% Coconino County + 2.486% City of Flagstaff). State individual income tax is flat 2.5%, and military retired pay is 100% exempt from state income tax under ARS § 43-1022. The CSV includes state tax fields for compatibility only; `scripts/import-csv.ts` ignores state-owned tax fields. Cost-of-living index is initialized as 115 and derived post-import from BEA Regional Price Parities via `scripts/sync-col-index-from-rpp.ts`.
- VA and veterans benefits: Northern Arizona VA Health Care System operates the Flagstaff VA Clinic at 1300 W University Ave, Suite 200, Flagstaff, AZ 86001. Local VA access is set to `Yes` and `0 miles`. State benefits (100% military pension exemption, property-tax relief for disabled veterans, tuition assistance, state park benefits, hunting/fishing privileges) are state-owned in `locations_stateinfo`.
- Elections: County-level presidential results are used. 2016 Coconino County results: Clinton 31,170, Trump 27,871 (total two-party 59,041; Clinton two-party share 52.79%, rounded to 53%). 2024 Coconino County results: Harris 41,504, Trump 26,456 (total two-party 67,960; Harris two-party share 61.07%, rounded to 61%). Republican two-party share shifted from 47.21% to 38.93% (`rep_vote_share_change_pp = -8.3`), Democratic share shifted from 52.79% to 61.07% (`dem_vote_share_change_pp = 8.3`), and `election_change = 8.3 pp more Democratic since 2016`.
- Crime: FBI UCR / AreaVibes reported violent crime rate for Flagstaff is 463 per 100,000 residents. Divided by the FBI 2024 national violent crime baseline rate (359.1 per 100,000) yields 128.9, stored as `TCI = 129` and `CrimeRating = Moderate`. Flagstaff Police Department CompStat reports show a 13-month downward crime trend in early 2025.
- Cannabis: Arizona adult-use marijuana was legalized under Proposition 207, stored as `Recreational`.
- LGBTQ: HRC 2024 Municipal Equality Index (MEI) scorecard awarded Flagstaff a score of `95` out of 100 with an "All-Star City" designation. MAP Arizona Equality Profile overall policy score is 8.0 out of 49; stored in legacy fields for review.
- Technology and defense: Flagstaff is marked `TechHub=Y` anchored by Northern Arizona University, Lowell Observatory, USGS Astrogeology Science Center, and W.L. Gore & Associates. It is marked `DefenseHub=N` for human curation because it has no primary RTX contractor job-sites in `defense_employer_locations`.
- Retail: Walmart Supercenter #2080 is located at 2750 S Woodlands Village Blvd, Flagstaff, AZ (`HasWalmart=Y`). Costco Wholesale #1041 is located at 2500 E Lucky Ln, Flagstaff, AZ (`HasCostco=Y`).
- Climate: NOAA 1991-2020 normals for Flagstaff Pulliam Airport (`USW00003103`) yield annual snowfall 90.1 inches (stored as 90), annual precipitation 20.52 inches (stored as 21), winter (DJF) average low 17.6°F (stored as 18), and summer (JJA) average high 82.0°F (stored as 82). BestPlaces reports 288 sunny days per year, and Weather Atlas reports July average relative humidity of 38 percent.
- Gas: AAA Arizona state average regular gas price as of August 2026 is ~$3.49 per gallon, stored as `$3.49`.

## Source URLs

- U.S. Census Bureau QuickFacts, Flagstaff city: https://www.census.gov/quickfacts/flagstaffcityarizona
- Zillow Home Value Index, Flagstaff AZ: https://www.zillow.com/home-values/39745/flagstaff-az/
- Arizona Department of Revenue Transaction Privilege Tax rates: https://azdor.gov/transaction-privilege-tax/tpt-rates
- Arizona ARS § 43-1022 Military Retired Pay Exemption: https://www.azleg.gov/ars/43/01022.htm
- Flagstaff VA Clinic (NAVAHCS): https://www.va.gov/northern-arizona-health-care/locations/flagstaff-va-clinic/
- Coconino County Official Election Results 2016 & 2024: https://www.coconino.az.gov/elections
- Flagstaff Police Department Statistics: https://www.flagstaff.az.gov/1179/Police-Department-Reports-Statistics
- FBI Crime Data Explorer: https://cde.ucr.cjis.gov/
- HRC 2024 Municipal Equality Index Scorecard: https://www.hrc.org/resources/municipal-equality-index
- MAP Arizona Equality Profile: https://www.lgbtmap.org/equality_maps/profile_state/AZ
- NOAA NCEI 1991-2020 Climate Normals, USW00003103: https://www.ncei.noaa.gov/access/us-climate-normals/
- AAA Arizona Gas Prices: https://gasprices.aaa.com/state-gas-price-averages/
- Walmart Supercenter Flagstaff #2080: https://www.walmart.com/store/2080-flagstaff-az
- Costco Wholesale Flagstaff #1041: https://www.costco.com/warehouse-locations/flagstaff-az-1041.html
