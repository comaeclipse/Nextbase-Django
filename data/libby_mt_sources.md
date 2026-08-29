# Libby, MT Data Sources & Provenance Audit

**Geography:** Libby city (`geo_type: city`, `is_candidate: true`)
**County:** Lincoln County, MT
**State:** Montana (MT)
**Retrieval Date:** 2026-08-27

---

## 1. Identity & Demographics
- **Population:** `2,775`
  - **Source:** 2020 U.S. Census Bureau Decennial Census (Place 30-43675)
- **Density:** `1,506` residents / sq mi
  - **Source:** 2020 U.S. Census Bureau land area (1.84 sq mi)
- **Coordinates:** `48.3797° N, 115.5547° W`

## 2. Housing & Cost of Living
- **Typical Home Value (`avg_home_value`):** `$350,840` (Display: `$350,840`)
  - **Source:** Zillow Home Value Index (ZHVI) Mid-Tier All Homes for Libby, MT (2024–2026 vintage).
- **Cost of Living (`col_index`/`cost_of_living`):** Derived post-import via BEA Regional Price Parities (`scripts/import-bea-rpp.ts` & `scripts/sync-col-index-from-rpp.ts`).

## 3. Veterans Affairs Healthcare Access
- **`has_va`:** `true` (In-city clinic)
- **`nearest_va`:** Libby VA Clinic
- **Address:** 211 East 2nd Street, Libby, MT 59923 (Phone: 406-293-8711)
- **`distance_to_va`:** `0 miles`
- **Recomputation Note:** Re-verified by `scripts/sync-va-facilities.ts` against official VHA VAST ArcGIS dataset.

## 4. Weather & Climate
- **Normals Period:** NOAA 1991–2020 Normals (Station Libby 1 NE / Libby Dam)
- **Snow Annual:** `51 inches`
- **Rain Annual:** `20 inches`
- **Sun Days:** `155 days`
- **Average Low Winter (ALW):** `20°F`
- **Average High Summer:** `86°F`
- **Humidity Summer:** `48%`
- **Climate Label:** `Humid continental` (Dfb / Pacific Northwest inland valley influence)

## 5. Politics & Elections
- **Geography Used:** Lincoln County, MT presidential returns
- **2016 Baseline:**
  - Donald Trump: 6,729 votes (72.12% total, 76.73% 2-party)
  - Hillary Clinton: 2,041 votes (21.88% total, 23.27% 2-party)
- **2024 Endpoint:**
  - Donald Trump: 75.60% total (77.30% 2-party)
  - Kamala Harris: 22.20% total (22.70% 2-party)
- **Partisan Trend Deltas:**
  - `rep_vote_share_change_pp`: `+0.6 pp` (Republican 2-party share increased from 76.73% to 77.30%)
  - `dem_vote_share_change_pp`: `-0.6 pp`
- **`city_politics` Label:** `County-level: Strongly Conservative`

## 6. Taxes & Policy
- **Sales Tax:** `0.00%` (Montana state sales tax 0%; local option sales tax 0%)
- **Gas Price:** `$3.95` (AAA / EIA regional retail benchmark)
- **LGBTQ Rating:** `Not Rated` (HRC MEI does not evaluate cities under population threshold)
- **LGBTQ Source:** `MAP Montana overall policy tally, 2024 vintage; municipal MEI score not scored`

## 7. Defense & Economy
- **Tech Hub:** `false`
- **Defense Hub (`defense_hub_manual`):** `false` (No defense contractor plants or major active military installations)
- **Has Walmart:** `false` (Nearest store located in Kalispell, MT ~90 miles)
- **Has Costco:** `false` (Nearest warehouse located in Kalispell, MT ~90 miles)