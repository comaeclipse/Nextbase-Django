# Archbald, PA Source Notes

- **Retrieval guide:** `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` and `SKILL.md` were reviewed for the active TS/Neon import path, source priority, completion gate requirements, and verification checklist.
- **Geography & Demographics:** Census Reporter profile `16000US4202832-archbald-pa` and Census Gazetteer 2024 (`4202832` / place `02832` in state `42` / county `069` Lackawanna County) report Archbald borough, PA population at 7,404 (ACS 2023 5-year estimate) and land area at 17.088 square miles, giving a density of 433 people per square mile (`7,404 / 17.088 = 433.28`). Centroid coordinates from Census Gazetteer 2024 / `pace_derived.json`: latitude `41.506438`, longitude `-75.550459`.
- **Governance & State-Owned Facts:** Following product conventions, `state_party` and `governor` store the current Pennsylvania Governor party (`D`, Josh Shapiro). State flat income tax rate is 3.07% (PA Dept of Revenue). General sales tax rate is 6.0% (no local sales tax addon in Lackawanna County).
- **Elections & Politics:** County-level certified election returns for Lackawanna County, PA were retrieved for 2016 and 2024 presidential elections.
  - **2016:** Clinton 51,983 (51.79% two-party, 49.79% total), Trump 48,384 (48.21% two-party). Stored `2016Election = Clinton`, `2016PresidentPercent = 50`.
  - **2024:** Harris 59,510 (51.40% two-party, 50.90% total), Trump 56,261 (48.60% two-party). Stored `2024 Election = Harris`, `2024PresidentPercent = 51`.
  - **Deltas:** `rep_vote_share_change_pp = 0.39` (48.60% − 48.21%), `dem_vote_share_change_pp = -0.39` (51.40% − 51.79%). Summary: `0.4 pp more Republican since 2016`.
  - **Classification:** `CityPolitics` is classified as `Moderately Liberal` based on two-party Democratic share of 51.4% (51–54.9% threshold).
- **Cost of Living & Housing:** Baseline cost of living index for the Scranton–Wilkes-Barre MSA is 90 (AreaVibes/BestPlaces composite baseline). Zillow Home Value Index (ZHVI) for Archbald, PA reports a typical home value of $257,500 (July 2026).
- **Veterans Affairs & Benefits:** Sourced via VA.gov facilities database. The nearest outpatient-capable VA facility and medical center is the Wilkes-Barre VA Medical Center (1111 East End Blvd, Wilkes-Barre, PA 18711), located 24 driving miles from Archbald borough centroid. `VA = Yes`. PA Department of Military and Veterans Affairs (DMVA) benefits text summarizes 100% state income tax exemption on military retirement pay, 100% property tax exemption for qualified disabled veterans, and state veterans homes including the Gino J. Merli Veterans' Center in nearby Scranton.
- **Safety & Crime:** AreaVibes reports Archbald's violent crime rate at 133 per 100,000 residents. Using the repo's open TCI calculation (`133 / 359.1 * 100 = 37.0`), `TCI = 37` and public-facing `CrimeRating = Low`.
- **Social & Cannabis:** Pennsylvania operates a medical marijuana program under PA Act 16 (`Marijuana = Medical`). MAP Pennsylvania Equality Profile reports an overall policy score of 16.75/49 (stored `17`). Archbald is not included in the HRC Municipal Equality Index (`LGBTQ` and `LGBTQ_MEI` left blank; `LGBTQSource` documents the source and gap).
- **Economy & Hubs:** Lockheed Martin Missiles and Fire Control operates a major manufacturing plant in Archbald, PA (Route 6 / Maybrook Industrial Park), producing laser-guided bomb systems and missile components. Lockheed Martin job postings for Archbald confirm active industrial presence (`DefenseHub = Y` / `defense_hub_manual = true`). `TechHub = N`. In-borough store check: `HasWalmart = N` (nearest Walmart is in Dickson City, ~4 mi away), `HasCostco = N`.
- **Weather & Climate:** NOAA 1991–2020 Normals for station KAVP (Wilkes-Barre/Scranton International Airport, ~15 mi south): 45 inches annual snow, 39 inches annual rainfall, 176 sunny days, average January low 20°F, average July high 85°F, July humidity 71%. Display climate is `Humid continental`.
- **Gasoline:** AAA Fuel Prices for Scranton–Wilkes-Barre–Hazleton area reports regular gasoline at $4.09 per gallon (`Gas = "$4.09"`).

## URLs

- Census Reporter Archbald profile: https://censusreporter.org/profiles/16000US4202832-archbald-pa/
- US Census 2024 Gazetteer Places PA: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_42.txt
- Pennsylvania Department of Revenue Tax Rates: https://www.revenue.pa.gov/
- Lackawanna County Certified Election Results: https://www.lackawannacounty.org/departments/elections_and_voter_registration/certified_election_results.php
- PA Department of State Official Election Returns: https://www.electionreturns.pa.gov/
- Zillow Archbald PA Home Values: https://www.zillow.com/home-values/35111/archbald-pa/
- Wilkes-Barre VA Medical Center: https://www.va.gov/wilkes-barre-health-care/
- PA DMVA Benefits: https://www.dmva.pa.gov/veteransaffairs/Pages/Benefits-and-Services.aspx
- AreaVibes Archbald Crime: https://www.areavibes.com/archbald-pa/crime/
- MAP Pennsylvania Equality Profile: https://www.lgbtmap.org/equality-maps/profile_state/PA
- Lockheed Martin Archbald Operations: https://www.lockheedmartin.com/
- NOAA NCEI Climate Normals (KAVP): https://www.ncei.noaa.gov/products/us-climate-normals
- AAA Gas Prices Pennsylvania: https://gasprices.aaa.com/?state=PA
