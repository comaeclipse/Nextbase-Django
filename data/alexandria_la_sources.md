# Alexandria, LA - Data Sources & Fact-Checking Audit

**Geography:** Alexandria city, Rapides Parish, Louisiana (LA)  
**Retrieval Date:** August 25, 2026  
**Auditor/Agent:** Antigravity AI  

---

## 1. Identity & Population
- **City:** Alexandria
- **State:** LA
- **County:** Rapides Parish
- **Population:** 45,275 (2020 U.S. Decennial Census) / ~43,588–44,566 (2023 ACS Estimate)
- **Land Area:** 28.49 sq miles (U.S. Census Bureau QuickFacts)
- **Population Density:** 1,589 persons / sq mile
- **Sources:**
  - U.S. Census Bureau QuickFacts: https://www.census.gov/quickfacts/alexandriacitylouisiana
  - Census Reporter: https://censusreporter.org/profiles/16000US2200975-alexandria-la/

---

## 2. Politics & Election Trends
- **2016 Presidential Election (Rapides Parish):**
  - Donald Trump (R): 36,816 votes (64.8% total, 66.8% two-party)
  - Hillary Clinton (D): 18,322 votes (32.2% total, 33.2% two-party)
- **2024 Presidential Election (Rapides Parish):**
  - Donald Trump (R): 36,171 votes (68.2% total, 68.6% two-party)
  - Kamala Harris (D): 16,537 votes (31.2% total, 31.4% two-party)
- **Partisan Shift (Two-Party):**
  - `rep_vote_share_change_pp`: +1.86 pp
  - `dem_vote_share_change_pp`: -1.86 pp
  - `ElectionChange`: 1.9 pp more Republican
- **City Politics:** `County-level: Conservative` (Rapides Parish is ~68% Republican. Municipal mayor Jacques Roy is a Democrat in a nonpartisan/mayor-council city structure).
- **Sources:**
  - Louisiana Secretary of State Official Election Results: https://voterportal.sos.la.gov/
  - MIT Election Data and Science Lab (MEDSL) / Rapides Parish Clerk of Court

---

## 3. Housing
- **Zillow Home Value Index (ZHVI):** $148,190 (Typical home value for Alexandria, LA city as of mid-2026)
- **Display Price:** `$148k`
- **Sources:**
  - Zillow Research ZHVI Data (Alexandria, LA): https://www.zillow.com/home-values/35070/alexandria-la/

---

## 4. Taxes & Gas
- **Combined Sales Tax Rate:** 10.50% (5.00% Louisiana State + 5.50% Rapides Parish/City local sales tax)
- **Gasoline Price:** $3.67 / gal (AAA Regular Gas Price index for Alexandria, LA metro)
- **Sources:**
  - Louisiana Uniform Local Sales Tax Board (LULSTB): https://www.salestaxonline.com/
  - Tax Foundation State & Local Sales Tax Rates 2025/2026: https://taxfoundation.org/
  - AAA Fuel Gauge Report: https://gasprices.aaa.com/

---

## 5. Veterans Affairs (VA Health Facilities)
- **Primary VA Facility:** Alexandria VA Medical Center (Pineville / Alexandria VA Health Care System)
- **Address/Location:** 2495 Shreveport Hwy, Pineville, LA 71360 (Adjacent city across Red River, ~4 miles from Alexandria city center)
- **Facility Type:** VA Medical Center / Tertiary Hospital (`has_va`: Y, `distance_to_va`: `4 miles`)
- **Sources:**
  - U.S. Department of Veterans Affairs Directory: https://www.va.gov/alexandria-health-care/locations/alexandria-va-medical-center/

---

## 6. Weather & Climate (1991–2020 NOAA Normals)
- **Annual Snowfall:** 0.0 inches
- **Annual Rainfall:** 60.0 inches
- **Sunny Days:** 218 days
- **January Average Low (Winter):** 39 °F
- **July Average High (Summer):** 93 °F
- **July Relative Humidity:** 73%
- **Climate Label:** Humid Subtropical
- **Sources:**
  - NOAA National Centers for Environmental Information (NCEI) U.S. Climate Normals 1991-2020 (Station: Alexandria International Airport / AEX): https://www.ncei.noaa.gov/

---

## 7. Safety & LGBTQ Social Policy
- **TCI (Total Crime Index):** 250 (Indexed violent crime rate relative to U.S. baseline)
- **Crime Rating:** High (FBI UCR violent crime rate ~2,700 per 100k; local briefings note recent drops in homicides/burglaries)
- **LGBTQ Score / MEI:** 0 / 100 (HRC Municipal Equality Index 2022 score for Alexandria, LA)
- **LGBTQ Rating:** Low
- **Sources:**
  - FBI Uniform Crime Reporting (UCR) Program / Local Police Department briefings
  - Human Rights Campaign (HRC) Municipal Equality Index 2022: https://www.hrc.org/resources/municipal-equality-index

---

## 8. Economy, Defense & Amenities
- **Tech Hub:** N
- **Defense Hub:** Y (Curated `defense_hub_manual = true` due to proximity to Alexandria VA Medical Center, England Airpark defense aviation/contractor hub, Camp Beauregard LA National Guard, and Fort Johnson JRTC regional gateway)
- **Walmart Presence:** Yes (`has_walmart: true` — 2 Supercenter locations: 6225 Coliseum Blvd & 2050 N Mall Dr)
- **Costco Presence:** No (`has_costco: false` — Nearest location in Lafayette, LA ~90 miles)
