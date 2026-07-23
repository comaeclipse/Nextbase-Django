# Fresno, CA Data Sources and Provenance

## Geography & Demographics
- **Population**: 542,107
- **Density**: 4,726 people per sq mile
- **Source**: 2020 U.S. Census data for Fresno City limits. [Census QuickFacts](https://www.census.gov/quickfacts/fresnocitycalifornia) (Retrieved 2026-07-23)

## Housing & Cost of Living
- **Avg Home Value**: $392,929
- **Source**: Zillow Home Value Index (ZHVI), June 2026. [Zillow Fresno](https://www.zillow.com/home-values/18203/fresno-ca/) (Retrieved 2026-07-23)
- **CostOfLiving**: 105 (Index)
- **Source**: RentCafe 2025-2026 cost of living index (Overall index: 105% of national average). [RentCafe Fresno Cost of Living](https://www.rentcafe.com/cost-of-living/us/ca/fresno/) (Retrieved 2026-07-23)

## Climate & Weather
- **Normals**: NOAA NCEI U.S. Climate Normals (1991-2020) for Fresno station.
- **Values**: 0" snow, 12" rain, 38 F Jan average low, 102 F July average high.
- **Summer Humidity**: ~21% in July afternoon.
- **Source**: [Weather.gov Fresno Climate](https://www.weather.gov/hnx/fresnoclimate) (Retrieved 2026-07-23)

## Politics (City-Level)
- **2016 Election (City)**: Clinton 57.22% / Trump 37.35%.
- **2024 Election (City)**: Harris 52.72% / Trump 44.50%.
- **Source**: Fresno County Statement of Vote, Precinct level aggregations. [Fresno County Elections / Past Results](https://www.fresnocountyca.gov/Departments/County-ClerkRegistrar-of-Voters/Elections/Past-Elections) (Retrieved 2026-07-23). Exact PDF URLs for the Statement of Vote vary by year, so this links to the general archive page where they can be downloaded.

## Safety & Policy
- **TCI & Crime**: TCI estimated at 193. Derived from FBI CDE violent crime rate (approx 735.5 per 100k). Formula used: (735.5 / 380 U.S. average) * 100 = 193.5 (rounded to 193). Local news and official press releases from early 2026 also noted recent homicide rate drops, but the baseline index relies on the standardized FBI data. [FBI Crime Data Explorer](https://cde.ucr.cjis.gov/LATEST/webapp/#/pages/explorer/crime/city-crime) and [Fresno PD Stats](https://www.fresno.gov/police/) (Retrieved 2026-07-23).
- **LGBTQ**: HRC MEI Score of 95. [HRC Fresno 2025 MEI PDF](https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Fresno-California.pdf) (Retrieved 2026-07-23)
- **State Policy Score**: MAP California profile overall policy score 45/49. [MAP California](https://mapresearch.org/equality-profiles/ca/) (Retrieved 2026-07-23)

## Veterans Affairs
- **VA Center**: Fresno VA Medical Center located at 2615 East Clinton Avenue. [VA Fresno Medical Center](https://www.va.gov/central-california-health-care/locations/fresno-va-medical-center/) (Retrieved 2026-07-23). The "0 miles" distance recorded in the data is used as an "in-city VA facility" convention rather than a measured route distance.
- **Benefits**: California state tax laws regarding military retirement pay and property tax exemptions. [CalVet Property Tax Exemptions](https://www.calvet.ca.gov/VetServices/Pages/Property-Tax-Exemptions.aspx) and [CA FTB Military Tax Rules](https://www.ftb.ca.gov/file/personal/income-types/military.html) (Retrieved 2026-07-23)

## Economic Hubs
- **Defense Hub**: Kept blank (null) in the source data. This indicates that a hub status is "not established from available defense-employer evidence," rather than being a confirmed negative veto (which would be explicitly marked as `false`).

## Taxes & Utilities
- **Sales Tax**: 8.35%. [Avalara Fresno](https://www.avalara.com/us/en/taxrates/state-rates/california/cities/fresno.html) (Retrieved 2026-07-23)
- **Gas Price**: $5.489. [AAA California gas prices](https://gasprices.aaa.com/?state=CA) (Retrieved 2026-07-23)
