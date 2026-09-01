# Minot, ND Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Minot AFB — 5th Bomb Wing B-52H; 91st Missile Wing Minuteman III ICBM).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Ward County seat. 2020 Census place 48,377 (2023 ACS est. 47,373); density ~1,747/sq mi. Source: https://en.wikipedia.org/wiki/Minot,_North_Dakota |
| Coordinates | City centroid 48.2376, -101.2790 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 7.5% = 5% ND + 0.5% Ward County + 2% city (Minot AFB jurisdiction differs). Sources: https://www.tax.nd.gov/ , https://www.avalara.com/us/en/taxrates/state-rates/north-dakota/cities/minot.html |
| Cost of living | CostOfLiving=87 from BEA RPP cache, Minot, ND MSA (33500) 2024 all-items 87.028. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $282,148, as of 6/30/2026. Source: https://www.zillow.com/home-values/12765/minot-nd/ |
| VA access | Minot VA Clinic (CBOC, Fargo VA HCS), in-city (Southside Plaza, 3400 S Broadway); nearest VAMC Fargo ~250 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.veterans.nd.gov/news/new-minot-va-clinic-opens-new-location-dec-14 |
| Politics and elections | Ward County (county proxy). 2016 Trump two-party 76.2% (18,636/5,806); 2024 Trump two-party 74.1% (20,635/7,215); rep -2.2 / dem +2.2 (two-party). NOTE: on total-vote share the county moved +4 pp toward Trump (2016 third-party collapse); the two-party delta is the recorded value. Source: https://en.wikipedia.org/wiki/Ward_County,_North_Dakota |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency ND0510200 (Minot PD), 2024 annual violent rate 312.5/100k, / 359.1 * 100 = 87 -> "Moderate". Source: https://cde.ucr.cjis.gov/ (agency ND0510200). |
| LGBTQ | HRC MEI: Minot IS scored, total 0/100 (per HRC municipality database; MEI cycle/year not shown on the page — confirm against dated scorecard). State policy MAP North Dakota "Low". CSV stores LGBTQ=0, LGBTQ_MEI=0. Sources: https://www.hrc.org/resources/municipalities/minot-nd , https://www.lgbtmap.org/equality_maps/profile_state/ND |
| Climate | Humid continental (Koppen Dfb), borderline cold semi-arid. Snow ~52 (NOAA 1991-2020, Experiment Station; airport ~47); precip ~19; Jan avg low ~1 (monthly normal, not sub-zero; airport ~4); Jul avg high ~80 (airport ~82). SunnyDays 204 and summer humidity ~62 are secondary. Station choice (Experiment Station vs airport) shifts values ~3-5 units. Source: https://en.wikipedia.org/wiki/Minot,_North_Dakota |
| Gas | AAA Minot metro regular ~$3.98, Aug 2026 (ND statewide ~$3.90; volatile). Source: https://gasprices.aaa.com/?state=ND |
| Amenities | Walmart Supercenter #1636 (Y). No Costco (nearest Bismarck ~110 mi). Sources: https://www.walmart.com/store/1636-minot-nd , https://www.costco.com/sitemaps/warehouses-by-state/ND |
| Base and defense context | DefenseHub=Y: Minot AFB (5th Bomb Wing B-52H; 91st Missile Wing Minuteman III). Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | ND fully exempts military retirement pay from state income tax (eff. TY2019); Disabled Veterans Property Tax Credit (first $9,000 taxable homestead valuation, 50%+ rating). Source: https://www.tax.nd.gov/property-tax-exemptions-credits/property-tax-credits/disabled-veterans-property-tax-credit |

Post-import: import from master; then import-bea-rpp.ts --skip-download, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Minot, ND".
