# Jamestown, NY Source Notes

## Retrieval Guide Context
- Followed `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` and `nextbase-data-retrieval` skill for source priority, field normalization, and verification steps.
- Active application: Next.js 16 + React 19 + TypeScript + Neon PostgreSQL.

## Geography & Demographics
- **Population**: 28,712 (2020 U.S. Decennial Census for Jamestown city, NY).
- **Land Area**: 8.90 sq mi (Census Bureau place geography, Place FIPS `36-38264`, GNIS `0953925`).
- **Density**: 3,226 per sq mi (28,712 / 8.90 sq mi = 3,226.1).
- **Coordinates**: Latitude 42.097603, Longitude -79.236135 (Census 2024 Gazetteer / place internal point).
- **Source**: U.S. Census Bureau QuickFacts & 2020 Decennial Census: https://www.census.gov/quickfacts/jamestowncitynewyork

## State-Owned Facts (locations_stateinfo)
- **State Party / Governor**: `D` / `D` (Kathy Hochul, Democratic Governor of New York).
- **Income Tax**: 10.90% (Top New York State individual marginal income tax rate).
- **Veterans Benefits**: New York exempts qualifying military retirement pay from state income tax, provides real property tax exemptions (Alternative Veterans, Cold War Veterans, and Eligible Funds exemptions), education tuition awards through NYS HESC, civil service hiring preferences, and five state-operated veterans homes. Source: NYS Department of Veterans' Services (https://veterans.ny.gov/).
- **Cannabis / Marijuana**: `Recreational` (New York Marijuana Regulation and Taxation Act / MRTA, adult-use regulated by NYS Office of Cannabis Management: https://cannabis.ny.gov/).

## Local Politics & Elections
- **County**: Chautauqua County.
- **2016 Presidential Election (Chautauqua County)**:
  - Donald J. Trump (R/C): 58.8% of total vote.
  - Hillary Clinton (D/WF/WE): 34.77% of total vote.
  - Two-party vote share: Trump 62.84%, Clinton 37.16%.
- **2024 Presidential Election (Chautauqua County)**:
  - Donald J. Trump (R/C): 34,528 votes (60.03% total, 60.99% two-party).
  - Kamala D. Harris (D/WF): 22,085 votes (38.39% total, 39.01% two-party).
  - Total votes cast: 57,521; total two-party votes: 56,613.
- **Trend Calculation**:
  - `rep_vote_share_change_pp`: 60.99% - 62.84% = -1.85 pp (-1.8 pp).
  - `dem_vote_share_change_pp`: 39.01% - 37.16% = +1.85 pp (+1.8 pp).
  - `ElectionChange`: `1.8 pp more Democratic since 2016`.
- **Classification**: `County-level: Conservative` (55–64.9% Republican two-party vote share threshold per `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md`).
- **Sources**:
  - NYS Board of Elections 2024 Official Presidential Results: https://results.elections.ny.gov/
  - Chautauqua County Board of Elections: https://www.chqgov.com/board-of-elections/board-of-elections / https://www.votechautauqua.com/
  - NYS Board of Elections 2016 Official General Election Returns: https://www.elections.ny.gov/

## Housing & Cost of Living
- **Avg Home Value**: $127,313 (Zillow Home Value Index / ZHVI all homes, smoothed, seasonally adjusted for Jamestown, NY, mid-2026).
- **Avg Home Value Display**: `$127,313`
- **Cost of Living**: Baseline index 82 (will be canonically derived post-import from BEA Regional Price Parities via `scripts/sync-col-index-from-rpp.ts`).
- **Source**: Zillow Research & ZHVI Jamestown NY: https://www.zillow.com/home-values/32187/jamestown-ny/

## Taxes & Utilities
- **Sales Tax**: 8.00% (New York State 4.00% + Chautauqua County 4.00% = 8.00%).
- **Gas Price**: $4.15 per gallon (AAA New York regular gasoline average / NYSERDA Upstate average, August 2026).
- **Sources**:
  - NYS Department of Taxation and Finance (Sales Tax Rates by County): https://www.tax.ny.gov/
  - AAA Gas Prices (New York): https://gasprices.aaa.com/?state=NY
  - NYSERDA Weekly Retail Gasoline Price Survey: https://www.nyserda.ny.gov/

## Veterans Affairs Healthcare
- **VA Facility Access**: `Y` (in-city outpatient clinic).
- **Nearest VA**: `Jamestown VA Clinic` (Community-Based Outpatient Clinic at 321 Hazeltine Avenue, Jamestown, NY 14701).
- **Distance to VA**: `0 miles` (located inside municipal borders).
- **Parent Healthcare System**: VA Western New York Healthcare System (Buffalo VA Medical Center, Buffalo, NY).
- **Sources**:
  - VA Western New York Healthcare System: https://www.va.gov/western-new-york-health-care/locations/jamestown-va-clinic/
  - VA Facilities API / VHA VAST directory.

## Safety & Crime
- **Violent Crime Rate**: ~620 per 100,000 residents reported for Jamestown, NY.
- **TCI Calculation**: Using standard open methodology indexed to national violent crime rate baseline of 380 per 100,000: (620 / 380) * 100 = 163.16 -> stored as `163`.
- **Crime Rating**: `High` (TCI > 120 / higher than state & national averages).
- **Context**: Jamestown participates in NYS DCJS Gun Involved Violence Elimination (GIVE) initiative; major Part I index crimes show a long-term downward trend over 10-15 years according to Jamestown Police Department annual reporting, but violent crime rate per capita remains elevated relative to small-town peers.
- **Sources**:
  - NYS Division of Criminal Justice Services (DCJS) Index Crime Reports: https://www.criminaljustice.ny.gov/crimnet/ojsa/indexcrimestats.htm
  - FBI Crime Data Explorer (CDE): https://cde.ucr.cjis.gov/
  - Jamestown Police Department public safety reports: https://www.jamestownny.gov/departments/police-department/

## LGBTQ Equality Policy
- **HRC Municipal Equality Index (MEI)**: `Not Rated` (Jamestown, NY is not surveyed in the annual HRC Municipal Equality Index).
- **State Policy Profile**: `44.5/49` (Movement Advancement Project / MAP New York Equality Profile overall score of 44.5/49).
- **LGBTQ Source**: `MAP New York Profile 2026; no Jamestown HRC MEI coverage found`
- **Source**: Movement Advancement Project New York Profile: https://www.lgbtmap.org/equality_maps/profile_state/NY

## Economy & Hub Designations
- **Tech Hub**: `N` (Jamestown's economy is primarily centered on manufacturing, healthcare, public administration, and cultural tourism rather than a technology cluster).
- **Defense Hub**: `N` (`defense_hub_manual = false`).
  - RTX/Collins Aerospace check: No active or historical RTX/Collins Aerospace facilities in Jamestown, NY (Jamestown, ND is the Collins site in North Dakota).
  - Area employers include Cummins Inc. Jamestown Engine Plant (Lakewood/Jamestown — heavy-duty diesel engines), TitanX Engine Cooling, Bush Industries, and UPMC Chautauqua. None of these establish a defense-contracting hub for military retirees.
- **Amenity Backfill - Walmart**: `N`
  - Note: While there is a Walmart Supercenter (#1940) serving the area at 350 E Fairmount Ave, Lakewood, NY 14750 (approx 3 miles from downtown), it is physically located across the municipal border in the town/village of Lakewood. Per the skill guidance, `HasWalmart=N` for city-proper geography.
- **Amenity Backfill - Costco**: `N`
  - Nearest Costco warehouses are located in the Buffalo/Amherst metro area (~70 miles north) or Pittsburgh outer metro (Cranberry, PA ~100 miles south).

## Climate & Weather
- **Normals Source**: NOAA NCEI 1991–2020 Climate Normals for station USC00304207 (`Jamestown 4 ENE, NY` / Chautauqua County).
- **Snow**: 98 inches annually (98.4 inches in 1991-2020 normals; significant lake-effect snowfall from Lake Erie).
- **Rain**: 46 inches annually (45.93 inches annual precipitation).
- **Sunny Days**: 160 days per year.
- **Average Low Winter (ALW)**: 16°F (January normal low 16.1°F, February normal low 15.8°F).
- **Average High Summer**: 80°F (July normal daily maximum 80.3°F).
- **Humidity Summer**: 72% (July relative humidity average).
- **Climate Label**: `Humid continental` (Dfb/Dfa Koppen transition).
- **Sources**:
  - NOAA NCEI Climate Normals Quick Access: https://www.ncei.noaa.gov/access/us-climate-normals/
  - Golden Gate Weather Services NOAA 1991-2020 Normals USC00304207: https://ggweather.com/

## Description & Tags
- **Description**: Situated along the Chadakoin River at the southern tip of Chautauqua Lake in Western New York's Southern Tier, Jamestown is celebrated as the birthplace of Lucille Ball and home to the National Comedy Center. The city offers retirees exceptionally affordable housing, local outpatient healthcare at the Jamestown VA Clinic, and rich cultural opportunities near the historic Chautauqua Institution, balanced against high New York state taxes and heavy lake-effect winter snowfall.
- **Tags**: `["Affordable", "Culture", "Arts", "Lake", "Healthcare", "Small Town"]`
