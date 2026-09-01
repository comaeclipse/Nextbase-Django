# Fallon, NV Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (NAS Fallon — Naval Aviation Warfighting Development Center / TOPGUN).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Churchill County seat, Lahontan Valley (elev ~3,965 ft). 2020 Census place 9,327; density ~2,513/sq mi. Source: https://www.census.gov/quickfacts/fact/table/falloncitynevada/PST045225 |
| Coordinates | City centroid 39.4735, -118.7774 (Census place internal point; NOAA station at 39.4572, -118.7811). |
| Taxes | Combined sales tax 7.60% = 4.6% NV + 3.0% Churchill County; 0% city. Source: https://www.avalara.com/taxrates/en/state-rates/nevada/cities/fallon.html |
| Cost of living | CostOfLiving=95 from BEA RPP cache, Nevada nonmetropolitan portion (32999) 2024 all-items 94.819 (Churchill County is not in a BEA MSA). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $352,431, retrieved 2026-08-31 (down 5.6% YoY). Source: https://www.zillow.com/home-values/38482/fallon-nv/ |
| VA access | Lahontan Valley VA Clinic (CBOC, Sierra Nevada VA HCS), in-city (1020 New River Pkwy); nearest VAMC Reno ~60 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/sierra-nevada-health-care/about-us/ |
| Politics and elections | Churchill County (county proxy). 2016 Trump two-party 78.0% (7,830/2,210); 2024 Trump two-party 75.8% (certified NV SoS: 9,962/3,179); rep -2.2 / dem +2.2. Sources: https://silverstateelection.nv.gov/USPresidential/index.shtml , https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Nevada |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency NV0010100 (Fallon PD), 2024 annual violent rate 207.0/100k, / 359.1 * 100 = 58 -> "Low". Source: https://cde.ucr.cjis.gov/ (agency NV0010100). |
| LGBTQ | Not HRC MEI-scored (pop ~9k). State policy MAP Nevada "High" (SOGI nondiscrimination + constitutional protections). CSV stores "Not Rated". Sources: https://www.hrc.org/resources/municipal-equality-index , https://www.lgbtmap.org/equality-maps/profile_state/NV |
| Climate | Cold desert / high desert (Koppen BWk), arid. Snow ~5 (NOAA 1991-2020 raw 4.5 in, USC00262780); precip ~5 (4.77 in); Jan avg low 20; Jul avg high 94. SunnyDays 250 (secondary; very clear high desert) and summer humidity ~19 (WeatherSpark MERRA-2, modeled) are secondary. Source: NCEI 1991-2020 normals station USC00262780 (FALLON EXP STN). |
| Gas | AAA NV statewide regular ~$4.84, 2026-08-31 (Reno metro $5.07; Fallon not separately surveyed). Source: https://gasprices.aaa.com/?state=NV |
| Amenities | Walmart Supercenter #2453 (Y). No Costco (nearest Reno ~60 mi). Sources: https://www.walmart.com/store/2453-fallon-nv , https://www.costco.com/warehouse-locations |
| Base and defense context | DefenseHub=Y: NAS Fallon (NAWDC/TOPGUN). Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | NV has no state income tax (military retirement, VA disability, SS all untaxed); disabled-veteran property-tax exemption scaling with rating (60%+), filed with county assessor. Source: https://veterans.nv.gov/ (NRS 361.090-361.091). |

Post-import: import from master; then import-bea-rpp.ts --skip-download, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Fallon, NV".
