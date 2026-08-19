# North Platte, Nebraska — curated source notes

Retrieved 2026-08-06. The import represents **North Platte city** in Lincoln County, not the North Platte micropolitan area. `North Platte, NE | Lincoln | Census place 3135000 | county FIPS 31111 | 41.12496, -100.750359` is the reviewed geographic crosswalk; the coordinates are the Census 2024 Gazetteer internal point already held by the repository pace/map source bundle.

## Stored facts and calculations

- **Population and density:** Census QuickFacts reports a July 1, 2025 city estimate of 22,524 people and 2020 density of 1,729.9 per square mile. The CSV stores `22,524` and 1,730.
- **Housing:** Zillow's city ZHVI download reports a June 30, 2026 value of $220,375.64 for North Platte; it is stored as `$220,376`. This is Zillow's *typical home value index*, not an average or median sale price.
- **Taxes and veterans:** North Platte's combined sales tax is stored as 7.00%. The 2026 Nebraska top individual income-tax rate is stored as 4.55%. Nebraska Department of Veterans' Affairs documents the full state income-tax exclusion for military retirement pay and qualifying veteran property-tax relief; eligibility is deliberately not simplified into a universal claim.
- **VA:** VA Nebraska–Western Iowa lists the North Platte VA Clinic, 300 E. 3rd St., Suite 302, in North Platte. The row therefore uses in-city access and `0 miles`; it does not equate a community-based outpatient clinic with a VA medical center.
- **Climate:** NOAA 1991–2020 monthly normals for North Platte Regional Airport (`USW00024023`) sum to 21.1 inches annual precipitation and 29.6 inches annual snowfall; January normal low is 11.9 F and July normal high is 89.7 F. The CSV rounds these to 21, 30, 12, and 90. `sun_days` and summer humidity are intentionally blank because the NOAA normals endpoint used does not provide a compatible annual sunshine-days or summer-relative-humidity measure. The repository rule yields `cold_snowy` because snowfall rounds to 30 inches; the display label remains `Cold semi-arid` to retain the dry-Plains context.
- **Politics:** Lincoln County official 2016 results were Trump 12,164 and Clinton 2,913; official 2024 results were Trump 12,674 and Harris 3,586. Two-party Republican share moved from 80.66% to 77.94%, so the import stores -2.7 Republican percentage points / +2.7 Democratic percentage points and labels the county-level result `Strongly Conservative`. This is not precinct- or city-boundary election data.
- **Supplemental affordability, safety, fuel, and comfort fields:** City-Data reports a December 2024 cost-of-living index of 76.5 (U.S. = 100), stored as 77 and therefore `Low`. Its 2024 table reports 33 violent offenses (148.2 per 100,000): 0 murders, 11 rapes, 0 robberies, and 22 aggravated assaults; it also reports 579 property offenses, mostly 518 larceny/thefts. The app's `TCI` does **not** copy City-Data's proprietary weighted index (172.8): it is calculated as 148.2 / 359.1 (the FBI 2024 U.S. violent-crime rate) * 100 = 41.3, rounded to 41 (`Low`). This keeps the cross-city field on the repository's documented open method while preserving the source's property-crime context here. BestPlaces reports 227 sunny days per year, but defines that count differently from cloudless days. Nebraska Department of Water, Energy, and Environment's July 31, 2026 weekly report lists North Platte regular gasoline at $4.07/gallon (Nebraska $3.96); it is stored as a dated, volatile point-in-time value. A Nebraska environmental document's 1996 North Platte table shows June 65%, July 64%, and August 65% average relative humidity; the CSV uses the rounded three-month mean, 65%. This older humidity series is a proxy and is not presented as a current climate normal.
- **Cannabis:** Nebraska's current statute protects qualifying patient/caregiver medical cannabis use and establishes the Medical Cannabis Commission. The row says `Medical`, not recreational.
- **Lifestyle facets:** `quiet_retreat`, `lake_living`, and `great_outdoors` are added to `data/city-vibes.json`; `near_lake` is added to `data/geography-proximity.json`, based on Lake Maloney and state recreation access. These are broad discovery facets, not neighborhood-level guarantees or a pace override. The pace classifier remains the authoritative source for `small_town` / other settlement type.

## Narrative and user-supplied context

The provided Reddit synthesis is useful qualitative relocation context, but it is not a representative survey or a safety dataset. It informed the bounded description's trade-off language and the `quiet_retreat` facet only alongside official recreation/arts evidence. Its discussion of a Canteen District upswing, traditional working railroad culture, limited entertainment/job breadth, isolation, neighborhood variability, and drug/property-crime concerns is retained here as **anecdotal perception**, not imported into `TCI`, `CrimeRating`, or factual tags. The Nebraska Arts Council identifies the North Platte Canteen District as a certified creative district; Nebraska Game and Parks documents Buffalo Bill State Recreation Area's camping/hiking and North Platte River access.

## Deliberate gaps

- `LGBTQ`, HRC MEI, and MAP policy-score fields are blank. A current North Platte municipal scorecard and a directly verified current state-policy score were not obtained.
- `DefenseHub` remains null, and `TechHub` is `N`. Railroad importance alone does not establish either flag; no matching active RTX facility or city-level technology-hub evidence was found.
- The 2024 cost index, 2024 crime counts, and 227-sunny-day estimate are third-party products. The city crime count/rate is usable as a documented proxy, but its proprietary weighted index is not imported. Gas prices are volatile. The 1996 humidity table is historic and may not represent the 1991-2020 normals period or current conditions.

## Source URLs

- Census QuickFacts: https://www.census.gov/quickfacts/fact/table/northplattecitynebraska/PST045224
- City-Data North Platte profile and 2024 crime/cost table: https://www.city-data.com/city/North-Platte-Nebraska.html
- FBI 2024 national violent-crime rate: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- BestPlaces climate table: https://www.bestplaces.net/climate/city/nebraska/north_platte
- Nebraska Department of Water, Energy, and Environment weekly gasoline report, 2026-07-31: https://dwee.nebraska.gov/sites/default/files/publications/125%20Gasoline_21.pdf
- Nebraska relative-humidity table (1996 values, historic proxy): https://dwee.nebraska.gov/sites/default/files/publications/H2strs.pdf
- Zillow city ZHVI download: https://files.zillowstatic.com/research/public_csvs/zhvi/City_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv
- Nebraska Department of Veterans' Affairs, taxes: https://veterans.nebraska.gov/taxes
- Nebraska Department of Revenue, local sales/use tax rates: https://revenue.nebraska.gov/businesses/sales-and-use-tax-rates
- Tax Foundation, 2026 state income-tax rates: https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/
- North Platte VA Clinic / VA Nebraska-Western Iowa locations: https://www.va.gov/nebraska-western-iowa-health-care/locations/
- NOAA NCEI 1991–2020 normals endpoint: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00024023&format=json
- Lincoln County official 2016 results: https://lincolncountyne.gov/2016-general-election-results1/
- Lincoln County 2024 general-election results: https://lincolncountyne.gov/2024-general-election-results/
- Nebraska medical cannabis patient protection statute: https://nebraskalegislature.gov/laws/statutes.php?statute=71-24%2C105
- Nebraska Arts Council, North Platte Canteen District: https://www.artscouncil.nebraska.gov/explore/certified-creative-districts/the-north-platte-canteen-district/
- Nebraska Game and Parks, Buffalo Bill State Recreation Area: https://outdoornebraska.gov/location/buffalo-bill/
- User-provided Reddit synthesis attachment, accessed 2026-08-06: `C:\Users\skarz\.codex\attachments\c5de53a3-fcf3-4db4-b0c4-7f1c26851eef\pasted-text.txt`

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **NULL (left unset — insufficient evidence either way)**

Only a small National Guard armory was found. Nebraska's real ANG wing is in Lincoln and Offutt AFB is near Omaha — neither near North Platte. Left NULL, not vetoed, since the armory is a minor but real presence.

Sources:
- Nebraska National Guard, armory locations — https://www.nebraska.ng.mil/

## defense_hub_manual revision (issue #20, retrieved 2026-08-19)

Determination: **TRUE**. North Platte hosts two distinct current military facilities rather than incidental contracting. The Nebraska National Guard's official facility directory lists the North Platte Readiness Center at 1700 N. Jeffers. The U.S. Army Reserve separately lists the 1013th Quartermaster Field Service Company, Detachment 1 at the North Platte U.S. Army Reserve Center. Two distinct current Army National Guard and Army Reserve facilities in a city of roughly 23,000 people is affirmative physical military presence sufficient to promote.

This revises and supersedes the 2026-08-11 NULL determination above. `defense_hub_manual` was set to `true` in Neon on 2026-08-19; `defense_hub` itself is derived by `scripts/recompute-defense-hub.ts`, not written directly.

Sources:
- Nebraska National Guard, contact/facility directory — https://ne.ng.mil/About-Us/Contact-Us/
- U.S. Army Reserve, North Platte USARC / 1013th QM Field Service Co Det 1 (cite as found in Army Reserve unit locator)
