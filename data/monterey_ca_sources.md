# Monterey, CA Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (Presidio of Monterey / Defense Language Institute, Naval Postgraduate School, NSA Monterey).

| Field | Source and note |
| --- | --- |
| Identity, population, density | Monterey County. Census Reporter ACS 2024 5-year: 29,613 residents; density 3,496/sq mi over 8.645 sq mi (2020 basis). Sources: https://censusreporter.org/profiles/16000US0648872-monterey-ca/ , https://en.wikipedia.org/wiki/Monterey,_California |
| Coordinates | City centroid 36.6031, -121.8936 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 9.25% (state+county+city+district) for the city of Monterey. Source: https://cdtfa.ca.gov/taxes-and-fees/rates.aspx |
| Cost of living | CostOfLiving=109 from BEA RPP cache, Salinas MSA (41500) 2024 all-items 109.042 (highest in this batch, housing-driven). Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $1,180,394, ~Jun 2026 (real figure — over $1.1M). Source: https://www.zillow.com/home-values/19434/monterey-ca/ |
| VA access | Major General William H. Gourley VA-DoD Outpatient Clinic, 201 9th St, Marina (~8 mi; VA Palo Alto system); nearest VA medical center is VA Palo Alto (~70 mi). Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/palo-alto-health-care/locations/major-general-william-h-gourley-va-dod-outpatient-clinic/ |
| Politics and elections | Monterey County (county-level). 2016 Clinton two-party 71.9%; 2024 Harris two-party 65.4%; rep +6.5 / dem -6.5. Sources: https://en.wikipedia.org/wiki/Monterey_County,_California , https://ballotpedia.org/Monterey_County,_California,_elections,_2024 (cross-check CA SoS Statement of Vote). |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency CA0270600 (Monterey Police Department), 2024 monthly rates summed to an annual violent rate of 385.5/100k, ÷ 359.1 × 100 = 107 → "Moderate". Property (bonus) ~1,799/100k. Source: https://cde.ucr.cjis.gov/ (agency CA0270600). |
| LGBTQ | Not HRC MEI-scored (nearby Salinas is). State policy: MAP California "High" (strong statutory protections). CSV stores "Not Rated". Sources: https://www.hrc.org/resources/mei-state/california , https://www.lgbtmap.org/equality-maps/profile_state/CA |
| Climate | usclimatedata (coastal Csb): Jan low ~44°F, warmest-month high ~70°F (fog-cooled summers), ~21 in rain, 0 snow. SunnyDays 267 (BestPlaces, secondary); summer humidity 75 (Weather Atlas, secondary). Source: https://usclimatedata.com/climate/monterey/california/united-states/usca0724 |
| Gas | AAA Salinas (Monterey County) metro regular ~$5.84, 2026-08-31 (California prices high; refresh at import). Source: https://gasprices.aaa.com/?state=CA |
| Amenities | Walmart in-city (Y), 799 Lighthouse Ave. Costco Sand City (Y, ~3 mi), 801 Tioga Ave. Sources: https://www.walmart.com/store/90823-monterey-ca , https://www.costco.com/warehouse-locations/sand-city-ca-131.html |
| Base and defense context | DefenseHub=Y: Presidio of Monterey (DLI), Naval Postgraduate School, Naval Support Activity Monterey (Fort Ord closed under BRAC 1994). Derived defense_hub recomputed post-import. Source: https://en.wikipedia.org/wiki/Monterey,_California |
| Veterans benefits (state-owned, not imported) | CA partial exclusion of up to $20,000 military retirement/SBP income beginning TY2025 (AGI-limited); prior to 2025 CA fully taxed it. Disabled Veterans' Property Tax Exemption for 100%/unemployability-rated veterans. Sources: https://lao.ca.gov/LAOEconTax/Article/Detail/820 , https://www.boe.ca.gov/proptaxes/disabled-veteran-exemption.htm |

Post-import: import from master; then sync-va-facilities.ts, sync-col-index-from-rpp.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Monterey, CA".
