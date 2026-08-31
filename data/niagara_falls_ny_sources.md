# Niagara Falls, NY — Data Provenance & Sources

- **Location**: Niagara Falls, NY (Niagara County)
- **Geo Type**: `city`
- **Is Candidate**: `true`
- **Retrieval Date**: 2026-08-29

## Field Sources & Values

### Identity & Demographics
- `City`: Niagara Falls
- `State`: NY
- `County`: Niagara
- `Population`: 47,700 (U.S. Census Bureau ACS 5-year estimates / 2023 vintage)
- `Density`: 3,407 residents/sq mi (Land area: 14.0 sq mi)
- `Population Source`: U.S. Census Bureau ACS (https://censusreporter.org/profiles/16000US3651055-niagara-falls-ny/)

### Housing
- `AvgHomeValue`: $148,500 (Zillow Home Value Index / ZHVI, smoothed mid-tier all homes, July 2026 update)
- `AvgHomeValueDisplay`: $148,500
- `Source`: Zillow Research (https://www.zillow.com/home-values/40058/niagara-falls-ny/)

### Taxes & Cost of Living
- `SalesTax`: 8.00% (New York state rate 4.00% + Niagara County local sales tax rate 4.00%)
- `Source`: New York State Department of Taxation and Finance / Tax Foundation
- `CostOfLiving`: Moderate (100 — baseline before BEA RPP sync)
- `Gas`: $3.45 (AAA / EIA retail gas price average for Niagara County, August 2026)

### Veterans Affairs Access
- `VA`: Y (within 25-mile outpatient access threshold)
- `NearestVA`: Niagara Falls VA Clinic (7224 Buffalo Ave, Niagara Falls, NY 14304)
- `DistanceToVA`: 0 miles (Located inside city limits)
- `NearestVAHospital`: Buffalo VA Medical Center (3495 Bailey Ave, Buffalo, NY 14215)
- `DistanceToVAHospital`: 20 miles
- `Source`: VA VAST ArcGIS Facility Inventory / VA WNY Healthcare System (https://www.va.gov/western-new-york-health-care/locations/niagara-falls-va-clinic/)

### Weather & Climate
- `Snow`: 83 inches/yr (NOAA NCEI Climate Normals 1991-2020 for Niagara Falls International Airport - KIAG)
- `Rain`: 38 inches/yr
- `SunnyDays`: 157 days
- `AverageLowWinter`: 19 °F (January normal low)
- `AverageHighSummer`: 81 °F (July normal high)
- `HumiditySummer`: 67% (July relative humidity)
- `Climate`: Continental (Dfb)
- `Source`: NOAA National Centers for Environmental Information (NCEI) (https://www.ncei.noaa.gov/access/us-climate-normals/)

### Politics & Elections
- `CityPolitics`: County-level: Conservative
- `2016Election`: Trump
- `2016PresidentPercent`: 60% (Two-party: Trump 49,223 / 82,111 = 59.95%)
- `2024 Election`: Trump
- `2024PresidentPercent`: 57% (Two-party: Trump 58,678 / 102,116 = 57.46%)
- `ElectionChange`: 2.5 pp more Democratic since 2016
- `rep_vote_share_change_pp`: -2.5
- `dem_vote_share_change_pp`: 2.5
- `Source`: Niagara County Board of Elections / NY State Board of Elections certified returns (https://www.niagaracounty.com/departments/g_-_l/board_of_elections/index.php)

### Safety & Social
- `TCI`: 260 (FBI UCR violent crime rate normalized relative index)
- `CrimeRating`: High
- `LGBTQ`: Moderate
- `LGBTQ_MEI`: 68 (MAP NY state policy score context & regional HRC benchmark)
- `LGBTQSource`: Movement Advancement Project / HRC (https://www.lgbtmap.org/equality-maps/profile_state/NY)

### Economy & Amenities
- `TechHub`: N
- `DefenseHub`: Y (Manually curated `defense_hub_manual = Y`: Hosts Niagara Falls Air Reserve Station — 914th Air Refueling Wing, 107th Attack Wing NY ANG)
- `HasWalmart`: Y (Walmart Supercenter, 1540 Military Rd, Niagara Falls, NY 14304)
- `HasCostco`: N (Nearest warehouse in Amherst, NY ~15 miles)
