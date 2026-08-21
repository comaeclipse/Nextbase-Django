# Las Cruces, New Mexico Data Sources

Retrieval date: 2026-08-21

This is a Phase 1 research artifact for the Nextbase / VetRetire ingest workflow. The CSV was validated with the importer in dry-run mode only; no production Neon write was run from this feature branch.

## Core Identity & Geography

- **City:** Las Cruces, New Mexico
- **State:** NM
- **County:** Doña Ana County
- **Coordinates:** 32.326444, -106.789695 from Census 2024 Gazetteer / pace-derived centroid data (`las cruces|NM`, GEOID `3539380`).
- **Population:** 111,385 from 2020 U.S. Decennial Census (Census QuickFacts for Las Cruces city, New Mexico). Recent PEP Vintage estimate is ~116,978.
- **Land Area:** 76.93 sq mi (2020 Census).
- **Density:** 1,448 people per square mile (111,385 / 76.93 sq mi).
- **Sources:**
  - https://www.census.gov/quickfacts/fact/table/lascrucescitynewmexico
  - https://censusreporter.org/profiles/16000US3539380-las-cruces-nm/

## Cost, Housing, Taxes, And Fuel

- **Typical Home Value (`avg_home_value`):** $291,884 from Zillow Home Value Index (ZHVI) for Las Cruces, NM (smoothed, seasonally adjusted, all homes mid-tier, data through 2026-06-30).
- **Display Home Value (`avg_home_value_display`):** $291,884.
- **Cost of Living:** 98 from composite regional indices. Post-import `col_index` is synchronized automatically from BEA Regional Price Parities via `scripts/sync-col-index-from-rpp.ts`.
- **Sales Tax:** 8.39%. New Mexico Gross Receipts Tax (GRT) combined rate for the City of Las Cruces (includes state GRT base plus Doña Ana County and municipal increments).
- **Income Tax:** 5.90%, New Mexico top marginal individual income tax rate. (State-owned field maintained in `locations_stateinfo`).
- **Gas Price:** $4.13 per gallon, from AAA New Mexico regular unleaded average as of late August 2026.
- **Sources:**
  - https://www.zillow.com/home-values/52834/las-cruces-nm/
  - https://www.zillow.com/research/data/
  - https://www.lascruces.gov/
  - https://www.tax.newmexico.gov/
  - https://gasprices.aaa.com/?state=NM

## Politics & Elections

- **2016 County Winner:** Clinton. Doña Ana County certified results: Clinton 37,543 (53.72% total, 59.94% two-party), Trump 25,095 (35.91% total, 40.06% two-party), Johnson 5,413 (7.74%), Stein 941 (1.34%). Two-party total: 62,638. Total votes: 69,883.
- **2016 President Percent:** 54% (53.72% of total votes).
- **2024 County Winner:** Harris. Doña Ana County certified results: Harris 45,937 (53.79% total, 54.99% two-party), Trump 37,594 (44.02% total, 45.01% two-party). Two-party total: 83,531. Total votes: 85,407.
- **2024 President Percent:** 54% (53.79% of total votes).
- **Shift:** 4.94 percentage points more Republican by two-party vote share from 2016 (40.06% Rep) to 2024 (45.01% Rep).
- **`rep_vote_share_change_pp`:** 4.94
- **`dem_vote_share_change_pp`:** -4.94
- **`ElectionChange`:** "4.9 pp more Republican since 2016"
- **`CityPolitics`:** "County-level: Moderately Liberal" (Doña Ana County was 55.0% Dem two-party in 2024; Las Cruces municipal leadership is Democratic under Mayor Eric Enriquez).
- **State Governance:** Governor Michelle Lujan Grisham (D), `state_party = D`.
- **Sources:**
  - https://electionresults.sos.nm.gov/
  - https://www.donaanacounty.org/departments/elections
  - https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_New_Mexico
  - https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_New_Mexico

## Veterans & VA Access

- **VA Access (`has_va`):** Yes (Y).
- **Nearest VA Facility:** Las Cruces VA Clinic, 3401 Del Rey Boulevard, Las Cruces, NM 88012 (in-city outpatient clinic, 0 miles distance from centroid). Part of the El Paso VA Health Care System.
- **Distance to VA:** "0 miles".
- **Nearest VA Medical Center (VAMC):** El Paso VA Health Care System / William Beaumont Army Medical Center in El Paso, TX (~45 miles south).
- **Veterans Benefits Summary:** "New Mexico exempts military retirement pay from state income tax, provides property tax exemptions for qualifying disabled veterans ($10,000 baseline valuation discount; 100% exemption for 100% disabled), and offers state tuition assistance and recreation benefits."
- **Sources:**
  - https://www.va.gov/el-paso-health-care/locations/las-cruces-va-clinic/
  - https://www.nmdvs.org/
  - https://law.justia.com/codes/new-mexico/chapter-7/article-2/section-7-2-5-13/

## Public Safety & Crime

- **TCI (Total Crime Index / Violent Crime Index):** 201. Calculated as Las Cruces violent crime rate per 100k (720.0 per 100k via OpenCrime / FBI NIBRS reporting) divided by the national violent crime baseline (359.0 per 100k), multiplied by 100: (720.0 / 359.0) * 100 = 200.56, rounded to 201.
- **CrimeRating:** "High".
- **Sources:**
  - https://cde.ucr.cjis.gov/
  - https://opencrime.us/nm/las-cruces/
  - https://www.lascruces.gov/departments/police-department/

## LGBTQ & Social Policy

- **LGBTQ Rating:** "96"
- **LGBTQ MEI Score:** 96 (Las Cruces scored 96/100 in the Human Rights Campaign Municipal Equality Index with maximum marks for non-discrimination laws and law enforcement).
- **LGBTQ Source:** "HRC Municipal Equality Index Las Cruces scorecard"
- **Marijuana Status:** Recreational (New Mexico Cannabis Regulation Act, signed into law April 2021).
- **Sources:**
  - https://www.hrc.org/resources/municipal-equality-index
  - https://www.lascruces.gov/
  - https://www.mpp.org/issues/legalization/

## Retail Amenities

- **HasWalmart:** Yes (Y). Walmart Supercenter #806 at 571 Walton Blvd, Walmart Supercenter #4601 at 3331 Rinconada Blvd, Walmart Supercenter #5155 on S Valley Dr, and Walmart Neighborhood Market #5782 at 150 N Sonoma Ranch Blvd.
- **HasCostco:** No (N). No Costco warehouse in Las Cruces (nearest location is in El Paso, TX, ~42 miles south).
- **Sources:**
  - https://www.walmart.com/store/806-las-cruces-nm
  - https://www.walmart.com/store/4601-las-cruces-nm
  - https://www.costco.com/warehouse-locations

## Economic Hubs & Defense

- **TechHub:** No (N). Regional agriculture, university research, and defense-testing cluster rather than a primary commercial tech software/hardware hub.
- **DefenseHub (`defense_hub_manual`):** Yes (Y). Las Cruces serves as the primary residential, testing, and operational support center for White Sands Missile Range (WSMR, the DoD's largest military installation), NASA White Sands Test Facility, and New Mexico State University Physical Science Laboratory, with extensive defense-contractor presence (Raytheon, General Dynamics, Jacobs, Boeing).
- **Sources:**
  - https://www.wsmr.army.mil/
  - https://www.nasa.gov/centers/wstf/
  - https://psl.nmsu.edu/
  - https://www.mveda.com/

## Weather & Climate

- **NOAA Station:** Las Cruces International Airport (KLRU / USW00023032) / Las Cruces NMSU (USC00294793).
- **Climate Classification:** Hot desert (Köppen BWh/BSk).
- **Snow Annual (`snow_annual`):** 3 inches (NOAA 1991–2020 annual snowfall normal is 3.9 inches).
- **Rain Annual (`rain_annual`):** 10 inches (NOAA 1991–2020 annual precipitation normal is 9.7 inches).
- **Sunny Days (`sun_days`):** 293 days (CurrentResults / NOAA: 194 sunny + 99 partly cloudy days).
- **Average Low Winter (`alw`):** 30 °F (January mean daily minimum temperature of 30.1 °F).
- **Average High Summer (`avg_high_summer`):** 95 °F (July mean daily maximum temperature of 95.4 °F).
- **Humidity Summer (`humidity_summer`):** 38% (July mean relative humidity, ~52% morning / ~24% afternoon).
- **Sources:**
  - https://www.ncei.noaa.gov/products/us-climate-normals
  - https://www.weather.gov/epz/
  - https://www.currentresults.com/Weather/US/average-annual-sunshine-by-city.php

## Tags & Description

- **Tags:** `["Mountains", "Hiking", "Culture", "Arts", "Healthcare", "Military", "History"]`
  - *Mountains:* Organ Mountains rising to 9,000+ ft immediately east of the city.
  - *Hiking:* Organ Mountains-Desert Peaks National Monument, Dripping Springs Natural Area, Baylor Pass.
  - *Culture & Arts:* Historic Mesilla Plaza, Las Cruces Museum of Art, New Mexico Farm & Ranch Heritage Museum.
  - *Healthcare:* Las Cruces VA Clinic, Memorial Medical Center, MountainView Regional Medical Center.
  - *Military:* Strong community and economic ties to White Sands Missile Range and Fort Bliss.
  - *History:* Historic Old Mesilla, Camino Real de Tierra Adentro, Butterfield Overland Trail.
- **Description:** "Nestled in the Mesilla Valley between the Rio Grande and the rugged Organ Mountains, Las Cruces offers retirees over 290 sunny days a year, a low cost of living, and an active outdoor lifestyle with hiking in the Organ Mountains-Desert Peaks National Monument. Veterans benefit from an in-city VA outpatient clinic, strong defense and military ties to neighboring White Sands Missile Range, New Mexico's state income tax exemption on military retirement pay, and a high 96 HRC Municipal Equality Index score."
