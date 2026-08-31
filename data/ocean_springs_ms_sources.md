# Ocean Springs, MS - Data Sources & Fact-Checking Audit

**Geography:** Ocean Springs city, Jackson County, Mississippi (MS)  
**Retrieval Date:** August 31, 2026  
**Auditor/Agent:** Antigravity AI  

---

## 1. Identity & Population
- **City:** Ocean Springs
- **State:** MS
- **County:** Jackson
- **Population:** 18,429 (2020 U.S. Decennial Census) / ~18,926 (2023 Census Estimate)
- **Land Area:** 11.55 sq miles (U.S. Census Bureau QuickFacts)
- **Population Density:** 1,596 persons / sq mile (18,429 / 11.55 sq mi)
- **Sources:**
  - U.S. Census Bureau QuickFacts (Ocean Springs city, Mississippi): https://www.census.gov/quickfacts/oceanspringscitymississippi
  - Census Reporter Profile: https://censusreporter.org/profiles/16000US2853520-ocean-springs-ms/

---

## 2. Politics & Election Trends
- **2016 Presidential Election (Jackson County, MS):**
  - Donald Trump (R): 33,629 votes (67.51% total, 69.65% two-party)
  - Hillary Clinton (D): 14,657 votes (29.42% total, 30.35% two-party)
  - Total Two-Party Votes: 48,286
- **2024 Presidential Election (Jackson County, MS):**
  - Donald Trump (R): 36,376 votes (69.75% total, 70.16% two-party)
  - Kamala Harris (D): 15,469 votes (29.67% total, 29.84% two-party)
  - Total Two-Party Votes: 51,845
- **Partisan Shift (Two-Party):**
  - `rep_vote_share_change_pp`: +0.52 pp (70.16% - 69.65%)
  - `dem_vote_share_change_pp`: -0.52 pp (29.84% - 30.35%)
  - `ElectionChange`: 0.5 pp more Republican
- **City Politics:** `County-level: Conservative` (Jackson County is ~70% Republican. Ocean Springs municipal government is mayor-aldermen system, predominantly Conservative/Republican).
- **Sources:**
  - Jackson County MS Official Election Commission Returns: https://www.jackson.ms.us/
  - Mississippi Secretary of State Official Election Results: https://www.sos.ms.gov/elections-voting
  - MIT Election Data and Science Lab (MEDSL): https://electionlab.mit.edu/data

---

## 3. Housing
- **Zillow Home Value Index (ZHVI):** $271,190 (Typical home value for Ocean Springs, MS as of mid-2026)
- **Display Price:** `$271k`
- **Sources:**
  - Zillow Research ZHVI Data (Ocean Springs, MS): https://www.zillow.com/home-values/46765/ocean-springs-ms/

---

## 4. Taxes & Gas
- **Combined Sales Tax Rate:** 7.00% (7.00% Mississippi State sales tax rate; no local municipal general retail add-on tax)
- **Gasoline Price:** $3.55 / gal (AAA Regular Gas Price index for Biloxi-Gulfport-Pascagoula, MS metro area)
- **Sources:**
  - Mississippi Department of Revenue Sales & Use Tax Guide: https://www.dor.ms.gov/business/sales-tax
  - Tax Foundation State & Local Sales Tax Rates 2026: https://taxfoundation.org/data/all/state/2026-sales-tax-rates-midyear/
  - AAA Fuel Gauge Report (Biloxi-Gulfport-Pascagoula metro): https://gasprices.aaa.com/?state=MS

---

## 5. Veterans Affairs (VA Health Facilities)
- **Primary VA Facility:** Biloxi VA Medical Center (VA Gulf Coast Veterans Health Care System)
- **Address/Location:** 400 Veterans Ave, Biloxi, MS 39531 (~7 miles west of Ocean Springs across Biloxi Bay via US-90)
- **Facility Type:** VA Medical Center / Major VA Hospital (`has_va`: Y, `distance_to_va`: `7 miles`)
- **Sources:**
  - U.S. Department of Veterans Affairs Directory (VA Gulf Coast Health Care): https://www.va.gov/gulf-coast-health-care/locations/biloxi-va-medical-center/

---

## 6. Weather & Climate (1991–2020 NOAA Normals)
- **Annual Snowfall:** 0.0 inches
- **Annual Rainfall:** 64.0 inches
- **Sunny Days:** 219 days
- **January Average Low (Winter):** 44 °F
- **July Average High (Summer):** 90 °F
- **July Relative Humidity:** 76%
- **Climate Label:** Humid Subtropical
- **Sources:**
  - NOAA National Centers for Environmental Information (NCEI) U.S. Climate Normals 1991-2020 (Station: Keesler Air Force Base / Biloxi / Pascagoula): https://www.ncei.noaa.gov/access/us-climate-normals/

---

## 7. Safety & LGBTQ Social Policy
- **TCI (Total Crime Index):** 65 (Indexed violent crime rate relative to U.S. baseline = 100)
- **Crime Rating:** Low (FBI UCR violent crime rate significantly lower than state and national averages; ranked among top safe coastal communities in MS)
- **LGBTQ Score / MEI:** 0 / 100 (HRC Municipal Equality Index 2022 score for Ocean Springs/Biloxi region)
- **LGBTQ Rating:** Low
- **Sources:**
  - FBI Uniform Crime Reporting (UCR) Program / Ocean Springs Police Department
  - AreaVibes / CrimeGrade Ocean Springs Crime Data: https://www.areavibes.com/ocean+springs-ms/crime/
  - Human Rights Campaign (HRC) Municipal Equality Index: https://www.hrc.org/resources/municipal-equality-index

---

## 8. Economy, Defense & Amenities
- **Tech Hub:** N
- **Defense Hub:** Y (Curated `defense_hub_manual = true` due to immediate proximity to Keesler Air Force Base in Biloxi ~6 mi, Huntington Ingalls Shipbuilding in Pascagoula ~15 mi, Naval Construction Battalion Center Gulfport ~15 mi, and NOAA/Stennis Space Center)
- **Walmart Presence:** Yes (`has_walmart: true` — Walmart Supercenter #1066 located at 3911 Bienville Blvd, Ocean Springs, MS 39564)
- **Costco Presence:** No (`has_costco: false` — Nearest Costco located in Ridgeland, MS or Mobile, AL)
