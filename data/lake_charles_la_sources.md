# Lake Charles, LA - Data Sources & Fact-Checking Audit

**Geography:** Lake Charles city, Calcasieu Parish, Louisiana (LA)  
**Retrieval Date:** August 31, 2026  
**Auditor/Agent:** Antigravity AI  

---

## 1. Identity & Population
- **City:** Lake Charles
- **State:** LA
- **County:** Calcasieu Parish
- **Population:** 82,430 (2024 ACS 5-Year Estimate) / 84,872 (2020 U.S. Decennial Census)
- **Land Area:** 47.5 sq miles (U.S. Census Bureau Gazetteer)
- **Population Density:** 1,710 persons / sq mile
- **Sources:**
  - U.S. Census Bureau ACS 5-Year Data & Gazetteer: https://www.census.gov/
  - Census Reporter Profile (Lake Charles, LA): https://censusreporter.org/profiles/16000US2241155-lake-charles-la/

---

## 2. Politics & Election Trends
- **2016 Presidential Election (Calcasieu Parish):**
  - Donald Trump (R): 54,191 votes (64.68% total, 67.33% two-party)
  - Hillary Clinton (D): 26,296 votes (31.39% total, 32.67% two-party)
- **2024 Presidential Election (Calcasieu Parish):**
  - Donald Trump (R): 55,485 votes (69.89% two-party)
  - Kamala Harris (D): 23,891 votes (30.11% two-party)
- **Partisan Shift (Two-Party):**
  - `rep_vote_share_change_pp`: +2.57 pp
  - `dem_vote_share_change_pp`: -2.57 pp
  - `ElectionChange`: 2.6 pp more Republican
- **City Politics:** `County-level: Conservative` (Calcasieu Parish voted ~70% Republican in 2024. Mayor Nic Hunter is Republican).
- **Sources:**
  - Louisiana Secretary of State Official Election Results: https://voterportal.sos.la.gov/
  - MIT Election Data and Science Lab (MEDSL) / Calcasieu Parish Clerk of Court

---

## 3. Housing
- **Zillow Home Value Index (ZHVI):** $172,500 (Typical home value for Lake Charles, LA city)
- **Display Price:** `$173k`
- **Sources:**
  - Zillow Research ZHVI Data (Lake Charles, LA): https://www.zillow.com/home-values/18881/lake-charles-la/

---

## 4. Taxes & Gas
- **Combined Sales Tax Rate:** 10.25% (5.00% Louisiana State + 5.25% Calcasieu Parish/City local sales tax)
- **Gasoline Price:** $3.15 / gal (AAA Regular Gas Price index for Lake Charles, LA metro)
- **Sources:**
  - Louisiana Uniform Local Sales Tax Board (LULSTB): https://www.salestaxonline.com/
  - Tax Foundation State & Local Sales Tax Rates 2025/2026: https://taxfoundation.org/
  - AAA Fuel Gauge Report: https://gasprices.aaa.com/

---

## 5. Veterans Affairs (VA Health Facilities)
- **Primary VA Facility:** Lake Charles VA Clinic (South Willow Street Clinic)
- **Address/Location:** 3663 S Willow St, Lake Charles, LA 70607
- **Facility Type:** Outpatient Clinic (`has_va`: Y, `distance_to_va`: `0 miles`)
- **Sources:**
  - U.S. Department of Veterans Affairs Directory: https://www.va.gov/alexandria-health-care/locations/lake-charles-va-clinic/

---

## 6. Weather & Climate (1991–2020 NOAA Normals)
- **Annual Snowfall:** 0.0 inches
- **Annual Rainfall:** 62.0 inches
- **Sunny Days:** 213 days
- **January Average Low (Winter):** 41 °F
- **July Average High (Summer):** 92 °F
- **July Relative Humidity:** 75%
- **Climate Label:** Humid Subtropical
- **Sources:**
  - NOAA National Centers for Environmental Information (NCEI) U.S. Climate Normals 1991-2020 (Station: Lake Charles Regional Airport / LCH): https://www.ncei.noaa.gov/

---

## 7. Safety & LGBTQ Social Policy
- **TCI (Total Crime Index):** 260 (Indexed violent crime rate relative to U.S. baseline)
- **Crime Rating:** High (FBI UCR violent crime rate ~1,000 per 100k)
- **LGBTQ Score / MEI:** 0 / 100 (HRC Municipal Equality Index 2022 score for Lake Charles, LA)
- **LGBTQ Rating:** Low
- **Sources:**
  - FBI Uniform Crime Reporting (UCR) Program / Local Police Department briefings
  - Human Rights Campaign (HRC) Municipal Equality Index 2022: https://www.hrc.org/resources/municipal-equality-index

---

## 8. Economy, Defense & Amenities
- **Tech Hub:** N
- **Defense Hub:** Y (Curated `defense_hub_manual = true` due to Chennault International Airport defense MRO complex hosting Northrop Grumman AWACS/E-8 Joint STARS/C-130 maintenance facilities, AAR Aircraft Services defense contracts, Lake Charles VA Clinic, and LA Army National Guard units)
- **Walmart Presence:** Yes (`has_walmart: true` — 3 Supercenter locations: 260 W Prien Lake Rd, 3451 Nelson Rd, 2011 Hwy 14)
- **Costco Presence:** No (`has_costco: false` — Nearest location in Baton Rouge or Lafayette)
