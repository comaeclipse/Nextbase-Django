# Franklin, LA - Data Sources & Fact-Checking Audit

**Geography:** Franklin city, St. Mary Parish, Louisiana (LA)  
**Retrieval Date:** August 31, 2026  
**Auditor/Agent:** Antigravity AI  

---

## 1. Identity & Population
- **City:** Franklin
- **State:** LA
- **County:** St. Mary Parish
- **Population:** 6,728 (2020 U.S. Decennial Census) / ~6,134 (2026 ACS Estimate)
- **Land Area:** 9.92 sq miles (U.S. Census Bureau QuickFacts)
- **Population Density:** 678 persons / sq mile
- **Sources:**
  - U.S. Census Bureau QuickFacts: https://www.census.gov/quickfacts/franklincitylouisiana
  - Census Reporter: https://censusreporter.org/profiles/16000US2227225-franklin-la/

---

## 2. Politics & Election Trends
- **2016 Presidential Election (St. Mary Parish):**
  - Donald Trump (R): 14,359 votes (62.8% total, 64.1% two-party)
  - Hillary Clinton (D): 8,050 votes (35.2% total, 35.9% two-party)
- **2024 Presidential Election (St. Mary Parish):**
  - Donald Trump (R): 65.4% total (66.1% two-party)
  - Kamala Harris (D): 33.6% total (33.9% two-party)
- **Partisan Shift (Two-Party):**
  - `rep_vote_share_change_pp`: +1.98 pp
  - `dem_vote_share_change_pp`: -1.98 pp
  - `ElectionChange`: 2.0 pp more Republican
- **City Politics:** `County-level: Conservative` (St. Mary Parish is ~66% Republican in 2024 two-party presidential results).
- **Sources:**
  - Louisiana Secretary of State Official Election Results: https://voterportal.sos.la.gov/
  - MIT Election Data and Science Lab (MEDSL) / St. Mary Parish Clerk of Court
  - NPR / WWNO 2024 Election Coverage

---

## 3. Housing
- **Zillow Home Value Index (ZHVI):** $97,654 (Typical home value for 70538 ZIP / Franklin, LA city as of mid-2026)
- **Display Price:** `$98k`
- **Sources:**
  - Zillow Research ZHVI Data (Franklin, LA 70538): https://www.zillow.com/home-values/70538/franklin-la/

---

## 4. Taxes & Gas
- **Combined Sales Tax Rate:** 10.45% (5.00% Louisiana State + 5.45% St. Mary Parish / City of Franklin local sales tax)
- **Gasoline Price:** $3.67 / gal (AAA Regular Gas Price index for Louisiana state / regional average)
- **Sources:**
  - Louisiana Uniform Local Sales Tax Board (LULSTB): https://www.salestaxonline.com/
  - Tax Foundation State & Local Sales Tax Rates 2025/2026: https://taxfoundation.org/
  - AAA Fuel Gauge Report: https://gasprices.aaa.com/

---

## 5. Veterans Affairs (VA Health Facilities)
- **Primary Outpatient Facility:** Houma VA Clinic (Houma, LA ~38 miles) / Lafayette VA Clinic (Lafayette, LA ~45 miles)
- **Primary Hospital / VAMC:** Southeast Louisiana Veterans Health Care System (New Orleans VAMC ~105 miles) or Alexandria VA Medical Center (Pineville, LA ~100 miles)
- **Facility Access:** `has_va`: Y (Outpatient access within regional area)
- **Sources:**
  - U.S. Department of Veterans Affairs Directory: https://www.va.gov/directory/guide/facility.asp?ID=603

---

## 6. Weather & Climate (1991–2020 NOAA Normals)
- **Annual Snowfall:** 0.0 inches
- **Annual Rainfall:** 64.0 inches
- **Sunny Days:** 218 days
- **January Average Low (Winter):** 45 °F
- **July Average High (Summer):** 91 °F
- **July Relative Humidity:** 75%
- **Climate Label:** Humid Subtropical
- **Sources:**
  - NOAA National Centers for Environmental Information (NCEI) U.S. Climate Normals 1991-2020: https://www.ncei.noaa.gov/
  - WeatherSpark / BestPlaces Climate Data for Franklin, LA

---

## 7. Safety & LGBTQ Social Policy
- **TCI (Total Crime Index):** 220 (Indexed violent crime rate relative to U.S. baseline)
- **Crime Rating:** High (FBI UCR / NeighborhoodScout violent crime rate analysis)
- **LGBTQ Score / MEI:** 0 / 100 (HRC Municipal Equality Index 2022 baseline for non-rated LA municipality)
- **LGBTQ Rating:** Low
- **Sources:**
  - FBI Uniform Crime Reporting (UCR) Program / NeighborhoodScout
  - Human Rights Campaign (HRC) Municipal Equality Index 2022: https://www.hrc.org/resources/municipal-equality-index

---

## 8. Economy, Defense & Amenities
- **Tech Hub:** N
- **Defense Hub:** N (`defense_hub_manual = false`)
- **Walmart Presence:** Yes (`has_walmart: true` — Walmart Supercenter, 200 NW Blvd, Franklin, LA 70538)
- **Costco Presence:** No (`has_costco: false` — Nearest location in Lafayette, LA ~45 miles)
