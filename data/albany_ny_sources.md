# Albany, NY Data Sources and Field Documentation

**Retrieval Date**: 2026-07-23  
**Target City**: Albany, NY (County: Albany County, NY)  
**Standard**: vetretire-data-retrieval skill guidance  

---

## 1. Identity and Geography
- **City / State / County**: Albany, NY, Albany County
- **Population**: `100,826` (ACS 2023 5-year estimate; 2020 Decennial Census: `99,224`).
- **Land Area**: 21.39 sq mi (U.S. Census Bureau 2020 Gazetteer).
- **Density**: `4,714` persons / sq mi (calculated as 100,826 / 21.39).
- **Centroid Coordinates**: Lat `42.665745`, Lon `-73.798353` (Census 2024 Gazetteer Place Internal Point).

## 2. Housing
- **Typical Home Value (ZHVI)**: `$336,028`
- **Source**: Zillow Research Data / Zillow Home Value Index (ZHVI) mid-tier, all-homes smoothed index for Albany city proper, NY (retrieved July 2026).

## 3. Taxes & Cost of Living
- **Combined Sales Tax**: `8.0%` (4.0% NY State + 4.0% Albany County). Source: NY Department of Taxation & Finance.
- **Top Marginal State Income Tax**: `10.9%`. Source: Tax Foundation (2025/2026 NY State Individual Income Tax Brackets).
- **Cost of Living Index**: `105` (Moderate). Source: C2ER / Payscale Cost of Living Index (U.S. Average = 100 baseline).
- **Gasoline Price**: `$4.07`. Source: AAA Daily Fuel Gauge Report (Albany-Schenectady-Troy metro area, July 2026).

## 4. Veterans Affairs & Benefits
- **VA Access**: `Yes`
- **Nearest VA Facility**: Albany VA Medical Center (Samuel S. Stratton VA Medical Center), 113 Holland Ave, Albany, NY 12208.
- **Distance to VA**: `0 miles` (located within city limits). Source: VA Facilities API / VA.gov.
- **Veterans Benefits**: Military retired pay is 100% exempt from NY state income tax. Property tax exemptions up to 15-25% for wartime and combat veterans (Alternative Veterans Property Tax Exemption). Free tuition assistance at SUNY/CUNY for eligible veterans (NYS Veterans Tuition Award), civil service preference points, and lifetime state park pass privileges. Source: NYS Division of Veterans' Services.

## 5. Weather & Climate
- **Normals Period**: 1991–2020 NOAA NCEI Normals for Albany International Airport (KALB).
- **Annual Snowfall**: `59 inches` (59.2" NOAA normal).
- **Annual Rainfall**: `41 inches` (40.68" NOAA normal).
- **Sunny / Partly Sunny Days**: `180 days` per year.
- **Average Low Winter (Jan)**: `16°F` (15.9°F NOAA normal).
- **Average High Summer (Jul)**: `84°F` (83.9°F NOAA normal).
- **Summer Relative Humidity**: `70%`.
- **Climate Label**: `Humid Continental`
- **Derived Climate Category**: `cold_snowy` (Satisfies Rule 1: annual snowfall >= 30").

## 6. Politics & Presidential Elections
- **Geography Used**: Albany County, NY (151,005 total votes cast in 2024).
- **State Party / Governor**: `D` / Governor Kathy Hochul (`D`).
- **City Politics Classification**: `Liberal` (Democratic vote share ~61–63%).
- **2016 Presidential Election**: Clinton (`D`) - 84,329 total votes (Dem + WFP + WE) = 59.4% total / 63.26% 2-party. Trump (`R`) - 48,986 votes = 34.5% total / 36.74% 2-party. Total 2-party: 133,315.
- **2024 Presidential Election**: Harris (`D`) - 92,589 total votes (Dem + WFP) = 61.3% total / 62.92% 2-party. Trump (`R`) - 54,560 votes = 36.1% total / 37.08% 2-party. Total 2-party: 147,149.
- **Vote Share Deltas (2-Party Math)**:
  - `rep_vote_share_change_pp`: `+0.34` (rounded `0.3`)
  - `dem_vote_share_change_pp`: `-0.34` (rounded `-0.3`)
- **Election Trend Summary**: `Essentially unchanged since 2016` (+0.3 pp Rep shift).
- **Sources**: NYS Board of Elections Certified General Election Returns (2016 & 2024).

## 7. Safety & Social Policy
- **Total Crime Index (TCI)**: `185` (Indexed to US average = 100).
- **Crime Rating**: `High` (City proper violent crime rate ~750-900 per 100k vs US avg ~380 per 100k; note Albany County overall is moderate at ~428 per 100k).
- **Sources**: FBI Crime Data Explorer (NIBRS 2023/2024) / NYS Division of Criminal Justice Services (DCJS).
- **Marijuana Legalization**: `Recreational` (Legalized under NY Marihuana Regulation and Taxation Act).
- **LGBTQ Rights Ratings**:
  - HRC Municipal Equality Index (MEI): `100` / 100 (Perfect score for Albany City).
  - MAP State Policy Score: `44.5` / 49 (High).
  - Source Note: `HRC MEI 2024 (100/100) + MAP NY state policy score (44.5/49)`.

## 8. Economic Hubs & Defense Employers
- **Tech Hub**: `Y` (Capital of "Tech Valley", home to NY CREATES Albany NanoTech Complex and designated National Semiconductor Technology Center).
- **Defense Hub**: `N` (`defense_hub_manual = false`). RTX career postings indicate 3 remote-only postings, 0 physical/onsite postings in Albany city proper (`onsite_posting_count = 0`).
