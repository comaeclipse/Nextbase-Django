# Montgomery, AL - Data Sources & Fact-Checking Audit

**Geography:** Montgomery city, Montgomery County, Alabama (AL)  
**Retrieval Date:** August 29, 2026  
**Auditor/Agent:** Antigravity AI  

---

## 1. Identity & Population
- **City:** Montgomery
- **State:** AL
- **County:** Montgomery County
- **Population:** 200,603 (2020 U.S. Decennial Census) / ~195,287 (2023 ACS Estimate)
- **Land Area:** 159.86 sq miles (U.S. Census Bureau QuickFacts)
- **Population Density:** 1,255 persons / sq mile
- **Sources:**
  - U.S. Census Bureau QuickFacts (Montgomery city, Alabama): https://www.census.gov/quickfacts/montgomerycityalabama
  - Census Reporter: https://censusreporter.org/profiles/16000US0150000-montgomery-al/

---

## 2. Politics & Election Trends
- **2016 Presidential Election (Montgomery County, AL):**
  - Hillary Clinton (D): 58,916 votes (61.45% total, 63.41% two-party)
  - Donald Trump (R): 34,003 votes (35.46% total, 36.59% two-party)
  - Third-party: 2,959 votes (3.09%)
- **2024 Presidential Election (Montgomery County, AL):**
  - Kamala Harris (D): 57,946 votes (64.53% total, 65.53% two-party)
  - Donald Trump (R): 30,477 votes (33.94% total, 34.47% two-party)
  - Third-party: 1,375 votes (1.53%)
- **Partisan Shift (Two-Party):**
  - `rep_vote_share_change_pp`: -2.12 pp
  - `dem_vote_share_change_pp`: +2.12 pp
  - `ElectionChange`: 2.1 pp more Democratic
- **City Politics:** `Moderately Liberal` (Montgomery County voted ~65.5% Democratic two-party in 2024. Mayor Steven Reed is nonpartisan/Democrat).
- **Audit / Fact-Checking Note:** Initial web search queries returned aggregated snippets mixing Montgomery County, AL with Montgomery County, PA/MO. Deep verification against certified election returns confirmed Montgomery County, AL remained 65.5% Democratic two-party in 2024.
- **Sources:**
  - Alabama Secretary of State Official Election Results: https://www.sos.alabama.gov/alabama-votes/voter/election-data
  - MIT Election Data and Science Lab (MEDSL) / Dave Leip's Atlas of U.S. Presidential Elections

---

## 3. Housing
- **Zillow Home Value Index (ZHVI):** $152,082 (Typical home value for Montgomery, AL city as of mid-2026)
- **Display Price:** `$152k`
- **Sources:**
  - Zillow Research ZHVI Data (Montgomery, AL): https://www.zillow.com/home-values/46561/montgomery-al/

---

## 4. Taxes & Gas
- **Combined Sales Tax Rate:** 10.00% (4.00% Alabama State + 2.50% Montgomery County + 3.50% Montgomery City sales tax)
- **Gasoline Price:** $3.66 / gal (AAA Regular Gas Price index for Montgomery, AL metro)
- **Sources:**
  - Alabama Department of Revenue (Local Tax Rates): https://revenue.alabama.gov/
  - Tax Foundation State & Local Sales Tax Rates 2025/2026: https://taxfoundation.org/
  - AAA Fuel Gauge Report: https://gasprices.aaa.com/

---

## 5. Veterans Affairs (VA Health Facilities)
- **Primary VA Facility:** Central Alabama Veterans Health Care System (CAVHCS) - Montgomery Campus (West Campus)
- **Address/Location:** 215 Perry Hill Rd, Montgomery, AL 36109 (~3 miles from city center)
- **Facility Type:** VA Medical Center / Tertiary Hospital (`has_va`: Y, `distance_to_va`: `3 miles`)
- **Sources:**
  - U.S. Department of Veterans Affairs Directory: https://www.va.gov/central-alabama-health-care/locations/montgomery-va-medical-center/

---

## 6. Weather & Climate (1991–2020 NOAA Normals)
- **Annual Snowfall:** 0.0 inches
- **Annual Rainfall:** 51.0 inches
- **Sunny Days:** 214 days
- **January Average Low (Winter):** 37 °F
- **July Average High (Summer):** 93 °F
- **July Relative Humidity:** 72%
- **Climate Label:** Humid Subtropical
- **Sources:**
  - NOAA National Centers for Environmental Information (NCEI) U.S. Climate Normals 1991-2020 (Station: Montgomery Regional Airport / Dannelly Field - KMGM): https://www.ncei.noaa.gov/

---

## 7. Safety & LGBTQ Social Policy
- **TCI (Total Crime Index):** 175 (Indexed violent crime rate relative to U.S. baseline = 100)
- **Crime Rating:** High (FBI UCR violent crime rate ~595-713 per 100k)
- **LGBTQ Score / MEI:** 38 / 100 (HRC Municipal Equality Index 2024 score for Montgomery, AL)
- **LGBTQ Rating:** Moderate-Low
- **Sources:**
  - FBI Uniform Crime Reporting (UCR) Program / Local Police Department briefings
  - Human Rights Campaign (HRC) Municipal Equality Index 2024: https://www.hrc.org/resources/municipal-equality-index

---

## 8. Economy, Defense & Amenities
- **Tech Hub:** N
- **Defense Hub:** Y (`defense_hub_manual = true` due to Maxwell-Gunter Air Force Base hosting Air University, Spaatz Center, LeMay Center, Gunter Annex, and RTX/defense contractors)
- **Walmart Presence:** Yes (`has_walmart: true` — 4 Supercenters, e.g. 6495 Atlanta Hwy & 3801 Eastern Blvd)
- **Costco Presence:** Yes (`has_costco: true` — 8251 Eastchase Pkwy)
