# Buffalo, NY — Data Provenance & Sources

- **Location**: Buffalo, NY (Erie County)
- **Geo Type**: `city`
- **Is Candidate**: `true`
- **Retrieval Date**: 2026-08-29

## Field Sources & Values

### Identity & Demographics
- `City`: Buffalo
- `State`: NY
- `County`: Erie
- `Population`: 276,618 (U.S. Census Bureau ACS 1-year estimates / 2024 vintage; 2020 Census: 278,349)
- `Density`: 6,851 residents/sq mi (Land area: 40.4 sq mi)
- `Population Source`: U.S. Census Bureau ACS 5-Year / Census Reporter (https://censusreporter.org/profiles/16000US3611000-buffalo-ny/)

### Housing
- `AvgHomeValue`: $249,040 (Zillow Home Value Index / ZHVI, smoothed mid-tier all homes, July 2026 update)
- `AvgHomeValueDisplay`: $249,040
- `Source`: Zillow Research (https://www.zillow.com/home-values/37621/buffalo-ny/)

### Taxes & Cost of Living
- `SalesTax`: 8.75% (New York state rate 4.00% + Erie County local sales tax rate 4.75%)
- `Source`: New York State Department of Taxation and Finance / Tax Foundation
- `CostOfLiving`: Moderate (100 — baseline before BEA RPP sync)
- `Gas`: $3.45 (AAA / EIA retail gas price average for Buffalo-Niagara MSA, August 2026)

### Veterans Affairs Access
- `VA`: Y (within 25-mile outpatient access threshold)
- `NearestVA`: Buffalo VA Medical Center (3495 Bailey Ave, Buffalo, NY 14215)
- `DistanceToVA`: 0 miles (Located inside city limits)
- `NearestVAHospital`: Buffalo VA Medical Center
- `DistanceToVAHospital`: 0 miles
- `Source`: VA VAST ArcGIS Facility Inventory / VA WNY Healthcare System (https://www.va.gov/western-new-york-health-care/locations/buffalo-va-medical-center/)

### Weather & Climate
- `Snow`: 95 inches/yr (NOAA NCEI Climate Normals 1991-2020 for Buffalo Niagara International Airport - KBUF)
- `Rain`: 41 inches/yr
- `SunnyDays`: 157 days
- `AverageLowWinter`: 19 °F (January normal low)
- `AverageHighSummer`: 80 °F (July normal high)
- `HumiditySummer`: 67% (July relative humidity)
- `Climate`: Continental (Dfb/Dfa)
- `Source`: NOAA National Centers for Environmental Information (NCEI) (https://www.ncei.noaa.gov/access/us-climate-normals/)

### Politics & Elections
- `CityPolitics`: County-level: Moderately Liberal
- `2016Election`: Clinton
- `2016PresidentPercent`: 52% (Two-party: Clinton 227,738 / 433,747 = 52.50%)
- `2024 Election`: Harris
- `2024PresidentPercent`: 55% (Two-party: Harris 239,485 / 438,733 = 54.58%)
- `ElectionChange`: 2.1 pp more Democratic since 2016
- `rep_vote_share_change_pp`: -2.1
- `dem_vote_share_change_pp`: 2.1
- `Source`: Erie County Board of Elections / NY State Board of Elections certified returns (https://elections.erie.gov/ElectionResults)

### Safety & Social
- `TCI`: 240 (FBI UCR violent crime rate normalized relative index)
- `CrimeRating`: High
- `LGBTQ`: Excellent
- `LGBTQ_MEI`: 100 (Human Rights Campaign Municipal Equality Index 2023 score for Buffalo: 100/100)
- `LGBTQSource`: HRC MEI 2023 (https://www.hrc.org/resources/municipalities/buffalo-ny)

### Economy & Amenities
- `TechHub`: N
- `DefenseHub`: Y (Manually curated `defense_hub_manual = Y`: Northrop Grumman active site, Moog Inc. headquarters nearby in Erie County, Calspan)
- `HasWalmart`: Y (Walmart Supercenter, Buffalo/Cheektowaga)
- `HasCostco`: Y (Costco Warehouse, Amherst/Buffalo MSA)
