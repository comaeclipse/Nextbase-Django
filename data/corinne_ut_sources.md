# Corinne, UT Source Notes

Retrieval date: 2026-08-29.

## Identity and Geography

- **City / State / County**: Corinne, UT, located in Box Elder County.
- **Population**: 809 (2020 Decennial Census). Recent ACS estimates place population between 783 and 876.
  - Source: U.S. Census Bureau 2020 Census (Decennial Census P1 count).
- **Land Area & Density**: Land area ~3.88 sq miles; density ~209 persons / sq mile (809 / 3.88 sq mi).
  - Source: Census Gazetteer / US Census Bureau.
- **Coordinates**: 41.5516° N, 112.1122° W.

## Housing

- **AvgHomeValue**: $456,699 (ZHVI mid-2026).
  - Source: Zillow Home Value Index (ZHVI) single-family home value index for Corinne, UT / Box Elder County (June 2026 data).

## Taxes and Cost of Living

- **SalesTax**: 6.65% combined rate.
  - Breakdown: 4.85% Utah State Sales Tax + 1.80% Box Elder County Sales Tax (0% municipal addition for Corinne).
  - Source: Utah State Tax Commission & SalesTaxHandbook 2025–2026.
- **Gas**: $3.29 / gallon (Utah state / Box Elder regional average, August 2026).
- **CostOfLiving**: Set to `100` placeholder in CSV; `col_index` / `cost_of_living` derived post-ingest via BEA Regional Price Parities (`import-bea-rpp.ts` & `sync-col-index-from-rpp.ts`).

## Veterans Affairs

- **VA**: `Y`.
- **NearestVA**: `Brigham City VA Clinic` (~6 miles east in Brigham City, UT).
  - Type: Outpatient Clinic (VHA VAST inventory).
- **NearestVAHospital**: `George E. Wahlen Department of Veterans Affairs Medical Center` (~58 miles south in Salt Lake City, UT).
- **DistanceToVA**: `6 miles`.
- Source: VHA VAST ArcGIS facility inventory dataset & VA Salt Lake City Health Care System directory.

## Weather and Climate Normals (1991–2020)

- **Snow**: 36 inches annual snowfall.
- **Rain**: 18 inches annual precipitation.
- **SunnyDays**: 226 days per year.
- **AverageLowWinter**: 16°F (January average low).
- **AverageHighSummer**: 91°F (July average high).
- **HumiditySummer**: 32% (July afternoon relative humidity).
- **Climate**: `Semi-arid / Continental`.
- Source: NOAA NCEI U.S. Climate Normals (Station: Brigham City / Corinne area).

## Politics and Elections (Box Elder County, UT)

- **2016 Presidential Election**:
  - Trump: 12,230 votes (61.53% overall)
  - Clinton: 2,282 votes (11.48% overall)
  - McMullin / Third party: 5,366 votes (26.99%)
  - Two-party total: 14,512. Trump two-party share: 84.28%. Clinton two-party share: 15.72%.
- **2024 Presidential Election**:
  - Trump: 18,161 votes (77.16% overall)
  - Harris: 4,221 votes (17.93% overall)
  - Third party: 1,155 votes (4.91%)
  - Two-party total: 22,382. Trump two-party share: 81.14%. Harris two-party share: 18.86%.
- **Trend Calculations**:
  - `rep_vote_share_change_pp` = 81.14 - 84.28 = **-3.1**
  - `dem_vote_share_change_pp` = 18.86 - 15.72 = **3.1**
  - `ElectionChange`: `3.1 pp more Democratic since 2016` (noting 2016 third-party / McMullin impact).
  - `CityPolitics`: `Strongly Conservative` (81% two-party Rep share > 65% threshold).
- Source: Official Box Elder County election results & MIT Election Data and Science Lab (MEDSL).

## Safety and Social Policy

- **TCI**: 45 (Low violent/property crime rate relative to national baseline).
- **CrimeRating**: `Low`.
- **LGBTQ**: `Moderate` (State policy framework).
- **LGBTQ_MEI**: `Not Rated` (Unincorporated/small municipality not surveyed by HRC MEI).
- **LGBTQSource**: `Movement Advancement Project (Utah)`.

## Industry & Retail

- **TechHub**: `N`.
- **DefenseHub**: `N` (`DefenseHubManual = N`). Note: Northrop Grumman's Promontory propulsion plant is located in Box Elder County ~15 miles northwest, but Corinne itself has no direct physical employer site in `defense_employer_locations` nor a military installation within city limits.
- **HasWalmart**: `Y` (Walmart Supercenter, Brigham City, UT ~6 mi).
- **HasCostco**: `N` (Nearest Costco in Ogden, UT ~22 mi).

## Tags & Description

- **Tags**: `["Small Town", "Historic", "Quiet", "Low Crime", "Outdoor Recreation", "Mountains"]`.
- **Description**: Sourced factual summary highlighting Corinne's historic railroad origins ("Burg on the Bear"), proximity to Great Salt Lake and Bear River Migratory Bird Refuge, and low-density rural living with access to Box Elder County infrastructure.
