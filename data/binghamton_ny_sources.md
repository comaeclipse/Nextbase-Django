# Binghamton, NY - Source Notes

## Geography & Demographics
- **Population**: 47,969
- **Density**: ~4,321 per sq mi
- **Source**: 2020 U.S. Census for City of Binghamton. [Census QuickFacts](https://www.census.gov/quickfacts/binghamtoncitynewyork) (Retrieved 2026-07-23)

## Housing & Cost of Living
- **Avg Home Value**: $193,778
- **Source**: Zillow Home Value Index (ZHVI), June 2026. [Zillow Binghamton](https://www.zillow.com/home-values/35532/binghamton-ny/) (Retrieved 2026-07-23)
- **CostOfLiving**: 85 (Index)
- **Source**: RentCafe 2025-2026 cost of living index (Overall index: 15% lower than national average). [RentCafe Binghamton Cost of Living](https://www.rentcafe.com/cost-of-living/us/ny/binghamton/) (Retrieved 2026-07-23)

## Climate & Weather
- **Normals**: NOAA NCEI U.S. Climate Normals (1991-2020) for Binghamton station.
- **Data**: ~50 inches snow, ~40 inches rain, ~160 sunny days, 18F average low winter, 80F average high summer, ~73% summer humidity. [NOAA NCEI Quick Access](https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals) (Retrieved 2026-07-23)

## Politics (County-Level Fallback)
- **Note**: Exact city/precinct-level data for Binghamton was not readily available, so falling back to Broome County results with the qualifier `County-level: Mixed / Swing`.
- **2016 Election (Broome County)**: Trump 51.1% / Clinton 48.9% (Strict Two-Party Share).
- **2024 Election (Broome County)**: Harris 50.2% / Trump 49.8% (Strict Two-Party Share).
- **Trend**: 1.3 pp more Democratic since 2016.
- **Source**: Broome County Board of Elections / NY State Board of Elections. [NY 2024 Official Results](https://results.elections.ny.gov/contest/5591) and [Broome 2024 Results](https://app.enhancedvoting.com/results/public/broome-county-ny/elections/GE24) (Retrieved 2026-07-23)

## Safety & Policy
- **TCI & Crime**: TCI estimated at 101. Derived from FBI CDE violent crime rate (approx 383 per 100k). Formula used: (383 / 380 U.S. average) * 100 = 100.7 (rounded to 101). [FBI Crime Data Explorer](https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/city-crime) (Retrieved 2026-07-23)
- **LGBTQ**: HRC MEI Score is not published for Binghamton in 2025, so fields are left blank.
- **State Policy Score**: MAP New York profile overall policy score is exactly 44.5/49 (recorded as 45 in CSV). [MAP New York](https://mapresearch.org/equality-profiles/ny/) (Retrieved 2026-07-23)

## Veterans Affairs
- **VA Center**: Binghamton VA Clinic (outpatient). [VA Binghamton Clinic](https://www.va.gov/syracuse-health-care/locations/binghamton-va-clinic/) (Retrieved 2026-07-23). The "0 miles" distance recorded in the data is used as an "in-city VA facility" convention rather than a measured route distance.
- **Benefits**: New York exempts military retirement pay from state income taxes and offers property tax exemptions for veterans. [NY State Veterans Benefits](https://veterans.ny.gov/property-tax-exemptions) (Retrieved 2026-07-23)

## Economic Hubs
- **Defense Hub**: Kept blank (null) in the source data. This indicates that a hub status is "not established from available defense-employer evidence." The automated `recompute-defense-hub.ts` script will calculate its true status based on the local Collins Aerospace onsite postings (8 jobs).

## Taxes & Utilities
- **Sales Tax**: 8.00%. [SalesTaxHandbook Binghamton](https://www.salestaxhandbook.com/new-york/rates/binghamton) (Retrieved 2026-07-23)
- **Income Tax**: 10.90% (Top NY state marginal rate for highest earners). [SmartAsset NY Taxes](https://smartasset.com/taxes/new-york-tax-calculator) (Retrieved 2026-07-23)
- **Gas Price**: $4.20. [AAA New York gas prices](https://gasprices.aaa.com/?state=NY) (Retrieved 2026-07-23)

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **NULL (left unset — insufficient evidence either way)**

Genuine mixed evidence, left NULL. The Collins Aerospace site in Binghamton has a roughly 90-year defense-industry pedigree (birthplace of the Link Trainer flight simulator), but no confirmed current headcount was found, and the tracked presence itself is modest (8 onsite postings). Not enough to confidently call TRUE or FALSE — do not force a determination.

Sources:
- Wikipedia, "Link Trainer" / Binghamton aviation history — https://en.wikipedia.org/wiki/Link_Trainer
- Collins Aerospace / RTX careers site (site listing only, no headcount disclosed) — https://careers.rtx.com/

## defense_hub_manual revision (issue #20, retrieved 2026-08-19)

This revises, but does not delete, the 2026-08-11 determination above. The original NULL
call was reasonable given only the Collins-postings evidence available at the time; new
targeted research since then found substantially more evidence.

Determination: TRUE. Current evidence establishes Greater Binghamton/Broome County as a substantive defense/aerospace employment cluster. Collins Aerospace maintains an active Binghamton training-and-simulation facility. BAE Systems employs more than 1,300 people at its Endicott campus in the Greater Binghamton metro, where employees develop systems for commercial and military air and land applications; BAE opened a 150,000-square-foot expansion there in 2026. NYSDOL analysis of USASpending data found $231.5 million in DoD prime contracts awarded in Broome County during FY2020–FY2023, with six of the Southern Tier's ten largest defense vendors located in the county.

Sources:
- RTX / Collins Aerospace, "Who We Are — North America — United States" (active Binghamton, NY location doing training and simulation development, spanning Government and Commercial Systems) — https://www.rtx.com/collinsaerospace/who-we-are/about-us/global/north-america/united-states
- New York State Department of Labor, USASpending DoD contract analysis (Broome County: $231.5M in DoD prime-contract spending FY2020–FY2023; six of the Southern Tier's ten largest defense vendors, including BAE Systems, Innovation Associates, Apex Pinnacle, Aptim Federal Services, Airborne Supply, BSC Partners) — https://content.govdelivery.com/accounts/NYDOL/bulletins/381088a
- BAE Systems, "BAE Systems significantly expands Endicott operations to support aircraft electrification" (1,300+ employees at Endicott campus, commercial and military air/land applications) — https://www.baesystems.com/en/article/bae-systems-significantly-expands-endicott-operations-to-support-aircraft-electrification
- BAE Systems, "New building dedicated to aircraft and ground vehicle electrification opens in Endicott" (May 2026, 150,000-sq-ft expansion) — https://www.baesystems.com/en-us/article/new-building-dedicated-to-aircraft-and-ground-vehicle-electrification-opens-in-endicott
- Empire State Development, "Governor Hochul and Senator Schumer Announce $65 Million Expansion, BAE Systems" ($65M investment, up to 134 additional jobs) — https://esd.ny.gov/esd-media-center/press-releases/governor-hochul-and-senator-schumer-announce-65-million-expansion-bae-systems
