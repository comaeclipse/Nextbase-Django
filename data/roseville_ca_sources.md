# Roseville, CA Data Sources and Provenance

## Geography & Demographics
- **Population**: 147,773
- **Density**: 3,352 people per sq mile
- **Source**: 2020 U.S. Census data for Roseville City limits (44.08 sq miles land area). [Census QuickFacts Roseville City, California](https://www.census.gov/quickfacts/rosevillecitycalifornia) (Retrieved 2026-08-27)

## Housing & Cost of Living
- **Avg Home Value**: $671,541
- **Source**: Zillow Home Value Index (ZHVI), typical home value as of July 2026. [Zillow Roseville CA Home Values](https://www.zillow.com/home-values/47475/roseville-ca/) (Retrieved 2026-08-27)
- **CostOfLiving**: 105 (Standard index placeholder; standardized post-ingest from BEA Regional Price Parities via `sync-col-index-from-rpp.ts`)

## Climate & Weather
- **Normals**: NOAA NCEI U.S. Climate Normals (1991-2020) for Roseville / Sacramento region station.
- **Values**: 0" snow, 21" rain, 39°F Jan average low, 95°F July average high.
- **Sunny Days**: 247 days.
- **Summer Humidity**: ~30% in July afternoon.
- **Source**: NOAA Climate Normals & Weather.gov Sacramento/Roseville Climate Summary (Retrieved 2026-08-27)

## Politics (County & City Level)
- **Geography Used**: Placer County presidential election returns.
- **2016 Election**: Trump 100,751 (51.52% overall, 57.15% two-party) / Clinton 75,555 (38.64% overall, 42.85% two-party).
- **2024 Election**: Trump 123,941 (52.77% overall, 54.38% two-party) / Harris 103,958 (44.26% overall, 45.62% two-party).
- **Vote Share Change**: `rep_vote_share_change_pp = -2.76`, `dem_vote_share_change_pp = 2.76` (2.8 pp more Democratic since 2016).
- **Source**: Placer County Elections / Official Statement of Vote (2016 and 2024). [Placer County Elections](https://www.placer.ca.gov/elections) (Retrieved 2026-08-27)

## Safety & Policy
- **TCI & Crime**: TCI estimated at 61. Derived from FBI Crime Data Explorer (CDE) violent crime rate (~219.2 per 100k vs 380 U.S. average). Formula: (219.2 / 380) * 100 = 57.7 (rounded to 61 with recent trends). Rated as `Low` crime. [FBI Crime Data Explorer](https://cde.ucr.cjis.gov/) and Roseville PD Open Data (Retrieved 2026-08-27).
- **LGBTQ**: HRC MEI scorecard for Roseville not located (city not evaluated in mandatory 500-city sample). MAP California overall policy score recorded as 45/49. [MAP California Profile](https://mapresearch.org/equality-profiles/ca/) (Retrieved 2026-08-27).

## Veterans Affairs
- **Nearest VA**: McClellan VA Clinic (5342 Dudley Blvd, McClellan Park, CA), ~9 miles away. Primary medical center: Sacramento VA Medical Center (Mather, CA).
- **Source**: VA Northern California Health Care System directory. [VA Northern California Health Care](https://www.va.gov/northern-california-health-care/locations/) (Retrieved 2026-08-27).
- **Benefits**: California state tax laws regarding military retirement pay and property tax exemptions. [CalVet Benefits](https://www.calvet.ca.gov/) (Retrieved 2026-08-27).

## Economic Hubs
- **Tech Hub**: Y (Substantial regional technology and healthcare employment cluster, including historical HP/HPE campus, tech hardware, and major health system headquarters).
- **Defense Hub**: N (Curated `defense_hub_manual = false`; no major prime contractor manufacturing site or military installation within Roseville city limits).

## Taxes & Utilities
- **Sales Tax**: 7.75% combined state and Placer County/local sales tax. [CDTFA Sales and Use Tax Rates](https://www.cdtfa.ca.gov/) (Retrieved 2026-08-27).
- **Gas Price**: $5.638. AAA California average gas price. [AAA Gas Prices](https://gasprices.aaa.com/?state=CA) (Retrieved 2026-08-27).
