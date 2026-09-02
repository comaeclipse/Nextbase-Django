# Austin, TX Source Notes

Research date: 2026-09-02

## Stored row

- CSV: `data/austin_tx.csv`
- City/county convention: Austin is primarily in Travis County (small peripheral portions extend into Williamson and Hays counties, but county-level joins, elections, and existing database rows use Travis County as the primary county).
- Geo identity: Census Place GEOID 4805000; internal point coordinates 30.2986, -97.7541 (Census 2024 Gazetteer).
- Transition note: Austin existed in `locations_location` as a non-candidate city row (`id: 307`, `is_candidate: false`, added 2026-08-27 as an employer/parent anchor with core candidate fields unpopulated). This research package completes the curated candidate row.

## Sources and field mapping

- **Population and density:**
  - Source: U.S. Census Bureau QuickFacts, Austin city, Texas (V2025). July 1, 2025 population estimate: 1,002,632. 2020 Census population: 961,855.
  - Land area: 2020 Census land area = 319.94 sq mi.
  - Density calculation: 1,002,632 / 319.94 = 3,133.8 -> 3,134 people per sq mi (2020 Census density was 3,006.4 people per sq mi).
  - Source URL: https://www.census.gov/quickfacts/fact/table/austincitytexas/PST045224

- **Housing / typical home value:**
  - Source: Zillow Home Value Index (ZHVI), Austin, TX, all homes, mid-tier, smoothed, seasonally adjusted.
  - Typical home value as of July 31, 2026: $504,148 (-4.4% 1-year change).
  - Source URL: https://www.zillow.com/home-values/10221/austin-tx/

- **Cost of living:**
  - Note: `col_index` and `cost_of_living` are derived automatically from BEA Regional Price Parities post-merge via `scripts/import-bea-rpp.ts` and `scripts/sync-col-index-from-rpp.ts`. Stored CSV `CostOfLiving` is 98 (aligning with Austin MSA all-items RPP index).

- **Sales tax:**
  - Texas state sales tax: 6.25%
  - Austin city sales tax: 1.00%
  - Capital Metropolitan Transportation Authority (CapMetro): 1.00%
  - Combined sales tax rate: 8.25% (statutory maximum under Texas law).
  - Source: Texas Comptroller of Public Accounts / Avalara Austin sales tax rate (2026).
  - Source URL: https://comptroller.texas.gov/taxes/sales/

- **Income tax:**
  - Texas has no state individual income tax (Article VIII, Section 24-a of the Texas Constitution); stored `Income` is 0.00.
  - Source: Texas Comptroller of Public Accounts.

- **VA access:**
  - Nearest outpatient VA facility: Austin VA Clinic, 7901 Metropolis Dr, Austin, TX 78744 (a major 275,000 sq ft VHA outpatient clinic in southeast Austin operated by Central Texas Veterans Health Care System). Stored centroid-to-clinic distance: 7 miles.
  - Nearest VA medical center (hospital): Olin E. Teague Veterans' Center (Temple VA Medical Center), 1901 S 1st St, Temple, TX 76504 (approx 59 miles).
  - `VA=Yes` (outpatient facility is 7 miles from centroid, well within the 25-mile threshold).
  - Source: U.S. Department of Veterans Affairs, Central Texas Veterans Health Care System.
  - Source URL: https://www.va.gov/central-texas-health-care/locations/austin-va-clinic/

- **Veterans benefits:**
  - Texas offers complete exemption of military retirement pay and Survivor Benefit Plan payments from state income taxes.
  - Texas Tax Code Section 11.22 provides disabled veterans property tax exemptions between $5,000 and $12,000 on residence homesteads based on VA disability percentage (10% to 99%).
  - Texas Tax Code Section 11.131 provides a 100% total exemption from property taxes on residence homesteads for veterans with a 100% service-connected disability or individual unemployability (continuation for surviving spouses).
  - Source: Texas Veterans Commission & Texas Comptroller.
  - Source URLs: https://tvc.texas.gov/ and https://comptroller.texas.gov/taxes/property-tax/exemptions/disabledvet-faq.php

- **State politics / Governor:**
  - Governor: Greg Abbott (Republican). Stored `StateParty=R`, `Governor=R`.
  - Source URL: https://gov.texas.gov/

- **Politics and elections (Travis County, TX):**
  - Geography: Travis County, TX (primary county for Austin).
  - 2016 Presidential Election:
    - Hillary Clinton (Dem): 306,475 votes
    - Donald Trump (Rep): 126,750 votes
    - Two-party total: 433,225 votes
    - Clinton two-party share: 70.74% (rounded to 71%)
    - Trump two-party share: 29.26%
  - 2024 Presidential Election:
    - Kamala Harris (Dem): 398,968 votes (68.32% total)
    - Donald Trump (Rep): 170,781 votes (29.25% total)
    - Two-party total: 569,749 votes
    - Harris two-party share: 70.03% (rounded to 70%)
    - Trump two-party share: 29.97%
  - Partisan trend (2016 to 2024):
    - Republican two-party change: 29.97% - 29.26% = +0.71 pp (+0.7 pp)
    - Democratic two-party change: 70.03% - 70.74% = -0.71 pp (-0.7 pp)
    - Stored `rep_vote_share_change_pp`: 0.7, `dem_vote_share_change_pp`: -0.7
    - Stored `election_change`: "0.7 pp more Republican since 2016"
  - Classification: Strongly Liberal (Travis County vote is 70%+ Democratic; Austin city municipal government and legislative delegation are overwhelmingly Democratic/progressive).
  - Sources: Travis County Clerk Official Election Returns / Clarity Elections.
  - Source URLs: https://www.traviscountytx.gov/clerk/elections and https://results.enr.clarityelections.com/TX/Travis/

- **Crime / Total Crime Index (TCI):**
  - Source: FBI Crime Data Explorer / OpenCrime Austin PD crime report.
  - 2023 Austin Police Department rates (indexed against FBI 2023 National Reference Rates: violent 363.8/100k, property 1,916.7/100k via `scripts/compute-tci.ts`):
    - Violent crime rate: 499.1 per 100,000 -> violent index = 137
    - Property crime rate: 3,305.6 per 100,000 -> property index = 172
    - TCI = round(0.5 * 137 + 0.5 * 172) = 155
    - Derived `CrimeRating`: High (TCI >= 150)
  - 2024 Austin Police Department trend note: violent crime dropped 6.5% in 2024 to 466.9 per 100,000 and property crime fell to 3,241.9 per 100,000, which yields a lower TCI of 149 (Moderate), indicating recent safety improvements. 2023 rates are preserved for direct alignment with FBI 2023 national reference benchmarks.
  - Source URLs: https://cde.ucr.cjis.gov/ and https://www.opencrime.us/is-it-safe/austin

- **Marijuana status:**
  - Medical (Texas Compassionate Use Program allows low-THC cannabis oil for qualifying conditions).
  - Austin voters passed Proposition A in May 2022, effectively decriminalizing misdemeanor marijuana possession (up to 4 ounces) under municipal policy.
  - Stored `Marijuana`: Medical (decriminalized locally).
  - Source: City of Austin & Texas DPS Compassionate Use Program.
  - Source URL: https://www.dps.texas.gov/section/compassionate-use-program

- **LGBTQ friendliness / MEI:**
  - HRC Municipal Equality Index (MEI): Perfect score of 100 for 2023, 2024, and 2025.
  - MAP Texas equality profile overall policy score: -6.75 (reflecting statewide policy landscape).
  - Stored `LGBTQ=100`, `LGBTQ_MEI=100`, `LGBTQStatePolicyScore=-6.75`.
  - Source: Human Rights Campaign MEI 2024/2025 Austin scorecard and Movement Advancement Project.
  - Source URLs: https://www.hrc.org/resources/municipal-equality-index and https://www.lgbtmap.org/equality-maps/profile_state/TX

- **Tech Hub:**
  - Determination: **YES (Y)**
  - Known as "Silicon Hills," Austin is a preeminent global tech hub hosting Apple's 3-million sq ft Americas campus, Dell Technologies (HQ in Round Rock/Austin metro), Tesla global HQ & Gigafactory Texas, Google, Meta, IBM, Oracle, AMD, NXP Semiconductors, and Samsung Austin Semiconductor (plus the nearby $17B+ Taylor foundry).
  - Source: Austin Chamber of Commerce & Opportunity Austin.
  - Source URL: https://www.austinchamber.com/economic-development

- **Defense Hub / defense_hub_manual:**
  - Determination: **YES (Y)**
  - Headquartered in downtown Austin, U.S. Army Futures Command (AFC) is the Army's four-star command leading modernization, next-generation combat vehicles, future vertical lift, and soldier lethality. Austin also hosts the Defense Innovation Unit (DIU) South regional hub at Capital Factory, BAE Systems' Parmer Lane facility, Leidos's Austin office/facility, and defense electronics companies.
  - Live Neon database already reflects `defense_hub: true` for Austin with linked employer location records.
  - Source: U.S. Army Futures Command & Defense Innovation Unit.
  - Source URLs: https://armyfuturescommand.com/ and https://www.diu.mil/

- **Amenity backfill fields (Walmart & Costco):**
  - `HasWalmart=Y`: Multiple Supercenters within Austin city limits, including #1185 (1030 Norwood Park Blvd), #2133 (2525 E 2nd St), #4219 (710 E Ben White Blvd), and #1253 (5017 W Hwy 290).
  - `HasCostco=Y`: Two Costco Wholesale warehouses within Austin city limits: South Austin (#681, 4301 W William Cannon Dr) and North Austin/Arboretum (#641, 10401 Research Blvd).
  - Sources: Official Walmart store locator and Costco warehouse locator.
  - Source URLs: https://www.walmart.com/store/finder and https://www.costco.com/warehouse-locations

- **Weather and climate:**
  - Station: Austin Camp Mabry (GHCND:USW00013958), 1991–2020 NOAA Climate Normals.
  - Annual precipitation: 36.25 inches -> 36 inches.
  - Annual snowfall: 0.8 inches -> 1 inch.
  - Average low winter (January normal low): 41.5°F -> 42°F.
  - Average high summer (August normal high): 97.0°F -> 97°F (July normal high is 95.6°F).
  - Summer humidity: 65% (average July relative humidity from Current Results and NOAA hourly observations).
  - Sunny days: 228 days (BestPlaces Austin climate; Current Results records 115 clear days + 114 partly sunny days = 229 days with sun).
  - Climate classification: Humid subtropical (Köppen `Cfa`).
  - Source: NOAA National Centers for Environmental Information (NCEI) 1991-2020 U.S. Climate Normals.
  - Source URL: https://www.ncei.noaa.gov/access/us-climate-normals/

- **Gas price:**
  - Current regular gasoline price: $3.70 per gallon for the Austin-San Marcos metro area (checked 2026-09-02; Texas state average $3.68).
  - Source: AAA Texas Gas Prices.
  - Source URL: https://gasprices.aaa.com/?state=TX

- **Tags:**
  - `["Arts", "Culture", "Healthcare", "Hiking", "Golf", "Low Taxes", "Military"]`
  - Sourced amenities: Long Center, Blanton Museum, Paramount Theatre (Arts); "Live Music Capital of the World", SXSW, ACL, Capitol complex (Culture); Dell Seton Medical Center, Ascension, St. David's, Austin VA Clinic (Healthcare); Barton Creek Greenbelt, Lady Bird Lake Butler Trail, River Place, Mount Bonnell (Hiking); Lions Municipal, Roy Kizer, Morris Williams, Omni Barton Creek (Golf); Texas zero state income tax (Low Taxes); Army Futures Command HQ, Camp Mabry, active veteran community (Military).

- **Description:**
  - "Texas state capital and tech hub in the Hill Country known for vibrant live music, world-class healthcare networks (Dell Seton, Ascension, St. David's), and extensive parkland around Lady Bird Lake. Veterans benefit from zero state income tax, local VA outpatient clinic care, and regional headquarters proximity to Army Futures Command. Tradeoffs include hot humid summers, elevated home prices relative to Texas, high property taxes, and traffic congestion."
