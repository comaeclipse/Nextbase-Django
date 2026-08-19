# Battle Creek, MI Source Notes

Retrieval date: 2026-08-19.

## Geography

- Primary geography: Battle Creek city/place, MI, in Calhoun County. The row represents the city, not the MSA.
- U.S. Census QuickFacts reports Battle Creek city population estimate 52,021 for July 1, 2025.
- Census 2024 Gazetteer place record for GEOID 2605920 reports land area 42.614 square miles and internal point 42.299176, -85.229267.
- Stored density is 52,021 / 42.614 = 1,221 people per square mile.
- Pace: project classifier handles pace after import. Do not infer pace from population or density.

## Cost, Taxes, and Housing

- Zillow Home Value Index reports Battle Creek typical home value of $187,207, data through July 31, 2026. Stored `AvgHomeValue` is `$187,207`; source note should describe this as ZHVI / typical home value, not an average sale price.
- ERI reports Battle Creek cost of living 9% below the U.S. average. Stored CostOfLiving index is 91.
- Michigan Treasury states Michigan sales tax is 6% and local units may not impose sales tax. Stored SalesTax is 6.00.
- Michigan individual income tax is 4.25% in the legacy CSV field. State-owned income-tax facts are not written by `scripts/import-csv.ts`; keep normalized state semantics in `locations_stateinfo`.
- Gas uses AAA Michigan regular average, current average $4.2098 on 2026-08-19, rounded to `$4.21`.

## VA and Veteran Benefits

- Nearest outpatient-capable and hospital VA site is Battle Creek VA Medical Center, 5500 Armstrong Road, Battle Creek, MI 49037-7314.
- VA's campus-map page gives coordinates 42 deg 20 min 50.04 sec N, 85 deg 17 min 52.56 sec W. Great-circle distance from the Census place internal point is 4.83 miles, stored as `5 miles`.
- `VA=Y` because the nearest outpatient-capable VA medical site and nearest VA medical center are within the city and within the 25-mile project outpatient-access radius.
- Michigan veterans benefits: Michigan Veterans Affairs Agency says active-duty and retired military pay is exempt from individual income tax. Michigan Treasury lists military pay tax exemption, Children's Veterans Tuition Grant, disabled-veterans property-tax exemption, principal-residence exemption retention for active duty military personnel, and property-tax relief during active service. MyArmyBenefits also summarizes property-tax credits, National Guard tuition assistance, civil-service preference, vehicle/license-plate benefits, and hunting/fishing license benefits.

## Climate

- Main NOAA/NCEI 1991-2020 Climate Normals station for temperature and precipitation: USW00014815, Battle Creek Kellogg Airport, 42.3075, -85.2511.
- Monthly normals from station USW00014815: January low 17.3 F, July high 83.0 F, annual precipitation 31.52 inches. Stored rounded fields: Rain 32, AverageLowWinter 17, AverageHighSummer 83.
- Snow uses nearby NOAA/NCEI annual/seasonal normals station USC00200552, Battle Creek 5NW, 42.3678, -85.2633, because the Kellogg Airport monthly/annual files do not expose snowfall normals. Annual snowfall is 64.6 inches; stored rounded Snow 65.
- Sunny days use BestPlaces' Battle Creek climate summary of 166 sunny days per year because NOAA monthly normals do not include annual sunny-day counts.
- Summer humidity uses TimeAndDate's Battle Creek July climate summary of 67% relative humidity as a secondary source. The monthly NOAA station product does not carry relative humidity; hourly dew-point normals are imported separately by `scripts/import-hourly-normals.ts`.
- Climate label is humid continental. With annual snowfall above 30 inches, the project categorizer should classify Battle Creek as `cold_snowy`.

## Politics

- Election geography: Calhoun County presidential returns. This matches the existing project convention for most rows, but it is a county proxy for the city.
- 2024 Calhoun County official election results report Trump/Vance 38,606 and Harris/Walz 28,988.
- 2016 Calhoun County presidential results use MEDSL/Wikipedia county table values for Michigan: Trump 31,494 and Clinton 24,157.
- Denominator: two-party presidential vote for trend math and stored winner percentages.
- 2016 Trump two-party share = 31,494 / (31,494 + 24,157) = 56.59%, rounded winner percent 57.
- 2024 Trump two-party share = 38,606 / (38,606 + 28,988) = 57.11%, rounded winner percent 57.
- Trend: Republican two-party share increased 0.5 pp; Democratic two-party share decreased 0.5 pp. Stored ElectionChange: `0.5 pp more Republican since 2016`.
- CityPolitics stored as `Moderately Conservative` because the county proxy showed a mid-to-high-50s Republican two-party share in both presidential years. This should be revisited if city-precinct presidential returns are imported later.
- State party/governor: Michigan governor Gretchen Whitmer is a Democrat. These are state-owned legacy CSV fields and are not written by `scripts/import-csv.ts`.

## Safety and Social

- TCI method: violent-crime-rate proxy indexed to the 2024 FBI national violent-crime rate of 359.1 per 100,000, matching recent repo ingests.
- OpenCrime reports Battle Creek 2024 violent-crime rate 1,121.6 per 100,000, 686 violent crimes, 5 murders, and property-crime rate 2,522.8 per 100,000. AreaVibes reports the same rounded violent-crime count/rate.
- TCI = 1,121.6 / 359.1 * 100 = 312.3, stored as 312. CrimeRating stored as High.
- Marijuana status: Recreational, using existing Michigan row convention.
- LGBTQ: HRC's 2025 Municipal Equality Index covers 506 municipalities but no Battle Creek scorecard was found in the 2025 scorecard search. Stored LGBTQ_MEI is `Not Rated`.
- Battle Creek has local LGBTQ protections: city fair-housing materials say Battle Creek ordinances prohibit discrimination based on sexual orientation/gender identity, and Chapter 214 of the city code includes sexual orientation and gender identity language.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=N. Battle Creek has manufacturing/food-industry history and public-sector/defense presence, but was not classified as a broad software/technology employment hub for this row.
- DefenseHub=Y. Battle Creek hosts Battle Creek Air National Guard Base / 110th Wing and DLA activity at Hart-Dole-Inouye Federal Center. Military OneSource lists Defense Logistics Agency contact information at 74 Washington Avenue North, Battle Creek, and DLA Disposition Services says its headquarters is at Hart-Dole-Inouye Federal Center in Battle Creek. `DefenseHub=Y` writes a reviewed manual true, and `scripts/recompute-defense-hub.ts` owns the derived `defense_hub` column.
- HasWalmart=Y. Walmart's official store directory lists one Battle Creek Walmart store: Battle Creek Supercenter, 6020 B Dr N, Battle Creek, MI 49014.
- HasCostco=N. Costco's Michigan warehouse directory lists Auburn Hills, Bloomfield, Commerce Township, East Lansing, Fruitport, Genesee County, Grand Rapids, Green Oak Township, Haggerty, Kalamazoo, Lakeside, Madison Heights, Middlebelt, Midland, Pittsfield Township, Roseville MI, Traverse City, and Wyoming, but no Battle Creek warehouse.
- Tags and description: VA medical center and healthcare access, Battle Creek Air National Guard Base / DLA defense signal, Kalamazoo/Battle Creek river setting, nearby lakes/fishing/golf/parks, cereal-industry identity, and small-city character.

## Source URLs

- Census QuickFacts Battle Creek: https://www.census.gov/quickfacts/fact/table/battlecreekcitymichigan/PST045225
- Census Gazetteer files source for coordinates: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
- Census 2024 Gazetteer place file: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip
- Zillow Battle Creek ZHVI: https://www.zillow.com/home-values/37303/battle-creek-mi/
- ERI Battle Creek cost of living: https://www.erieri.com/cost-of-living/united-states/michigan/battle-creek
- Michigan Treasury sales and use tax: https://www.michigan.gov/taxes/business-taxes/sales-use-tax
- Tax Foundation Michigan tax overview: https://taxfoundation.org/location/michigan/
- AAA Michigan gas prices: https://gasprices.aaa.com/?state=MI
- VA Battle Creek Health Care: https://www.va.gov/battle-creek-health-care/
- Battle Creek VA Medical Center: https://www.va.gov/battle-creek-health-care/locations/battle-creek-va-medical-center/
- Battle Creek VA Medical Center campus map: https://www.va.gov/battle-creek-health-care/locations/battle-creek-va-medical-center/campus-map/
- Michigan Veterans Affairs Agency state benefits: https://www.michigan.gov/mvaa/quality-of-life/quality-of-life/state-of-michigan-veteran-benefits
- Michigan Treasury military and veteran benefits: https://www.michigan.gov/treasury/news/2023/11/09/treasury-provides-special-benefits-to-military-members-and-veterans
- MyArmyBenefits Michigan military and veterans benefits: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Michigan
- NOAA/NCEI monthly normals station CSV, USW00014815: https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00014815.csv
- NOAA/NCEI annual/seasonal normals station CSV, USW00014815: https://www.ncei.noaa.gov/data/normals-annualseasonal/1991-2020/access/USW00014815.csv
- NOAA/NCEI annual/seasonal normals station CSV, USC00200552: https://www.ncei.noaa.gov/data/normals-annualseasonal/1991-2020/access/USC00200552.csv
- BestPlaces Battle Creek climate: https://www.bestplaces.net/climate/city/mi/battle_creek
- TimeAndDate Battle Creek climate averages: https://www.timeanddate.com/weather/@4985153/climate
- Calhoun County official 2024 election results: https://elections.calhouncountymi.gov/Nov2024/
- MEDSL county presidential returns 2000-2024: https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/VOQCHQ
- Wikipedia 2016 Michigan county presidential table cross-check: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Michigan
- OpenCrime Battle Creek 2024 crime: https://www.opencrime.us/cities/battle-creek-michigan
- AreaVibes Battle Creek crime cross-check: https://www.areavibes.com/battle%2Bcreek-mi/crime/
- HRC Municipal Equality Index 2025: https://reports.hrc.org/municipal-equality-index-2025
- Battle Creek Fair Housing: https://www.battlecreekmi.gov/566/Fair-Housing
- Battle Creek Code Chapter 214: https://codelibrary.amlegal.com/codes/battlecreek/latest/battlecreek_mi/0-0-0-29302
- Military OneSource Hart-Dole-Inouye Federal Center: https://installations.militaryonesource.mil/military-installation/hart-dole-inouye-federal-center
- Military OneSource Hart-Dole-Inouye Federal Center overview: https://installations.militaryonesource.mil/in-depth-overview/hart-dole-inouye-federal-center
- DLA Disposition Services about page: https://www.dla.mil/Disposition-Services/About/
- 110th Wing official site: https://www.110wg.ang.af.mil/
- Walmart Battle Creek store directory: https://www.walmart.com/store-directory/mi/battle%20creek
- Walmart Battle Creek Supercenter: https://www.walmart.com/store/2080-battle-creek-mi
- Costco Michigan warehouses: https://www.costco.com/sitemaps/warehouses-by-state/MI
- Battle Creek visitors guide: https://www.battlecreekvisitors.org/

## Known Limitations

- 2024 presidential results are official Calhoun County results; 2016 values use the MEDSL/Wikipedia county table. This is a county proxy for Battle Creek, not precinct-level city returns.
- City-level crime data is sourced from FBI UCR mirrors because they expose exact 2024 city rates and offense counts in a reusable format; the source note preserves the rate, denominator, and cross-check.
- Annual sunny days and summer relative humidity are secondary climate measures because NOAA monthly normals do not publish those legacy fields.
- Snowfall uses the nearby Battle Creek 5NW NOAA station because the Battle Creek Kellogg Airport normals files do not expose snowfall values.
- HRC MEI is stored as `Not Rated`; this is not a zero score. Local SOGI protections are separately documented from city code and fair-housing materials.
- Live Neon import and all phase-2 scripts are intentionally deferred until this source artifact lands on `master`.
