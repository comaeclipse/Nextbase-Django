# Key West, FL Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (NAS Key West — fighter adversary / air-defense training).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Monroe County seat; southernmost city in the continental US. 2020 Census place 26,444; density ~4,723/sq mi. Source: https://en.wikipedia.org/wiki/Key_West |
| Coordinates | City centroid 24.5550, -81.7819 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 7.5% = 6.0% FL + 1.5% Monroe County discretionary surtax (surtax on first $5,000 of a single item). Source: https://www.avalara.com/us/en/taxrates/state-rates/florida/cities/key-west.html |
| Cost of living | CostOfLiving=94 from BEA RPP cache, Florida nonmetropolitan portion (12999) 2024 all-items 93.951 (Monroe County is not in a BEA MSA). NOTE: the island's true cost of living runs well above this nonmetro figure (typical home >$1M); standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $1,095,596, 2026 (up 2.4% YoY) — least affordable in this batch. Source: https://www.zillow.com/home-values/52767/key-west-fl/ |
| VA access | Key West VA Clinic (CBOC, Miami VA Healthcare System), in-city; nearest VAMC Bruce W. Carter (Miami) ~160 mi. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/miami-health-care/locations/key-west-va-clinic/ |
| Politics and elections | Monroe County (county proxy; Key West city itself is a liberal/LGBTQ enclave that votes left of the county — precinct returns not pulled). 2016 Trump two-party 53.59%; 2024 Trump two-party 59.24%; rep +5.7 / dem -5.7. Source: https://en.wikipedia.org/wiki/Monroe_County,_Florida |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency FL0440100 (Key West PD), 2024 annual violent rate 352.3/100k, / 359.1 * 100 = 98 -> "Moderate". Source: https://cde.ucr.cjis.gov/ (agency FL0440100). |
| LGBTQ | No Key West HRC MEI scorecard verified (leave "Not Rated"). State policy MAP Florida "Negative". Key West city is a nationally known LGBTQ destination despite the negative state tally. Sources: https://www.hrc.org/resources/municipal-equality-index , https://www.mapresearch.org/equality_maps/profile_state/FL |
| Climate | Tropical savanna (Koppen Aw) — only true tropical climate in the continental US. Snow 0; annual precip 40 (NOAA 1991-2020, EYW); Jan avg low 66; Jul avg high 90. SunnyDays ~281 (derived from Wikipedia sunshine %) and summer humidity ~72 are secondary/convention-dependent. Sources: https://www.weather.gov/media/key/Climate/Florida-Keys-Monthly-Normals_1991-2020.pdf , https://en.wikipedia.org/wiki/Key_West |
| Gas | Monroe County AAA regular ~$4.16, late-Aug 2026 (Keys run well above the FL state avg $3.88). Sources: https://www.orlandoweekly.com/news/florida-news/ , https://gasprices.aaa.com/?state=FL |
| Amenities | No Walmart on the island (nearest Florida City ~130 mi). No Costco (nearest Miami-Dade). Sources: https://www.tripadvisor.com/ShowTopic-g34345-i53-k2866586-Where_Is_Walmart-Key_West_Florida_Keys_Florida.html |
| Base and defense context | DefenseHub=Y: NAS Key West. Derived defense_hub recomputed post-import. |
| Veterans benefits (state-owned, not imported) | FL has no state income tax (military retirement untaxed); homestead exemption up to $50k; disabled-vet property-tax breaks incl. full exemption for 100% P&T, combat-disability discount for vets 65+. Source: https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx |

Post-import: import from master; then import-bea-rpp.ts --skip-download, sync-col-index-from-rpp.ts, sync-va-facilities.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Key West, FL".
