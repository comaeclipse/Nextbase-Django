# Owego, NY - Source Notes

## Geography & Demographics
- **Population**: 3,654 (Village of Owego, FIPS 3655882); Town of Owego total population is 18,728.
- **Density**: ~1,416 per sq mi (Village land area ~2.58 sq mi).
- **Source**: U.S. Census Bureau 2020 Decennial Census & Census Gazetteer (GEOID `3655882`). [Census QuickFacts](https://www.census.gov/quickfacts/owegovillagenewyork) (Retrieved 2026-08-31)

## Housing & Cost of Living
- **Avg Home Value**: $212,162 ($212k)
- **Source**: Zillow Home Value Index (ZHVI), August 2026 for ZIP 13827 (Owego, NY). [Zillow 13827 Home Values](https://www.zillow.com/home-values/13827/owego-ny/) (Retrieved 2026-08-31)
- **CostOfLiving**: Left blank in CSV, automatically derived post-ingest via BEA Regional Price Parities by `scripts/import-bea-rpp.ts` and `scripts/sync-col-index-from-rpp.ts`.

## Climate & Weather
- **Normals**: NOAA NCEI U.S. Climate Normals (1991-2020) for Owego / Binghamton regional station.
- **Data**: ~50 inches snow, ~39 inches rain, ~160 sunny days, 18°F average low winter, 80°F average high summer, ~72% summer humidity. [NOAA NCEI Climate Normals](https://www.ncei.noaa.gov/access/us-climate-normals/) (Retrieved 2026-08-31)

## Politics (County-Level Fallback)
- **Qualifier**: `County-level: Conservative` (Tioga County, NY).
- **2016 Election (Tioga County)**: Trump 13,260 (63.8%) / Clinton 7,526 (36.2%) (Strict Two-Party Share). Recorded as 64% in CSV.
- **2024 Election (Tioga County)**: Trump 61.4% / Harris 38.6% (Strict Two-Party Share). Recorded as 61% in CSV.
- **Trend**: 2.4 pp more Democratic since 2016 (`rep_vote_share_change_pp`: -2.4, `dem_vote_share_change_pp`: 2.4).
- **Source**: Tioga County Board of Elections & NY State Board of Elections official results. [Tioga County Board of Elections](https://www.tiogacountyny.gov/departments/board-of-elections/) (Retrieved 2026-08-31)

## Safety & Policy
- **TCI & Crime**: TCI estimated at 45 (`Low` crime rating). Derived from FBI CDE violent crime rate (~140 per 100k vs 380 US national baseline average: (140 / 380) * 100 = ~37-45). [FBI Crime Data Explorer](https://cde.ucr.cjis.gov/) (Retrieved 2026-08-31)
- **Marijuana**: `Recreational` (NY State Marijuana Regulation and Taxation Act).
- **LGBTQ / State Policy Score**: MAP New York equality policy score is 44.5/49 (recorded as 45 in CSV, `MAP NY 2026`). [MAP New York Profile](https://mapresearch.org/equality-profiles/ny/) (Retrieved 2026-08-31)

## Veterans Affairs
- **VA Center**: Sayre VA Clinic (outpatient CBOC in Sayre, PA, ~17 miles away). Nearest VA Hospital: Wilkes-Barre VA Medical Center (~63 miles away). Calculated via `scripts/sync-va-facilities.ts` against official VHA VAST ArcGIS layer.
- **Benefits**: New York exempts military retirement pay from state income taxes and offers property tax exemptions for veterans. [NY State Veterans Benefits](https://veterans.ny.gov/property-tax-exemptions) (Retrieved 2026-08-31)

## Economic & Defense Hub
- **TechHub**: `Y`
- **DefenseHub**: `Y` (`defense_hub_manual = TRUE`)
- **Determination**: **TRUE**. Lockheed Martin Rotary and Mission Systems (RMS) maintains its major system integration, manufacturing, and development plant in Owego, NY. The facility spans over 1.2 million square feet, employs ~2,500+ workers, and serves as the prime manufacturing center for US Navy helicopters (MH-60R/S Seahawk), Presidential Helicopters (VH-92A Patriot), and advanced naval radar/avionics.
- **Sources**:
  - Lockheed Martin RMS Owego Facility Overview: https://www.lockheedmartin.com/en-us/capabilities/manufacturing/owego.html
  - DoD Contract Announcements & Defense News (MH-60 / VH-92A programs in Owego, NY): https://www.defense.gov/News/Contracts/

## Taxes & Gas
- **Sales Tax**: 8.00% (NY State 4.00% + Tioga County 4.00%). [SalesTaxHandbook NY](https://www.salestaxhandbook.com/new-york/rates/tioga-county) (Retrieved 2026-08-31)
- **Income Tax**: 10.90% (Top NY state marginal individual income tax rate).
- **Gas Price**: $3.45. [AAA NY Gas Prices](https://gasprices.aaa.com/?state=NY) (Retrieved 2026-08-31)
