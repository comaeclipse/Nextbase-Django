# Tullahoma, TN Source Notes

Retrieval date: 2026-08-09.

## Geography

- Primary geography: Tullahoma city/place, TN. Tullahoma spans Coffee and Franklin counties; Coffee County is used as the canonical county and election geography.
- Population and density: U.S. Census QuickFacts reports Tullahoma city population estimate 21,279 for July 1, 2025 and 2020 land area 23.44 square miles. Stored density is calculated from the 2025 estimate divided by 2020 land area: 908 people per square mile. Census QuickFacts also lists 2020 Census density as 867.7.
- Census place GEOID: 4775320.
- Pace: project classifier handles pace after import. Do not infer from population or density.

## Cost, Taxes, and Housing

- Zillow Home Value Index reports Tullahoma typical home value of $298,536, updated 2026-06-30.
- ERI reports Tullahoma cost of living 16% below the U.S. average and 6% below the Tennessee average. Stored CostOfLiving index is 84.
- Sales tax is 9.75%, using Tennessee state and local sales tax applicable in Tullahoma.
- Tennessee has no individual income tax on wages/personal income; the Hall income tax was repealed beginning in 2021.
- Gas uses the Tennessee statewide regular-gas average of $3.57 from the supplied 2026-08-09 research record. Replace with a reproducible Tullahoma-local series if city-level gas pricing is required.

## VA and Veteran Benefits

- VA source: Tullahoma VA Clinic, 225 Von Karman Road, Arnold Air Force Base, TN. VA describes it as an outpatient clinic providing primary care, mental health care, and laboratory services.
- Distance method: VHA VAST coordinates for Tullahoma VA Clinic (35.38277, -86.02963) compared to the Tullahoma Census place centroid in the pace bundle (35.373311, -86.218277), rounded by the app's sync method to 11 miles.
- `VA=No` in the CSV because the app's `has_va` convention is true only when the nearest outpatient-capable site is essentially local, under 0.5 miles. This differs from the supplied record's `has_va=Yes` wording but aligns with `scripts/sync-va-facilities.ts`.
- Tennessee veteran benefits include no state income tax, property-tax relief for qualifying disabled veterans and surviving spouses, county motor-vehicle privilege-tax relief for 100% permanent-and-total disabled veterans and former POWs, veteran identification and license plates, recreation and hunting/fishing benefits, burial/cemetery services, education and employment assistance, and state veterans homes.

## Climate

- Display fields use the supplied research record and secondary local climatology: 3 inches snow, 58 inches rain, 205 sunny days, 28 F representative winter low, 88 F July/summer high, and 78% July humidity.
- Climate label is humid subtropical. With AverageHighSummer 88 and HumiditySummer 78, the project categorizer classifies Tullahoma as `hot_humid`.
- Source caveat: exact NOAA/NCEI station normals should be imported through the repo's monthly and hourly weather scripts after the city row and map coordinate are present. The CSV annual display fields are not a substitute for the monthly/hourly normal tables.

## Politics

- State party and governor: Tennessee currently has a Republican governor and Republican trifecta; stored as `R`.
- Election geography: Coffee County. Tullahoma also extends into Franklin County, but Coffee County is the canonical county for this row and is explicitly labeled in CityPolitics.
- Denominator: two-party presidential vote.
- 2016 Coffee County presidential votes: Republican 14,417; Democratic 4,743. Trump two-party share = 75.2%, rounded winner percent 75.
- 2024 Coffee County presidential votes: Republican 19,174; Democratic 5,440. Trump two-party share = 77.9%, rounded winner percent 78.
- Trend: Republican two-party share increased 2.7 pp; Democratic two-party share decreased 2.7 pp.

## Safety and Social

- TBI CrimeInsight official 2024 Tullahoma Police Department violent-crimes PDF reports 1 murder, 25 non-consensual sex offenses, and 64 aggravated assaults, for 90 violent offenses.
- TCI method: 90 violent offenses / 21,279 population * 100,000 = 422.95 violent offenses per 100,000. FBI 2024 national violent-crime baseline used in this repo is 359.1 per 100,000. TCI = 422.95 / 359.1 * 100 = 117.8, stored as 118. CrimeRating stored as Moderate.
- Marijuana status: Illegal, per Tennessee Bureau of Investigation hemp/marijuana guidance and existing Tennessee row convention.
- LGBTQ: HRC's 2025 Tennessee MEI city list does not rate Tullahoma. Stored LGBTQ rating is "Not Rated / No Local MEI Score Verified" and LGBTQ_MEI is "Not Rated"; state policy score uses the existing Tennessee MAP convention of -16.50. Do not infer municipal policy from state policy alone.

## Economic Hubs and Lifestyle

- TechHub=Y and DefenseHub=Y are based on Tullahoma's aerospace, aviation, modeling/simulation, and defense test infrastructure rather than a broad software labor market.
- City economic-development source describes Tullahoma as a regional aviation/aerospace hub and home to AEDC, with advanced flight-simulation test facilities, wind tunnels, rocket/turbine test cells, space-environment chambers, arc heaters, and ballistic ranges.
- Tennessee ECD describes Tullahoma as home to AEDC and UTSI and as a hub for aviation, aeronautics, and avionics activities and industries.
- Tullahoma city technology source says UTSI supports AEDC and has graduate study/research in engineering, physics, mathematics, and aviation systems.
- Tags and description emphasize hiking, fishing, low taxes, healthcare, culture, and military/aerospace presence.

## State Info

- The supplied state-info values for Tennessee match the existing `locations_stateinfo` row in Neon: no statewide magazine-capacity limit, Giffords `F`, no ghost-gun ban, no assault-weapons ban, and no high-capacity-magazine ban. No state-info write was needed.

## Source URLs

- Supplied structured research record: `C:\Users\skarz\.codex\attachments\22f8b6da-9475-4654-9c2b-f9227698f941\pasted-text.txt`
- Census QuickFacts Tullahoma: https://www.census.gov/quickfacts/fact/table/tullahomacitytennessee/LND110210
- Zillow Tullahoma ZHVI: https://www.zillow.com/home-values/7486/tullahoma-tn/
- ERI Tullahoma cost of living: https://www.erieri.com/cost-of-living/united-states/tennessee/tullahoma
- Tennessee sales and use tax: https://www.tn.gov/revenue/taxes/sales-and-use-tax.html
- Tennessee income tax withholding guidance: https://revenue.support.tn.gov/hc/en-us/articles/360057595051-GEN-34-Income-Tax-Withholding
- Tullahoma VA Clinic: https://www.va.gov/tennessee-valley-health-care/locations/tullahoma-va-clinic/
- Tennessee veteran benefits: https://www.tn.gov/veteran/veteran-benefits/tn-state-benefits.html
- Tennessee disabled-veteran property-tax relief: https://www.tn.gov/veteran/veteran-benefits/tn-state-benefits/homeowners/property-tax-relief-for-disabled-veterans.html
- Tennessee county motor-vehicle privilege tax exemption: https://www.tn.gov/veteran/veteran-benefits/tn-state-benefits/motor-services/county-motor-vehicle-privilege-tax.html
- Coffee County official 2024 election results: https://www.coffeecountytn.gov/DocumentCenter/View/5613/2024-11-05-Coffee-County-Official-Results
- TBI CrimeInsight 2024 Tullahoma Police Department violent-crimes PDF: https://crimeinsight.tbi.tn.gov/tops/report/violent-crimes/tullahoma-police-department/2024/pdf
- FBI 2024 national UCR summary baseline: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Tennessee marijuana guidance: https://www.tn.gov/tbi/crime-issues/crime-issues/hemp---marijuana.html
- HRC 2025 Tennessee MEI city list: https://www.hrc.org/resources/mei-state/tennessee
- MAP Tennessee state profile: https://www.advancingacceptance.org/equality-map-profiles/TN-summary.pdf
- Tullahoma aviation/aerospace sector: https://www.tullahomatn.gov/business_detail_T16_R244.php
- Tullahoma access to technology: https://www.tullahomatn.gov/business_detail_T16_R187.php
- Tennessee ECD Tullahoma aerospace article: https://tnecd.com/news/its-rocket-science/
