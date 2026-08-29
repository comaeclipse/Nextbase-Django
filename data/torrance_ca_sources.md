# Torrance, CA Data Sources & Provenance

**City**: Torrance, CA  
**County**: Los Angeles County  
**GeoType**: City  
**IsCandidate**: True  
**Ingest Date**: 2026-08-28  

---

## Field Map & Primary Sources

### 1. Identity & Geography
- **City**: Torrance
- **State**: CA (Postal abbreviation)
- **County**: Los Angeles
- **Population**: 141,163 (Source: US Census Bureau ACS 5-Year Estimates, 2023 / 2020 Census Place data)
- **Density**: 6,879 people / sq mi (Calculated from 141,163 population and 20.52 sq mi Census land area)
- **Centroid Coordinates**: Lat `33.830453`, Lon `-118.356618` (Source: US Census Bureau 2024 Gazetteer Place internal points, GEOID `0680000`)

### 2. Housing & Cost of Living
- **Sales Tax**: 10.25% (Source: California Department of Tax and Fee Administration - CDTFA base 7.25% + LA County + Torrance local district taxes)
- **Avg Home Value**: $1.12M ($1,117,906) (Source: Zillow Home Value Index - ZHVI, mid-tier all homes, 2026)
- **Cost of Living**: Moderate (Derived post-import from BEA Regional Price Parity via `import-bea-rpp.ts` & `sync-col-index-from-rpp.ts`)
- **Gas Price**: $4.65 (Source: AAA Retail Gasoline Averages for CA / Los Angeles Metro, August 2026)

### 3. Retail & Amenities
- **HasWalmart**: Yes (Verified locations: Torrance Hawthorne Blvd Store #22015 & Normandie Ave Store #19503)
- **HasCostco**: Yes (Verified location: Torrance Costco Wholesale, 2640 Lomita Blvd)

### 4. Veterans Affairs
- **VA Access**: Yes
- **Nearest VA**: Gardena VA Clinic (1045 W Redondo Beach Blvd, Gardena, CA; ~5 miles from centroid)
- **Nearest VA Hospital**: Tibor Rubin VA Medical Center, Long Beach (~15 miles from centroid)
- *Note: Exact distances recomputed post-import via `scripts/sync-va-facilities.ts`.*

### 5. Weather & Climate
- **Snow Annual**: 0 inches (Source: NOAA NCEI 1991-2020 Normals for Torrance / Long Beach Station)
- **Rain Annual**: 14 inches (Source: NOAA NCEI 1991-2020 Normals)
- **Sunny Days**: 280 days (Source: NOAA Climate Normals & NCEI data)
- **Average Low Winter**: 48°F (Source: NOAA Normals January daily minimum)
- **Average High Summer**: 78°F (Source: NOAA Normals August daily maximum)
- **Humidity Summer**: 70% (Source: NOAA Normals July afternoon relative humidity)
- **Climate**: Coastal Mediterranean

### 6. Politics & Elections
- **CityPolitics**: County-level: Liberal
- **2016 Election**: Clinton (72% total / 76% two-party vote share in Los Angeles County)
- **2024 Election**: Harris (65% total / 67% two-party vote share in Los Angeles County)
- **Election Change**: 9.2 pp more Republican since 2016
- **rep_vote_share_change_pp**: 9.18
- **dem_vote_share_change_pp**: -9.18
- *Source: Los Angeles County Registrar-Recorder / MEDSL election database.*

### 7. Safety & LGBTQ Policy
- **TCI (Total Crime Index)**: 70 (Indexed to US average = 100; Torrance violent crime ~1.8 per 1,000 is well below US average)
- **Crime Rating**: Low
- **LGBTQ Rating**: High State Policy Score
- **LGBTQ_MEI**: Not Rated (HRC MEI does not individually rate Torrance; California state FEHA non-discrimination laws provide full high policy protection)
- **LGBTQSource**: CA State MAP Policy Score (High); HRC MEI does not rate Torrance

### 8. Economic Hubs & Curation
- **TechHub**: Y (Major South Bay aerospace, robotics, automotive R&D, and engineering center)
- **DefenseHub**: N (Mapped to `defense_hub_manual = false`; derived via `scripts/recompute-defense-hub.ts`)
- **Tags**: `["Beaches", "Healthcare", "Arts", "Culture", "Coastal", "Low Taxes"]`
- **Description**: Torrance is a coastal South Bay city in Los Angeles County known for its temperate climate, low local crime rates, and proximity to Pacific ocean beaches. It features major medical centers, retail centers like the Del Amo Fashion Center, and strong technology and manufacturing employers.
