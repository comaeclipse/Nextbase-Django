# State College, Pennsylvania Data Sources

Retrieval date: 2026-08-21

This is a Phase 1 research artifact for the Nextbase / VetRetire ingest workflow. The CSV was validated with the importer in dry-run mode only; no production Neon write was run from this feature branch.

## Core Identity & Geography

- **City:** State College, Pennsylvania
- **State:** PA
- **County:** Centre County
- **Coordinates:** 40.791039, -77.856813 from Census 2024 Gazetteer / pace-derived centroid data (`state college|PA`, GEOID `4273808`).
- **Population:** 40,501 from 2020 U.S. Decennial Census (Census QuickFacts for State College borough, Pennsylvania).
- **Land Area:** 4.58 sq mi (2020 Census).
- **Density:** 8,843 people per square mile (40,501 / 4.58 sq mi).
- **Sources:**
  - https://www.census.gov/quickfacts/fact/table/statecollegeboroughpennsylvania/PST045220
  - https://censusreporter.org/profiles/16000US4273808-state-college-pa/
  - https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html

## Cost, Housing, Taxes, And Fuel

- **Typical Home Value (`avg_home_value`):** $420,353 from Zillow Home Value Index (ZHVI) for State College, PA (smoothed, seasonally adjusted, all homes mid-tier, data through 2026-06-30 / 2026-07-31).
- **Display Home Value (`avg_home_value_display`):** $420,353.
- **Cost of Living:** 102 from regional baseline index. Post-import `col_index` is synchronized automatically from BEA Regional Price Parities via `scripts/sync-col-index-from-rpp.ts`.
- **Sales Tax:** 6.00%. Pennsylvania state sales tax is 6.00%; Centre County imposes 0.00% local add-on sales tax.
- **Income Tax:** 3.07%, Pennsylvania flat individual income tax rate. (State-owned field maintained in `locations_stateinfo`).
- **Gas Price:** $4.14 per gallon, from AAA Pennsylvania / central PA regional regular unleaded average as of late August 2026.
- **Sources:**
  - https://www.zillow.com/state-college-pa/home-values/
  - https://www.zillow.com/research/data/
  - https://taxfoundation.org/data/all/state/2026-sales-tax-rates-midyear/
  - https://revenue-pa.custhelp.com/app/answers/detail/a_id/1283/~/what-are-the-state-and-local-sales-tax-rates-in-pennsylvania%3F
  - https://gasprices.aaa.com/?state=PA

## Politics & Elections

- **2016 County Winner:** Clinton. Centre County certified results: Clinton 34,708 (47.76% total, 50.99% two-party), Trump 33,356 (45.86% total, 49.01% two-party). Total major two-party votes: 68,064. Total votes: 72,674.
- **2016 President Percent:** 48% (47.76% of total votes).
- **2024 County Winner:** Harris. Centre County certified results: Harris 41,119 (50.89% total, 51.43% two-party), Trump 38,829 (48.06% total, 48.57% two-party). Total major two-party votes: 79,948. Total votes: 80,792.
- **2024 President Percent:** 51% (50.89% of total votes).
- **Shift:** 0.44 percentage points more Democratic by two-party vote share from 2016 (50.99% Dem) to 2024 (51.43% Dem).
- **`rep_vote_share_change_pp`:** -0.44
- **`dem_vote_share_change_pp`:** 0.44
- **`ElectionChange`:** "0.4 pp more Democratic since 2016"
- **`CityPolitics`:** "County-level: Mixed / Swing" (Centre County is a competitive bellwether county leaning 51% Democratic in 2024; State College Borough itself is heavily Democratic / Liberal with Mayor Ezra Nanes and Borough Council).
- **State Governance:** Governor Josh Shapiro (D), `state_party = D`.
- **Sources:**
  - https://www.centrecountypa.gov/220/Elections-Voter-Registration
  - https://centrecountypa.gov/1608/2016-General-Election
  - https://www.electionreturns.pa.gov/
  - https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Pennsylvania

## Veterans & VA Access

- **VA Access (`has_va`):** Yes (Y).
- **Nearest VA Facility:** State College VA Clinic, 2581 Clyde Avenue, State College, PA 16801 (in-city outpatient clinic, 0 miles distance from centroid).
- **Distance to VA:** "0 miles".
- **Nearest VA Medical Center (VAMC):** James E. Van Zandt Veterans' Administration Medical Center, 2907 Pleasant Valley Blvd, Altoona, PA 16602 (~39 miles southwest).
- **Veterans Benefits Summary:** "Pennsylvania exempts eligible military retirement pay from state income tax, provides a 100% real estate tax exemption for qualifying disabled veterans, offers blind/paralyzed veteran pensions, education assistance, civil service preference, and operates 6 state veterans homes."
- **Sources:**
  - https://www.va.gov/altoona-health-care/locations/state-college-va-clinic/
  - https://www.va.gov/altoona-health-care/locations/james-e-van-zandt-veterans-administration-medical-center/
  - https://www.dmva.pa.gov/veteransaffairs/Pages/Benefits-and-Services.aspx
  - https://www.revenue.pa.gov/

## Public Safety & Crime

- **TCI (Total Crime Index / Violent Crime Index):** 43. Calculated as State College violent crime rate per 100k (152.8 per 100k via OpenCrime / FBI NIBRS reporting) divided by the national violent crime baseline (359.0 per 100k), multiplied by 100: (152.8 / 359.0) * 100 = 42.56, rounded to 43.
- **CrimeRating:** "Low".
- **Sources:**
  - https://cde.ucr.cjis.gov/
  - https://www.statecollegepa.us/police
  - https://opencrime.us/pa/state-college/
  - https://www.areavibes.com/state-college-pa/crime/

## LGBTQ & Social Policy

- **LGBTQ Rating:** "100"
- **LGBTQ MEI Score:** 100 (State College has achieved a perfect 100/100 score on the Human Rights Campaign Municipal Equality Index for seven consecutive years).
- **LGBTQ Source:** "HRC Municipal Equality Index State College scorecard"
- **Marijuana Status:** Medical (Pennsylvania Medical Marijuana Act, Act 16 of 2016).
- **Sources:**
  - https://www.hrc.org/resources/municipal-equality-index
  - https://www.statecollegepa.us/
  - https://www.health.pa.gov/topics/programs/Medical%20Marijuana/

## Retail Amenities

- **HasWalmart:** Yes (Y). Walmart Supercenter #2230 is located at 1665 N Atherton St, State College, PA 16803; Walmart Supercenter #1640 is at 373 Benner Pike, State College, PA 16801.
- **HasCostco:** No (N). No Costco warehouse operates in State College or Centre County (nearest locations are in Harrisburg, Mechanicsburg, Lancaster, or Allentown).
- **Sources:**
  - https://www.walmart.com/store/2230-state-college-pa
  - https://www.walmart.com/store/1640-state-college-pa
  - https://www.costco.com/warehouse-locations/

## Economic Hubs & Defense

- **TechHub:** No (N). State College is an academic research community anchored by Penn State rather than a major commercial tech hub.
- **DefenseHub (`defense_hub_manual`):** Yes (Y). State College hosts Raytheon (RTX Intelligence & Space facility at 300 Science Park Rd / 2950 Science Park Rd, with active onsite defense postings tracked in `defense_employer_locations`) and Penn State's Applied Research Laboratory (ARL), an official U.S. Navy University Affiliated Research Center (UARC) conducting national defense undersea systems and intelligence research.
- **Sources:**
  - https://careers.rtx.com/global/en/raytheon-state-college%2C-pa-location
  - https://www.arl.psu.edu/
  - https://cbicc.org/

## Weather & Climate

- **NOAA Station:** State College COOP Station (USC00368449 / State College, PA) & State College Regional Airport (KUNV).
- **Climate Classification:** Humid continental (Köppen Dfb/Dfa).
- **Snow Annual (`snow_annual`):** 44 inches (NOAA 1991–2020 annual snowfall normal is 43.8 inches).
- **Rain Annual (`rain_annual`):** 42 inches (NOAA 1991–2020 annual precipitation normal is 41.53 inches).
- **Sunny Days (`sun_days`):** 178 days (NOAA / Sperling's / CurrentResults).
- **Average Low Winter (`alw`):** 20 °F (January mean daily minimum temperature of 20.3 °F).
- **Average High Summer (`avg_high_summer`):** 82 °F (July mean daily maximum temperature of 81.8 °F).
- **Humidity Summer (`humidity_summer`):** 70% (July mean relative humidity).
- **Sources:**
  - https://www.ncei.noaa.gov/products/us-climate-normals
  - https://www.ncdc.noaa.gov/cdo-web/datatools/normals
  - https://weatherspark.com/y/21966/Average-Weather-in-State-College-Pennsylvania-United-States-Year-Round

## Tags & Description

- **Tags:** `["College Town", "Healthcare", "Hiking", "Mountains", "Arts", "Culture", "Parks"]`
  - *College Town:* Anchored by Pennsylvania State University (University Park campus), offering rich lectures, campus life, athletic events at Beaver Stadium and Bryce Jordan Center.
  - *Healthcare:* Robust regional healthcare via Mount Nittany Health / Mount Nittany Medical Center and the in-town State College VA Clinic.
  - *Hiking & Mountains:* Immediate gateway to Mount Nittany Conservancy trails, Rothrock State Forest, and Bald Eagle State Forest.
  - *Arts & Culture:* Palmer Museum of Art, Center for the Performing Arts at Penn State, State Theatre, Central Pennsylvania Festival of the Arts.
  - *Parks:* Extensive municipal and regional parks including Tom Tudek Memorial Park, Arboretum at Penn State, and Spring Creek canyon.
- **Description:** "Home to Pennsylvania State University in the scenic Happy Valley region of central Pennsylvania, State College offers retirees a vibrant college-town atmosphere with rich cultural institutions like the Palmer Museum of Art and Center for the Performing Arts. The community provides comprehensive local healthcare anchored by Mount Nittany Medical Center and the State College VA Clinic, along with easy access to Rothrock State Forest and Mount Nittany trails. Veterans benefit from Pennsylvania's full state income tax exemption on military retirement pay and 100% property tax relief for qualifying disabled veterans, accompanied by a perfect 100 HRC Municipal Equality score."
