# Palo Alto, CA Source Notes

Retrieval date: 2026-08-31.

## Scope

Candidate city ingestion (`geo_type='city'`, `is_candidate=true`) for Palo Alto, CA (Santa Clara County).

## Identity & Geography

- **City**: Palo Alto
- **State**: CA
- **County**: Santa Clara
- **Population**: 68,572 (ACS 5-Year 2022/2023, reported as `69k`).
- **Land Area**: 23.88 sq mi.
- **Density**: 2,871 per sq mi (68,572 / 23.88 sq mi).
- **Coordinates**: Latitude 37.4419, Longitude -122.1430.
- **Sources**:
  - U.S. Census Bureau ACS 5-Year Population Estimates: https://www.census.gov/quickfacts/fact/table/paloaltocitycalifornia/PST045223
  - U.S. Census Bureau Gazetteer Places 2024.

## Housing

- **Average Home Value**: $3,150,000–$3,200,000 (Zillow Home Value Index mid-tier, display `$3.2M`).
- **Source**: Zillow Research ZHVI (Palo Alto, CA All Homes): https://www.zillow.com/home-values/40149/palo-alto-ca/

## Taxes & Cost of Living

- **Sales Tax**: 9.25% (7.25% California base + 2.00% Santa Clara County district taxes).
  - Source: California Department of Tax and Fee Administration (CDTFA): https://www.cdtfa.ca.gov/taxes-and-fees/rates.aspx
- **Gas Price**: $4.69/gal (Bay Area retail average).
  - Source: AAA Gas Prices California: https://gasprices.aaa.com/?state=CA
- **Cost of Living (`col_index`)**: Post-import derivation via BEA Regional Price Parities (San Jose-Sunnyvale-Santa Clara MSA RPP ~117-125, `High`).

## Veterans Affairs (VA)

- **Has VA**: `Y`
- **Nearest VA**: Palo Alto VA Medical Center (VA Palo Alto Health Care System, 3801 Miranda Ave, Palo Alto, CA 94304).
- **Distance to VA**: `0 miles` (in-city facility).
- **Nearest VA Kind**: `hospital`.
- **Veterans Benefits**: California exempts up to $20,000 of military retired pay from state income tax beginning tax year 2025 (returns filed after Jan 1, 2026) for qualifying filers; 100% disabled veterans property tax exemption up to $180,671 ($271,009 for low-income); untaxed VA disability compensation; CalVet home loans and state veteran homes.
  - Source: VA Palo Alto Health Care System: https://www.va.gov/palo-alto-health-care/locations/palo-alto-va-medical-center/
  - Source: California Department of Veterans Affairs (CalVet): https://www.calvet.ca.gov/

## Weather & Climate

- **Snow**: 0 in/yr.
- **Rain**: 16 in/yr.
- **Sunny Days**: 261 days/yr.
- **Average Low Winter**: 41 °F (January low).
- **Average High Summer**: 78 °F (July/August high).
- **Humidity Summer**: 55%.
- **Climate**: Mediterranean.
- **Source**: NOAA NCEI 1991-2020 U.S. Climate Normals (Station: Palo Alto / San Jose area): https://www.ncei.noaa.gov/access/us-climate-normals/

## Politics & Elections

- **County**: Santa Clara County, CA
- **2016 Presidential Election (Santa Clara County)**:
  - Clinton: 511,684 (77.90% two-party)
  - Trump: 144,826 (22.10% two-party)
- **2024 Presidential Election (Santa Clara County)**:
  - Harris: 518,876 (73.95% two-party)
  - Trump: 182,752 (26.05% two-party)
- **Two-Party Shift**:
  - `rep_vote_share_change_pp` = 26.05 - 22.10 = `+4.00`
  - `dem_vote_share_change_pp` = 73.95 - 77.90 = `-4.00`
  - `ElectionChange`: `4.0 pp more Republican since 2016`
- **City Politics**: `Strongly Liberal` (Palo Alto city precincts consistently D 75%+).
- **Sources**:
  - California Secretary of State Statement of Vote (2016 & 2024): https://www.sos.ca.gov/elections/prior-elections/statewide-election-results
  - MIT Election Data and Science Lab (MEDSL): https://electionlab.mit.edu/data

## Safety & Social Policy

- **Crime Rate & TCI**: FBI UCR Palo Alto violent crime rate ~230 per 100,000 (35.9% below national baseline of 359.1 per 100,000). Derived TCI = 64 (`Low`).
  - Source: FBI Crime Data Explorer: https://cde.ucr.cjis.gov/
- **LGBTQ Rating**: `Strongly Inclusive` (MEI Score: 100/100).
  - Source: Human Rights Campaign 2024 Municipal Equality Index: https://www.hrc.org/resources/municipal-equality-index

## Economic Hubs & Amenities

- **TechHub**: `Y` (Silicon Valley epicenter, Stanford University, HP, tech research hubs).
- **DefenseHub**: `N` (curated manual judgment `N`; no primary contractor plant / defense cluster).
- **HasWalmart**: `N` (No Walmart inside Palo Alto city limits).
- **HasCostco**: `N` (No Costco inside Palo Alto city limits).
- **Tags**: `["Tech", "Healthcare", "Culture", "Arts", "Education", "Golf"]`
- **Description**: "Palo Alto is a premier Silicon Valley city anchored by Stanford University, world-class healthcare including a major VA Medical Center, pleasant Mediterranean climate, and vibrant downtown districts."
