# Ashville, OH source notes

Retrieved: 2026-08-06.

## Identity and geography

- Geography: Ashville village, Pickaway County, Ohio (Census place GEOID `3902680`). Census Reporter reports 4,648 people in the ACS 2024 5-year release. The Census 2024 Gazetteer gives 2.385 square miles of land area and internal point 39.724340, -82.957472; density is 4,648 / 2.385 = 1,949 people per square mile, rounded.

## Housing, cost, and taxes

- Housing: Zillow's June 30, 2026 Ashville ZHVI / typical home value is $367,139. It is stored in the legacy `avg_home_value` field but is not a median sale price.
- Cost of living: AreaVibes describes Ashville as equal to the Ohio average. The row stores an index of 100 as a directional, secondary-source proxy; the importer derives the product label `Moderate`.
- Pickaway County's combined sales/use-tax rate is 7.25%. Ohio's 2026 individual income-tax rate above the statutory threshold is 2.75%.

## Veterans access and benefits

- The nearest recorded VA outpatient facility is Grove City VA Clinic, 18 miles away; this replaces the prior Chalmers P. Wylie approximation in the location row. The nearest recorded VA hospital is Chillicothe VA Medical Center, 31 miles away. The hospital relationship is retained as a separate profile signal so the row's nearest-clinic field is not overloaded. Ohio military retirement and Survivor Benefit Plan income are exempt from state income tax. Disabled veterans may qualify for Ohio's enhanced homestead exemption.

## Politics and social policy

- Current compact convention: `state_party=R` and `governor=R` for Ohio Governor Mike DeWine.
- The 2024 political field is a precinct aggregation, not a county proxy. Pickaway County's official precinct report lists Ashville-East as Harris 152 / Trump 402, Ashville-North as Harris 265 / Trump 790, and Ashville-West as Harris 145 / Trump 506. Combined, Trump received 1,698 of 2,260 two-party votes (75.13%), stored as 75 and labeled `Precinct-level: Strongly Conservative`. **2016 trend now filled (2026-08-09), at county level rather than precinct** (a comparably verified 2016 Ashville-precinct file was not found; Pickaway County's official 2016 result was used instead — Clinton 6,529 / Trump 17,076, D 27.66% / R 72.34% two-party, stored as `election_2016_percent = 72`). Note the 2024 value above is precinct-level (75) while 2016 is county-level (72); the stored `rep_vote_share_change_pp = +2.16` / `dem_vote_share_change_pp = -2.16` / `election_change = "2.2 pp more Republican since 2016"` therefore mixes geographies across the two years — flagged here rather than silently presented as a clean same-geography trend. Source: Pickaway County Board of Elections 2016 results, https://www.boe.ohio.gov/pickaway/c/elecres/historical/20161108General.pdf
- Ohio permits adult-use cannabis; the row stores `Recreational`. MAP's current Ohio Equality Profile policy-table overall tally is 8.25/49. There is no separate Ashville HRC Municipal Equality Index score in this import.

## Climate

- Ashville is represented by the nearby Columbus-Rickenbacker / Valley Crossing normals described in the Rickenbacker International Airport master-plan update: 40.11 inches annual precipitation, 21.0 inches annual snowfall, 18.6 F January normal low, and 86.3 F July normal high. Product values are rounded to 40 inches rain, 21 inches snow, 19 F winter low, and 86 F summer high. This supports the narrowly scoped `cold_snowy` category. Compatible annual sun-day and summer-humidity measurements were not found, so those fields remain blank.

## Anduril employer location and derived defense hub

- Anduril is added as a distinct defense employer, with a sourced Ashville facility row rather than treating nearby Columbus as Ashville. The public Greenhouse job-board API snapshot on 2026-08-06 returned 106 openings whose location text included Ashville, Ohio. Of those, 100 list only Ashville and are conservatively stored as `onsite_posting_count=100`; six multi-location postings are retained in `total_posting_count` but are not counted onsite. This clears the product's physical-presence threshold of one onsite/hybrid opening.
- JobsOhio reports the first Ohio-built Fury rolled off Anduril's Arsenal-1 production line in July 2026. Therefore the evidence is a confirmed physical defense-manufacturing facility, not merely an address attached to remote work. `DefenseHub` is intentionally blank in the city CSV so `defense_hub_manual` remains null; the derived field is set only by the employer link plus `scripts/recompute-defense-hub.ts`.

## Intentionally unfilled fields

- 2016 election, partisan-trend deltas, TCI/crime, gas price, annual sunny days, summer humidity, municipal MEI, and TechHub are blank because this scoped retrieval did not produce comparably sourced values. Blank means unknown or not reviewed, not false.

## Source URLs

- Census Reporter Ashville profile: https://censusreporter.org/profiles/16000US3902680-ashville-oh/
- Census 2024 Gazetteer files: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
- Zillow Ashville ZHVI: https://www.zillow.com/home-values/10192/ashville-oh/
- AreaVibes Ashville cost of living: https://www.areavibes.com/ashville-oh/cost-of-living/
- Ohio Department of Taxation county sales-tax rate table: https://thefinder.tax.ohio.gov/streamlinesalestaxweb/Download/BoundaryData/CountySalesTaxRateReport.pdf
- Ohio Revised Code 5747 income-tax rate: https://codes.ohio.gov/ohio-revised-code/chapter-5747
- Ohio Department of Veterans Services benefits guide: https://dam.assets.ohio.gov/image/upload/dvs.ohio.gov/benefits/benefitsguide-1224edit.pdf
- Ohio National Guard military-retirement tax exemption reference: https://ong.ohio.gov/members/oharng/transition-assistance/resources/basic-benefits.pdf
- Grove City VA Clinic: https://www.va.gov/central-ohio-health-care/locations/grove-city-va-clinic/
- Chillicothe VA Medical Center: https://www.va.gov/chillicothe-health-care/locations/chillicothe-va-medical-center/
- Pickaway County official 2024 precinct results: https://www.boe.ohio.gov/pickaway/c/elecres/20241105precinct.pdf
- Ohio Secretary of State 2024 certification: https://www.ohiosos.gov/office/media-center/categories/press-releases/2024-12-02
- MAP Ohio Equality Profile: https://mapresearch.org/equality-profiles/OH/
- Ohio adult-use cannabis program: https://com.ohio.gov/divisions-and-programs/cannabis-control
- Rickenbacker International Airport master-plan update: https://flycolumbus.com/wp-content/uploads/2023/11/20210702140936-lck-2021-final-master-plan.pdf
- Anduril Greenhouse board API: https://boards-api.greenhouse.io/v1/boards/andurilindustries/jobs
- Anduril Ashville job example: https://job-boards.greenhouse.io/andurilindustries/jobs/5116808007
- JobsOhio Arsenal-1 production announcement: https://www.jobsohio.com/newsroom/news-press/first-ohio-built-fury-rolls-off-andurils-arsenal-1-production-line

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **TRUE**

Anduril Industries' "Arsenal-1" mega-factory near Ashville is reported as the largest single job-creation investment in Ohio history, with Fury drone production live since March 2026 and a target of 4,000 jobs — an unambiguous, large-scale defense-manufacturing hub, well beyond the tracked 100 onsite Anduril postings alone.

Sources:
- Ohio Tech News, Arsenal-1 coverage — https://ohiotechnews.com/
- NBC4 Columbus (nbc4i.com), construction-start coverage — https://www.nbc4i.com/
- ABC6 Columbus (abc6onyourside.com), Fury production coverage — https://abc6onyourside.com/
