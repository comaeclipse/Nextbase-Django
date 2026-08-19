# Kāneʻohe, HI Source Notes

Retrieval date: 2026-08-19.

## Geography

- Primary geography: Kāneʻohe CDP, HI, in Honolulu County. The row represents the Census CDP/community, not the Urban Honolulu CDP or the full county.
- U.S. Census QuickFacts reports the 2020 Census population for Kaneohe CDP as 37,430. QuickFacts marks 2025 place estimates as not applicable for this CDP.
- Stored density uses Census QuickFacts 2020 population density: 5,720.6 people per square mile, rounded to 5,721.
- Census Gazetteer 2024 place file lists Kaneohe CDP GEOID `1528250`, land area 6.543 square miles, internal point latitude 21.409332 and longitude -157.789648.
- The CSV keeps the requested display spelling `Kāneʻohe` but uses the official Census ASCII place match `Kaneohe CDP` for source joins.
- Pace: project classifier handles pace after import. Do not infer pace from population or density.

## Cost, Taxes, and Housing

- Zillow Home Value Index reports the typical Kaneohe, HI home value as $1,089,620, data through July 31, 2026. Stored `AvgHomeValue` is `$1,089,620`; source notes should describe this as ZHVI / typical home value, not an average sale price.
- ERI reports Kaneohe cost of living 56% above the U.S. average and 3% below the average city in Hawaii. Stored CostOfLiving index is 156.
- Avalara reports the minimum combined 2026 sales tax/GET rate for Kaneohe, Hawaii as 4.5%, with Hawaii state rate 4.0% and Kaneohe city rate 0.0%. Stored SalesTax is 4.5.
- Hawaii top individual income tax is 11.00% in the legacy CSV field. State-owned income-tax facts are not written by `scripts/import-csv.ts`; keep normalized state semantics in `locations_stateinfo`.
- Gas uses AAA Honolulu regular average, current average $5.3622 on 2026-08-18, rounded to `$5.36`. This is the closest AAA metro listing for Kāneʻohe/Oʻahu.

## VA and Veteran Benefits

- VA Pacific Islands lists Windward VA Clinic at 46-001 Kamehameha Highway, Castle Professional Center, Suite 301, Kaneohe, HI 96744-3711.
- `VA=Y` and `DistanceToVA=0 miles` because the outpatient-capable Windward VA Clinic is in Kāneʻohe.
- Nearest VA medical center for hospital-style VA access is Spark M. Matsunaga Department of Veterans Affairs Medical Center, 459 Patterson Road, Honolulu, HI 96819-1522. The VA page says the main campus provides primary care and specialty health services, including mental health care, PTSD treatment, geriatrics, and suicide prevention. A later live import should let the official VA sync calculate exact outpatient and hospital distances.
- Hawaii veterans benefits: MyArmyBenefits reports military retired pay is exempt from Hawaii income tax, VA disability retirement pay should not be included in taxable income, DIC is tax-free, and SBP/RCSBP/RSFPP annuities are not taxed in Hawaii. Hawaii Office of Veterans' Services says totally disabled veterans or their widow(er) may receive real property tax exemptions, with details varying by island/county.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals monthly station for stored temperature, precipitation, and snow fields: USC00513117, Kaneohe 838.1, HI US, about 1.2 miles from the Census CDP internal point.
- Monthly normals from USC00513117: January low 66.3 F, July high 83.8 F, annual precipitation 50.90 inches, annual snowfall 0.0 inches. Stored rounded fields: Snow 0, Rain 51, AverageLowWinter 66, AverageHighSummer 84.
- NOAA hourly normals are not available for USC00513117. If the live import proceeds, the nearest hourly moisture station with 1991-2020 normals is USW00022519, Kaneohe Bay MCAS, for dew point / hourly moisture rows.
- Sunny days use BestPlaces' Kaneohe climate summary of 268 sunny days per year because NOAA monthly normals do not publish annual sunny-day counts.
- Summer humidity uses Current Results' Hawaii July relative humidity table as a state/Oʻahu proxy: 80% morning and 67% afternoon, averaged to 74%. The monthly NOAA station product does not carry relative humidity; hourly dew-point normals should be imported separately by `scripts/import-hourly-normals.ts` in phase 2.
- Climate label is `Tropical`. With warm winter lows and summer humidity above 65%, the project categorizer should classify this row as `hot_humid`.

## Politics

- Election geography: Honolulu County / City and County of Honolulu, used as the closest clean official election geography for the Kāneʻohe CDP. A city-level precinct aggregation was not used because the CDP boundary does not map cleanly to a published precinct set without a GIS crosswalk.
- Denominator: two-party presidential vote for trend math and stored winner percentages.
- 2016 Honolulu County presidential votes from the certified Hawaii City and County of Honolulu summary: Clinton 175,696; Trump 90,326. Clinton two-party share = 66.05%, rounded winner percent 66.
- 2024 Honolulu County presidential votes from the certified Hawaii City and County of Honolulu summary: Harris 204,301; Trump 130,489. Harris two-party share = 61.02%, rounded winner percent 61.
- Trend: Republican two-party share increased from 33.95% to 38.98%, or 5.0 pp; Democratic two-party share decreased 5.0 pp. Stored ElectionChange: `5.0 pp more Republican since 2016`.
- CityPolitics stored as `Moderate left` because the county proxy remains Democratic by about 22 two-party points but shifted right from 2016 to 2024.
- State party/governor: Hawaii governor Josh Green is a Democrat. These are state-owned legacy CSV fields and are not written by `scripts/import-csv.ts`.

## Safety and Social

- TCI method: violent-crime-rate proxy indexed to the FBI 2024 national violent-crime rate of 359.1 per 100,000, matching recent repo ingests.
- USAFacts, sourcing FBI UCR data, reports Hawaii's 2024 violent-crime rate as 218 per 100,000 and property-crime rate as 1,947 per 100,000. It also says Hawaii's violent-crime rate was 39.4% below the U.S. average.
- TCI = 218 / 359.1 * 100 = 60.7, stored as 61. CrimeRating stored as Low.
- Limitation: this is a state-level proxy because a reliable city-specific 2024 Kāneʻohe violent-crime rate was not found. Honolulu Police Department serves the island/county, and public incident maps are dynamic rather than a stable annual FBI-style rate.
- Marijuana status: `Decriminalized`, using the existing normalized Hawaii state convention in `locations_stateinfo`.
- LGBTQ: HRC's 2025 MEI Hawaii page covers rated Hawaii municipalities, and no 2025 HRC scorecard was found for Kāneʻohe. Stored LGBTQ and LGBTQ_MEI are `Not Rated` rather than borrowing Honolulu's score.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=N. Kāneʻohe has health care, retail, public-sector, tourism/outdoor-recreation, and military-adjacent employment, but no source-backed broad technology employment hub signal was found for this row.
- DefenseHub=Y. Marine Corps Base Hawaii / MCAS Kaneohe Bay is adjacent to the Kāneʻohe community on the Mokapu Peninsula; the official Marine Corps page describes MCBH/MCAS Kaneohe Bay as providing training and operational support, facilities, and services for operating forces in the Indo-Asia-Pacific region. `DefenseHub=Y` writes a reviewed manual true, and `scripts/recompute-defense-hub.ts` owns the derived `defense_hub` column.
- HasWalmart=N. Walmart's official Hawaii store directory and indexed official store pages show nearby Oʻahu stores in Honolulu, Pearl City, Waipahu, Mililani, and Kapolei, but no in-city Kaneohe Walmart store was found.
- HasCostco=N. Costco's official Hawaii warehouse directory lists Hawaii Kai, Iwilei, Kapolei, and Waipio on Oʻahu, but no Kaneohe warehouse.
- Tags and description: Windward VA Clinic, Kāneʻohe Bay/coastal access, Koʻolau Range scenery, fishing/boating context, and the nearby Marine Corps Base Hawaii defense/military signal.

## Source URLs

- Census QuickFacts Kaneohe CDP: https://www.census.gov/quickfacts/fact/table/kaneohecdphawaii/PST045225
- Census Gazetteer files source for coordinates: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
- Zillow Kaneohe ZHVI: https://www.zillow.com/home-values/12157/kaneohe-hi/
- ERI Kaneohe cost of living: https://www.erieri.com/cost-of-living/united-states/hawaii/kaneohe
- Avalara Kaneohe sales tax / GET rate: https://www.avalara.com/us/en/taxrates/state-rates/hawaii/cities/kaneohe.html
- Tax Foundation Hawaii tax overview: https://taxfoundation.org/location/hawaii/
- AAA Hawaii gas prices: https://gasprices.aaa.com/?state=HI
- Windward VA Clinic: https://www.va.gov/pacific-islands-health-care/locations/windward-va-clinic/
- VA Pacific Islands locations: https://www.va.gov/pacific-islands-health-care/locations/
- Spark M. Matsunaga VA Medical Center: https://www.va.gov/pacific-islands-health-care/locations/spark-m-matsunaga-department-of-veterans-affairs-medical-center/
- MyArmyBenefits Hawaii military and veterans benefits: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Hawaii
- Hawaii Office of Veterans' Services benefits and services: https://dod.hawaii.gov/ovs/benefits-and-services/
- NOAA/NCEI monthly normals station CSV, Kaneohe 838.1: https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USC00513117.csv
- NOAA/NCEI hourly normals station CSV, Kaneohe Bay MCAS: https://www.ncei.noaa.gov/data/normals-hourly/1991-2020/access/USW00022519.csv
- BestPlaces Kaneohe climate: https://www.bestplaces.net/climate/city/hawaii/kaneohe
- Current Results Hawaii humidity: https://www.currentresults.com/Weather/Hawaii/humidity-by-month.php
- National Weather Service Honolulu climate summary: https://www.weather.gov/hfo/climate_summary
- Hawaii Office of Elections certified results page: https://elections.hawaii.gov/election-results/
- Hawaii 2024 City and County of Honolulu certified summary PDF: https://files.hawaii.gov/elections/files/results/2024/General/cch.pdf
- Hawaii 2016 City and County of Honolulu certified summary PDF: https://files.hawaii.gov/elections/files/results/2016/general/cch.pdf
- USAFacts Hawaii crime rate, sourced to FBI UCR: https://usafacts.org/answers/what-is-the-crime-rate-in-the-us/state/hawaii/
- HRC MEI Hawaii page: https://www.hrc.org/resources/mei-state/hawaii
- HRC Municipal Equality Index 2025 report page: https://reports.hrc.org/municipal-equality-index-2025
- Marine Corps Base Hawaii official site: https://www.mcbhawaii.marines.mil/
- MCBH / MCAS Kaneohe Bay video page: https://www.mcbhawaii.marines.mil/Media-Room/Videos/videoid/630489/
- Walmart Hawaii store directory: https://www.walmart.com/store-directory/hi
- Costco Hawaii warehouses: https://www.costco.com/sitemaps/warehouses-by-state/HI

## Known Limitations

- Kāneʻohe is stored with the Hawaiian display spelling requested by the user, while Census and many source systems use `Kaneohe`; import and map follow-up scripts may need a narrow alias if they key strictly on Census ASCII names.
- Election values use Honolulu County as a proxy because a defensible CDP-to-precinct aggregation requires a GIS crosswalk that was not completed in this phase.
- TCI uses a Hawaii statewide FBI-derived violent-crime-rate proxy because no stable city-specific 2024 Kāneʻohe rate was found.
- Annual sunny days and summer relative humidity are secondary climate measures because NOAA monthly normals do not publish those legacy fields.
- HRC MEI is intentionally `Not Rated` for Kāneʻohe; do not substitute Honolulu's municipal score.
- Live Neon import, VA sync-derived hospital distance, monthly/hourly weather table writes, pace resolution, map crosswalk regeneration, structural feature derivation, and runtime verification remain phase-2 tasks after this research artifact is merged to `master`.
