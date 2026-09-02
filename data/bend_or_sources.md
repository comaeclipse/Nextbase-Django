# Bend, OR Source Notes

Retrieval date: 2026-07-28.

## Geography and source choices

- Primary geography: incorporated City of Bend, Deschutes County, Oregon.
- Population is city-level from Census QuickFacts. Density is calculated from the Census 2025 population estimate divided by 2024 Census Gazetteer land area for Bend's incorporated place.
- Presidential election fields are county-level because a reviewed city-boundary precinct crosswalk was not prepared during this ingest; `city_politics` is therefore explicitly marked county-level.
- NOAA weather uses Bend station `USC00350694` for precipitation, snowfall, January low, and July high because it reports the local snowfall normal. Sun days and July humidity are left blank because the cited NOAA normals do not provide comparable values for those fields.

## Imported values and method

- Population and density: Census QuickFacts lists a July 1, 2025 population estimate of 107,342. Using the 2024 Gazetteer land area of about 34.8 square miles gives roughly 3,084 people per square mile.
- Housing: Zillow's Bend ZHVI page reported a typical home value of $737,350 with data through 2026-06-30. The model field is named `avg_home_value`, but this is a Zillow Home Value Index, not an average or median.
- Cost and taxes: AreaVibes reports Bend's cost-of-living index as 134 on a U.S. baseline of 100. Oregon has no statewide or local general sales tax, so sales tax is stored as 0. Oregon's top individual income-tax rate is stored as 9.9 percent.
- VA and veterans benefits: VA Portland Health Care lists the Robert D. Maxwell VA Clinic in Bend at 2650 NE Courtney Drive, so the row uses local VA access and zero miles. Oregon veteran benefits are summarized from state/federal veteran-benefit pages; they are a short product summary, not eligibility advice.
- Elections: County-level presidential results are used. The 2016 Deschutes County result was Trump 45,692 and Clinton 42,444; two-party Republican share was 51.85 percent, rounded to 52. The 2024 Deschutes County result was Harris 68,108 and Trump 54,850; two-party Democratic share was 55.39 percent, rounded to 55. Republican two-party share moved from 51.85 percent in 2016 to 44.61 percent in 2024, so `rep_vote_share_change_pp = -7.2`, `dem_vote_share_change_pp = 7.2`, and `election_change = 7.2 pp more Democratic since 2016`.
- Crime: AreaVibes reports 179 violent crimes and a violent crime rate of 168 per 100,000 residents. Dividing by the FBI 2024 national violent-crime rate of 359.1 per 100,000 yields 46.8, rounded to TCI 47. The `Low` label follows the existing app convention where lower TCI is safer. Limitation: this is an FBI-derived third-party presentation rather than a locally maintained normalized index.
- Cannabis: Oregon adult-use cannabis is treated as recreational.
- LGBTQ: HRC's 2025 Bend Municipal Equality Index final score is 91. MAP's Oregon Equality Profile gives Oregon an overall policy score of 39.5 out of 49 with a High rating. Both are stored because the app keeps municipal and state policy signals separately.
- Climate: NOAA 1991-2020 normals for Bend station `USC00350694` give annual precipitation 10.62 inches, annual snowfall 21.60 inches, January average low 24.6 F, and July average high 83.8 F, stored as 11, 22, 25, and 84. The repository climate-category rule classifies Bend as `cold_snowy` because winter low is <=25 F and annual snow is >=15 inches.
- Gas: AAA's Oregon regular-gas average was $4.6400 as of 2026-07-28, stored as $4.64. This field is volatile.
- Economy and lifestyle: The City of Bend and EDCO describe technology, outdoor products, bioscience/life sciences, entrepreneurship, tourism, and related clusters in Central Oregon, so `TechHub` is stored as `Y`. No matching defense-employer rows existed in the live database and no strong Bend-specific defense hub evidence was found, so `DefenseHub` is left blank/null rather than asserted false.
- Geography/vibes: Bend is tagged `mountain_living`, `lake_living`, and `great_outdoors` because it has Cascade access, the Deschutes River, nearby Cascade Lakes/Tumalo Falls/Smith Rock recreation, and official tourism materials emphasize outdoor recreation. It is marked near mountains and near lake under the project's approximate lifestyle-signal standards; it is not marked near ocean.

## Source URLs

- Census QuickFacts, Bend city: https://www.census.gov/quickfacts/fact/table/bendcityoregon/AGE295225
- Census 2024 Gazetteer places: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
- Zillow Home Value Index, Bend: https://www.zillow.com/home-values/50962/bend-or/
- AreaVibes cost of living: https://www.areavibes.com/bend-or/cost-of-living/
- Oregon Department of Revenue personal income tax: https://www.oregon.gov/dor/programs/individuals/pages/pit.aspx
- AARP Oregon tax guide: https://www.aarp.org/states/oregon/state-tax-guide/
- Robert D. Maxwell VA Clinic: https://www.va.gov/portland-health-care/locations/robert-d-maxwell-department-of-veterans-affairs-clinic/
- VA facility page: https://www.va.gov/find-locations/facility/vha_648GA
- Oregon Department of Veterans' Affairs benefits: https://www.oregon.gov/odva/benefits/pages/default.aspx
- Deschutes County 2024 election results: https://webapps.deschutes.org/Elections/Home/Results/100
- Oregon Secretary of State election history/open data: https://sos.oregon.gov/elections/pages/historical-data.aspx
- 2016 Oregon presidential county table cross-check: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Oregon
- 2024 Oregon presidential county table cross-check: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Oregon
- AreaVibes crime: https://www.areavibes.com/bend-or/crime/
- FBI 2024 UCR summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Oregon Liquor and Cannabis Commission cannabis FAQ: https://www.oregon.gov/olcc/marijuana/pages/frequently-asked-questions.aspx
- HRC 2025 Bend MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Bend-Oregon.pdf
- MAP Oregon Equality Profile: https://mapresearch.org/equality-profiles/or/
- NOAA 1991-2020 annual/seasonal normals, USC00350694: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USC00350694&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USC00350694: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USC00350694&format=json&units=standard&includeAttributes=false
- AAA Oregon gas prices: https://gasprices.aaa.com/?state=OR
- City of Bend target economic sectors: https://bendoregon.gov/departments/community-development/growth-management/target-economic-sectors/
- Central Oregon Innovation Hub: https://www.edcoinfo.com/central-oregon-innovation-hub
- Visit Bend: https://visitbend.com/
- Travel Oregon, Bend: https://traveloregon.com/places-to-go/cities/bend/
- City of Bend winter tips: https://bendoregon.gov/resources/guides/winter-tips/

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **NULL (left unset — insufficient evidence either way)**

A small defense-adjacent firm (Cv International) was found to have relocated to Prineville, OR (not Bend) in late 2025. No other qualifying installation or contractor presence found in Bend. Left NULL.

Sources:
- Local business/relocation coverage of Cv International's move to Prineville, OR, late 2025 (secondary source, not defense-specific to Bend).

## defense_hub_manual revision (issue #20, retrieved 2026-08-19)

Determination: **NULL (revised research, still left unset)**. Central Oregon's official aviation-sector material centers on civilian aircraft manufacturing, avionics, and flight training (Epic Aircraft, CiES, Electronics International, Leading Edge Aviation) — not a defense cluster. Bend-based Blue Moon Designs does have genuine, continuing DoD business: an approximately $1.05M 2021 DoD contract for helicopter ground-support equipment and an approximately $181K 2024 order for an upgraded helicopter ladder. That is real defense contracting but on too small a scale to establish Bend as a defense-industrial hub — not strong enough to promote to TRUE, but also not absent enough to justify a hard FALSE veto. Left NULL.

No DB write was made for this revision; `defense_hub_manual` remains NULL, matching the 2026-08-11 determination above.

Sources:
- Economic Development for Central Oregon (aviation sector) — https://www.edcoinfo.com/industry/aviation
- USAspending.gov, Blue Moon Designs 2021 award — https://www.usaspending.gov/award/CONT_AWD_N6833521C0628_9700_-NONE-_-NONE-/

## defense_hub_manual revision (issue #55, retrieved 2026-09-02)

Determination: **TRUE** (borderline; anchor is in Redmond, same MSA). No installation exists in Deschutes County (Oregon's list: Portland 142 FW, Klamath Falls 173 FW, Salem JFHQ), and EDCO's 2026 major-employer list has no prime in Bend proper — Epic Aircraft (544) is civil, and Cv International (50–60 employees, F-35/B-1/F-16 maintenance stands) moved from Bend to Prineville in 2025. The anchor is **PCC Schlosser** (Precision Castparts / PCC Structurals), 345 NE Hemlock Ave, Redmond, OR, ~17 mi from Bend inside the Bend-Redmond MSA: 352 employees per EDCO, casting fracture-critical airframe, aero-engine and **missile** components. It is a Tier-2 supplier rather than a named prime, which is why the research pass scored it under the bar; it is promoted here for consistency with Grand Junction, CO (promoted 2026-08-19 on an aerospace supplier cluster with Lockheed supply-chain participation) and Warren, PA (a forge with a defense-business function). If the house bar is later tightened to primes-only, this is the row to veto with `defense_hub_manual = false`.

To apply (after merge, from `master`; no Neon write has been made for this revision as of 2026-09-02): `scripts/apply-location-patches.ts --patch data/sources/defense/location_defense_hub_manual_backfill_2026-09-02.json`, then `scripts/recompute-defense-hub.ts`. `defense_hub` itself is derived, never written directly.

Sources:
- DoD MilitaryINSTALLATIONS, Oregon — https://installations.militaryonesource.mil/state/OR/state-installations
- EDCO major employers (Central Oregon) — https://www.edcoinfo.com/about-the-area/major-employers
- PCC Structurals, PCC Schlosser (Redmond, OR) — https://www.pccstructurals.com/locations/pcc-schlosser.html
- Central Oregonian, Cv International move to Prineville (2025) — https://centraloregonian.com/2025/10/07/defense-contractor-moves-operations-from-bend-to-prineville/
