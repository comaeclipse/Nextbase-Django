# Tampa, FL Sources

Retrieved: 2026-08-31. Base-adjacent candidate for issue #1 (MacDill AFB — U.S. Central Command / U.S. Special Operations Command).

| Field | Source and note |
| --- | --- |
| Identity, population, density | City of Tampa, Hillsborough County. Census Reporter ACS 2024 1-year: 414,575 residents, ~3,621/sq mi (114.5 sq mi land). Source: https://censusreporter.org/profiles/16000US1271000-tampa-fl/ |
| Coordinates | City centroid 27.9475, -82.4584 (Wikipedia; map crosswalk uses Census Gazetteer internal point). |
| Taxes | Combined sales tax 7.5% = 6.0% FL + 1.5% Hillsborough surtax. Source: https://www.salestaxhandbook.com/florida/rates/hillsborough-county |
| Cost of living | CostOfLiving=101 from BEA RPP cache, Tampa-St. Petersburg-Clearwater MSA (45300) 2024 all-items 100.890. Standardized post-import by sync-col-index-from-rpp.ts. |
| Housing | Zillow ZHVI $374,888, ~Aug 2026. Source: https://www.zillow.com/home-values/41176/tampa-fl/ |
| VA access | James A. Haley Veterans' Hospital (VAMC), 13000 Bruce B Downs Blvd; outpatient clinics closer in-city. Recomputed post-import by sync-va-facilities.ts. Source: https://www.va.gov/tampa-health-care/locations/james-a-haley-veterans-hospital/ |
| Politics and elections | Hillsborough County (county-level; city leans more Democratic). 2016 Clinton two-party 53.57%; 2024 Trump two-party 51.55% (county flipped); rep +5.1 / dem -5.1. Sources: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Florida , Hillsborough Supervisor of Elections (cross-check certified canvass). |
| Crime (TCI) | Open violent-crime proxy: FBI Crime Data Explorer agency FL0290200 (Tampa Police Department), 2024 monthly rates summed to an annual violent rate of 443.2/100k, ÷ FBI 2024 national violent rate 359.1 × 100 = 123 → "Moderate". Property (bonus) ~1,473/100k. Source: https://cde.ucr.cjis.gov/ (agency FL0290200). |
| LGBTQ | HRC MEI 2024 = 100 (Tampa retained a perfect score). State policy: MAP Florida "Negative" (-5.5/49). Sources: https://reports.hrc.org/municipal-equality-index-2024 , https://www.mapresearch.org/equality-maps/profile_state/FL |
| Climate | NOAA 1991-2020 normals, Tampa Intl USW00012842: annual precip 49.48 in → 49; Jan avg low 52.8°F → 53; Aug avg high 91.2°F → 91; snow 0. SunnyDays 246 (BestPlaces, secondary); July daily-avg humidity 77 (currentresults). Source: https://en.wikipedia.org/wiki/Climate_of_the_Tampa_Bay_area |
| Gas | AAA FL statewide regular ~$3.89, 2026-08-31 (Tampa metro within a few cents; refresh at import). Source: https://gasprices.aaa.com/?state=FL |
| Amenities | Walmart Supercenters present (Y). Costco #1262 in-city (Y), 8712 W Linebaugh Ave. Sources: https://www.walmart.com/store/2627-tampa-fl , https://www.costco.com/warehouse-locations/w-tampa-tampa-fl-1262.html |
| Base and defense context | DefenseHub=Y: MacDill AFB (CENTCOM/SOCOM, 6th Air Refueling Wing) on the Interbay peninsula, in city limits. TechHub=Y is an editorial judgment (Tampa Bay finance/tech cluster). Derived defense_hub recomputed post-import. Source: https://www.macdill.af.mil/ |
| Veterans benefits (state-owned, not imported) | FL no income tax; homestead up to $50,000; disabled-veteran exemptions incl. full homestead for 100% P&T. Sources: https://floridavets.org/benefits-services/property-tax-exemptions/ , https://floridarevenue.com/property/Pages/Taxpayers_Exemptions.aspx |

Post-import: import from master; then sync-va-facilities.ts, sync-col-index-from-rpp.ts, recompute-defense-hub.ts, sync-military-proximity.ts, verify-location-completeness.ts --name "Tampa, FL".
