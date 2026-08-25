# Data Sources & Fact-Check Audit: Camden, NJ

- **Location**: Camden, NJ (Camden County)
- **Retrieval Date**: 2026-08-25
- **Primary Geographies Used**: City of Camden (Census Place GEOID `3410000`), Camden County (FIPS `34007`)

---

## 1. Identity & Geography

- **City**: Camden
- **State**: NJ
- **County**: Camden
- **Population**: 71,791 (2020 US Decennial Census place total)
- **Land Area**: 8.92 square miles
- **Density**: 8,048 people / sq mile (`71,791 / 8.92`)
- **Primary Source**: US Census Bureau QuickFacts & ACS 5-Year Data
- **Source URL**: https://www.census.gov/quickfacts/fact/table/camdencitynewjersey/PST045223

---

## 2. Politics & Presidential Elections

- **County-Level 2016 Results**:
  - Hillary Clinton (Dem): 117,308 votes
  - Donald Trump (Rep): 59,716 votes
  - Two-Party Total: 177,024
  - Dem Two-Party Share: 66.27% (`66%`)
  - Rep Two-Party Share: 33.73%
- **County-Level 2024 Results**:
  - Kamala Harris (Dem): 125,720 votes
  - Donald Trump (Rep): 86,183 votes
  - Two-Party Total: 211,903
  - Dem Two-Party Share: 59.33% (`59%`)
  - Rep Two-Party Share: 40.67%
- **Partisan Shift Calculations**:
  - `rep_vote_share_change_pp`: `+6.9` (40.67% - 33.73%)
  - `dem_vote_share_change_pp`: `-6.9` (59.33% - 66.27%)
  - `ElectionChange`: `6.9 pp more Republican since 2016`
- **City Culture / Politics**: `Strongly Liberal` (Camden City municipal/precinct returns consistently show >80% Democratic vote share).
- **Primary Sources**: Camden County Clerk Election Results Archive & MIT Election Data and Science Lab (MEDSL).
- **Source URL**: https://www.camdencounty.com/service/voting-and-elections/election-results/

---

## 3. Housing & Real Estate

- **AvgHomeValue**: `$150,576` (Zillow Home Value Index - ZHVI, mid-2026 typical home value, all homes, mid-tier, smoothed/seasonally adjusted)
- **Primary Source**: Zillow Research Data Downloads
- **Source URL**: https://www.zillow.com/research/data/

---

## 4. Taxes & Cost of Living

- **Sales Tax**: `6.625` (Standard New Jersey state sales tax rate of 6.625%; qualified Urban Enterprise Zone businesses offer a reduced 3.3125% rate)
- **State Income Tax**: Top marginal rate of 10.75% (State-owned fact in `locations_stateinfo`)
- **Gas Price**: `$3.35` per gallon (AAA New Jersey regular gasoline average benchmark)
- **Cost of Living**: Initialized to `100`; derived post-ingest from BEA Regional Price Parities via `scripts/sync-col-index-from-rpp.ts`.
- **Primary Sources**: NJ Division of Taxation & AAA Gas Prices
- **Source URL**: https://www.state.nj.us/treasury/taxation/ and https://gasprices.aaa.com/?state=NJ

---

## 5. Veterans Affairs (VA Access)

- **VA**: `Yes` (Outpatient-capable VA facility within 25 miles)
- **NearestVA**: `Camden VA Clinic` (Outpatient Clinic, 300 S Broadway, Suite 103, Camden, NJ 08103)
- **DistanceToVA**: `0 miles` (Located inside city limits)
- **Nearest VA Hospital**: Corporal Michael J. Crescenz VA Medical Center (Philadelphia VAMC, ~5 miles across Delaware River)
- **Veterans Benefits**: New Jersey exempts military retired pay from state income tax; provides a $250 veteran property tax deduction, 100% disabled veteran property tax exemption, civil service preference, state veteran homes, and free state park access.
- **Primary Sources**: VA Facilities API & VHA VAST Layer / NJ Dept of Military and Veterans Affairs
- **Source URL**: https://www.va.gov/find-locations/ and https://www.nj.gov/military/veterans/benefits-cost-of-living/

---

## 6. Amenities (Walmart / Costco)

- **HasWalmart**: `No` (No Walmart within Camden city limits; nearest stores are in neighboring Audubon and Cherry Hill)
- **HasCostco**: `No` (No Costco within Camden city limits; nearest warehouses are in neighboring Cherry Hill and Mount Laurel)
- **Primary Sources**: Official Walmart Store Finder & Costco Warehouse Locator
- **Source URLs**: https://www.walmart.com/store/finder and https://www.costco.com/warehouse-locations

---

## 7. Safety & Crime Index

- **TCI**: `330` (Violent crime rate per 100k indexed to US national average = 100; Camden County Police Department reports significant 12-13% YoY crime drops in 2024–2025)
- **CrimeRating**: `High`
- **Primary Sources**: Camden County Police Department Annual Briefings & FBI UCR Data Explorer
- **Source URL**: https://cde.ucr.cjis.gov/

---

## 8. LGBTQ+ Social Policy

- **LGBTQ**: `Protected under NJ Law Against Discrimination`
- **LGBTQ_MEI**: `Not Rated` (City not evaluated in standard HRC Municipal Equality Index)
- **LGBTQStatePolicyScore**: `High` (New Jersey state non-discrimination laws)
- **LGBTQSource**: `Movement Advancement Project / NJ Law Against Discrimination`
- **Source URL**: https://www.lgbtmap.org/equality-maps/profile_state/NJ

---

## 9. Industry & Employer Hubs

- **TechHub**: `No`
- **DefenseHub**: `Yes` (Camden hosts an active L3Harris facility at 1 Federal St, matched to DB ID 332 in `defense_employer_locations`, plus Holtec International's Krishna P. Singh Technology Campus)
- **Primary Sources**: L3Harris Careers Site Facets & Holtec International Technology Campus Listings
- **Source URL**: https://careers.l3harris.com/en/search_jobs

---

## 10. Climate & Weather Normals

- **Station**: Philadelphia International Airport (KPHL, NOAA 1991–2020 Climate Normals)
- **Snow**: `13` inches annual snowfall
- **Rain**: `42` inches annual precipitation
- **SunnyDays**: `205` sunny / partly sunny days
- **AverageLowWinter**: `27` °F (January mean low)
- **AverageHighSummer**: `87` °F (July mean high)
- **HumiditySummer**: `66` % (July relative humidity)
- **Climate**: `Humid subtropical`
- **Primary Source**: NOAA NCEI U.S. Climate Normals (1991-2020)
- **Source URL**: https://www.ncei.noaa.gov/access/us-climate-normals/
