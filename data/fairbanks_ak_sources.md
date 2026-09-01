# Fairbanks, AK Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Fort Wainwright, Army; Eielson AFB ~26 mi SE).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Fairbanks North Star Borough (county-equivalent) hub. 2020 Census place 32,515 (borough 95,655); density ~1,024/sq mi. Source: https://en.wikipedia.org/wiki/Fairbanks,_Alaska |
| Coordinates | City centroid 64.8436, -147.7231 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | SalesTax 0.0 — Alaska has no state sales tax and neither Fairbanks city nor the borough levies a general sales tax. Source: https://www.commerce.alaska.gov/web/dcra/ |
| Cost of living | CostOfLiving=103 from BEA RPP cache, Fairbanks-College, AK MSA (21820) 2024 all-items 103.208 (highest in this batch). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $286,692, 2026 (+4.4% YoY). Source: https://www.zillow.com/home-values/38465/fairbanks-ak/ |
| VA access | Fairbanks VA Clinic (CBOC, Alaska VA HCS), in-city (moved 2023 to 2555 Phillips Field Rd; historically co-located at Bassett Army Community Hospital, Fort Wainwright); nearest VAMC Anchorage ~260 air mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/directory/guide/facility.asp?id=5128 |
| Politics and elections | Fairbanks North Star Borough (county-equivalent proxy; AK reports by House district). 2016 Trump two-party 62.0% (22,012/13,494 — Wikipedia FNSB presidential-results table); 2024 Trump two-party 59.3% (24,857/17,037, borough table); rep -2.7 / dem +2.7. Sources: https://en.wikipedia.org/wiki/Fairbanks_North_Star_Borough,_Alaska , https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Alaska |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency AK0010200 (Fairbanks PD), 2024 annual violent rate 726.1/100k, / 359.1 * 100 = 202 -> "High". Source: https://cde.ucr.cjis.gov/ (agency AK0010200). |
| LGBTQ | HRC MEI 2024 = 66/100 (verified from the Fairbanks 2024 MEI scorecard PDF: NDL 30, employer 15, services 5, law enforcement 12, leadership 4). AK has no statewide LGBTQ nondiscrimination law; 7 AK cities are MEI-rated. CSV stores LGBTQ=66, LGBTQ_MEI=66. Sources: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-24-Scorecards/MEI-2024-Fairbanks-Alaska.pdf , https://www.hrc.org/resources/mei-state/alaska |
| Climate | Subarctic (Koppen Dfc; city proper borders Dfb). Snow ~65 (64.6 in, NOAA 1991-2020, Fairbanks Intl); precip ~12 (11.67 in); Jan avg low -17; Jul avg high 73. SunnyDays 155 (secondary) and summer humidity ~64 (NOAA 1961-1990 daily-mean July RH) are secondary/low-confidence. Source: https://en.wikipedia.org/wiki/Fairbanks,_Alaska |
| Gas | AAA AK statewide regular ~$4.89, 2026-08-31. Source: https://gasprices.aaa.com/?state=AK |
| Amenities | Walmart Supercenter #2722 (Y). Costco YES — 48 College Rd, Fairbanks (only city in this batch with a Costco). Sources: https://www.walmart.com/store/2722-fairbanks-ak , https://www.costco.com/sitemaps/warehouses-by-state/AK |
| Base and defense context | DefenseHub=Y: Fort Wainwright (Army) + Eielson AFB (~26 mi SE). Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | AK has no state income tax (military retirement untaxed) + annual Permanent Fund Dividend; disabled-veteran property-tax exemption on first $150,000 assessed value for 50%+ service-connected disability (AS 29.45.030(e)). Source: https://www.commerce.alaska.gov/web/dcra/LocalGovernmentResourceDesk/TaxationAssessment/PropertyTaxExemptionsinAlaska.aspx |

Post-import: import from master; then import-bea-rpp.ts --skip-download, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Fairbanks, AK".
