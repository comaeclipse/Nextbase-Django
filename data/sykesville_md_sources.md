# Sykesville, MD Source Notes

- **Retrieval guide:** `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` and `SKILL.md` were reviewed for the active TS/Neon import path, source priority, completion gate requirements, and verification checklist.
- **Geography & Demographics:** Census Gazetteer 2024 (`24-76675` / place `76675` in state `24` / Carroll County `013`) and ACS 2023 5-year estimates report Sykesville town, MD population at 4,316 and land area at 1.58 square miles, giving a density of 2,732 people per square mile (`4,316 / 1.58 = 2,731.6`). Centroid coordinates: latitude `39.37111`, longitude `-76.97250`.
- **Governance & State-Owned Facts:** `state_party` and `governor` store the current Maryland Governor party (`D`, Wes Moore). Maryland state general sales tax rate is 6.0% (no local sales tax in MD). Top state marginal individual income tax rate is 5.75% (MD Comptroller).
- **Elections & Politics:** Certified election returns for Carroll County, MD were retrieved for 2016 and 2024 presidential elections.
  - **2016:** Trump 58,215 (68.66% two-party, 64.7% total), Clinton 26,567 (31.34% two-party). Stored `2016Election = Trump`, `2016PresidentPercent = 65`.
  - **2024:** Trump 62,273 (62.81% two-party, 60.66% total), Harris 36,867 (37.19% two-party). Stored `2024 Election = Trump`, `2024PresidentPercent = 61`.
  - **Deltas:** `rep_vote_share_change_pp = -5.85` (62.81% − 68.66%), `dem_vote_share_change_pp = 5.85` (37.19% − 31.34%). Summary: `5.9 pp more Democratic since 2016`.
  - **Classification:** `CityPolitics` is classified as `County-level: Conservative` based on Carroll County two-party Republican share of 62.81% (55–64.9% threshold).
- **Cost of Living & Housing:** Zillow Home Value Index (ZHVI) for Sykesville, MD reports a typical home value of $585,462 (August 2026). Cost of living baseline is 115 (derived post-ingest via BEA Regional Price Parities sync for Baltimore-Columbia-Towson MSA).
- **Veterans Affairs & Benefits:** Calculated using VHA VAST ArcGIS public layer. The nearest VA Medical Center is the Baltimore VA Medical Center (10 N Greene St, Baltimore, MD 21201), located 19 crow-fly miles from Sykesville town centroid. `VA = Yes`. Maryland Department of Veterans Affairs (MDVA) benefits text summarizes state income tax subtraction for military retirement pay (up to $12,500 under age 55, $20,000 age 55+), 100% property tax exemption for 100% disabled veterans, and free state park entry.
- **Safety & Crime:** Sykesville Police Department / FBI CDE reports a violent crime rate of ~67.5 per 100,000 residents. Using the open TCI formula (`67.5 / 359.1 * 100 = 18.8`), `TCI = 19` and public-facing `CrimeRating = Low`.
- **Social & Cannabis:** Maryland legalized adult-use recreational marijuana effective July 1, 2023 under MD House Bill 556 / Senate Bill 516 (`Marijuana = Recreational`). MAP Maryland Equality Profile reports a high state policy score of 38/49. Sykesville is not covered by the HRC Municipal Equality Index (`LGBTQ` and `LGBTQ_MEI` left as `Not Rated`; `LGBTQSource` documents MAP profile).
- **Economy & Hubs:** `TechHub = N`. `DefenseHub = N` (`defense_hub_manual = N`). Physical site check in Sykesville town limits confirms no physical defense manufacturing plant or major tech cluster inside town limits. In-town store check: `HasWalmart = N` (nearest Walmart is in Eldersburg, ~2 mi outside town limits), `HasCostco = N` (nearest Costco in Owings Mills / Frederick).
- **Weather & Climate:** NOAA 1991–2020 Normals for station KBWI (Baltimore/Washington International Airport) & KDMW (Westminster): 21 inches annual snow, 47 inches annual rainfall, 213 sunny days, average January low 24°F, average July high 87°F, July humidity 68%. Display climate is `Humid Subtropical`.
- **Gasoline:** AAA Fuel Prices for Maryland reports regular gasoline at $3.94 per gallon (`Gas = "$3.94"`).

## URLs

- Census Reporter Sykesville profile: https://censusreporter.org/profiles/16000US2476675-sykesville-md/
- US Census 2024 Gazetteer Places MD: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_24.txt
- Maryland State Board of Elections 2024 Results: https://elections.maryland.gov/elections/2024/results/
- Maryland State Board of Elections 2016 Results: https://elections.maryland.gov/elections/2016/results/
- Zillow Sykesville MD Home Values: https://www.zillow.com/home-values/7440/sykesville-md/
- Baltimore VA Medical Center: https://www.va.gov/baltimore-health-care/locations/baltimore-va-medical-center/
- Maryland Department of Veterans Affairs Benefits: https://veterans.maryland.gov/
- MAP Maryland Equality Profile: https://www.lgbtmap.org/equality-maps/profile_state/MD
- NOAA NCEI Climate Normals: https://www.ncei.noaa.gov/products/us-climate-normals
- AAA Gas Prices Maryland: https://gasprices.aaa.com/?state=MD
