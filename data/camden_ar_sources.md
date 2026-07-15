# Camden, AR source notes

Retrieval date: 2026-07-15.

## Geography and population

- Primary geography is Camden city, Ouachita County, Arkansas (Census place GEOID `0510720`).
- Population is the Census QuickFacts July 1, 2025 estimate: 10,127.
- Density is calculated from that population and the Census 2024 Gazetteer land area: 16.526 square miles, or 613 people per square mile after rounding.
- The map coordinate is the Census 2024 Gazetteer internal point, 33.567672, -92.849064.

## Cost, taxes, and housing

- Housing is Zillow's Camden Zillow Home Value Index: $112,201, data through 2026-05-31. The database field is named `avg_home_value`, but the display and notes identify it as a Zillow typical home value.
- The cost-of-living index is 81 (U.S. average = 100) from AreaVibes. It is a directional, modeled comparison, so it is not used as a substitute for primary-source tax or housing data.
- Camden's April-June 2026 local sales/use rate is 4.25% (1.75% city plus 2.50% Ouachita County). The 10.75% value stored in the row adds Arkansas's 6.5% state rate.
- `income_tax` is the 2026 top individual rate, 3.7%. Military retired pay is exempt at the state level; that benefit remains represented in `locations_stateinfo` and is summarized for the city card only for context.

## Climate

- NOAA station `USC00031152` (CAMDEN 1, AR) is the representative city station. Its 1991-2020 normals report 53.12 inches of annual precipitation, 1.5 inches of annual snow, a January normal low of 31.2 F, and July/August normal highs of 91.9/92.0 F. Stored values are rounded to 53 inches rain, 2 inches snow, 31 F winter low, and 92 F summer high.
- NOAA's station-normal output does not provide a comparable summer relative-humidity normal, so `humidity_summer` and `sun_days` remain blank. `climate_category` is set with a documented, narrowly scoped update to `hot_humid`, consistent with the sourced humid-subtropical climate and hot, wet summers; this avoids incorrectly applying the generic `mild_coastal` fallback for missing humidity.

## VA access and veterans benefits

- There is no VA facility in Camden. The VA Central Arkansas locations directory lists the El Dorado VA Clinic at 1702 North West Avenue, El Dorado. The city row records that clinic and a rounded 30-mile road-distance estimate from Camden; users should verify travel time for their address and care needs.
- Arkansas state benefit wording is aligned with the existing state row, which is the canonical location for state-level benefits.

## Politics and social policy

- City-level presidential returns were not found in a comparable official format, so the political label and vote fields use Ouachita County and are explicitly marked county-level. In 2016, Trump received 5,351 votes and Clinton 4,321; in 2024, Trump received 5,056 and Harris 3,412. The stored percentages are the winning candidate's two-party share, rounded to whole numbers: 55% and 60%. The Republican two-party change is +4.4 percentage points.
- Arkansas has a regulated medical-marijuana program. No city-specific MEI score or LGBTQ policy score was found, so those fields remain blank.
- Crime fields remain blank pending a source-comparable, city-level violent-crime rate and methodology.

## Defense and lifestyle

- The live `defense_employer_locations` data already has an active Raytheon/RTX careers entry for `Camden, AR` with onsite hiring signal. It links automatically when this city is inserted, then `scripts/recompute-defense-hub.ts` derives `defense_hub` from that physical-employer signal.
- Separately, RTX and Rafael announced a SkyHunter/Tamir missile-production facility in neighboring East Camden. This is intentionally described as neighboring East Camden rather than silently treated as a Camden city-limits facility.
- The City of Camden describes the city as located on a bluff above the Ouachita River, which supports the fishing/river-access description and tag.

## Source URLs

- Census QuickFacts Camden city: https://www.census.gov/quickfacts/fact/table/camdencityarkansas/PST045225
- Census 2024 Gazetteer place file: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
- Zillow Camden ZHVI: https://www.zillow.com/home-values/89172/camden-ar-71711/
- AreaVibes Camden cost of living: https://www.areavibes.com/camden-ar/cost-of-living/
- Arkansas DFA city/county sales-tax rate page: https://www.dfa.arkansas.gov/office/taxes/excise-tax-administration/sales-use-tax/sales-use-tax-rates/city-and-county-sales-use-tax-rates/
- Arkansas DFA April-June 2026 local-rate table: https://www.dfa.arkansas.gov/wp-content/uploads/city_county_listing_01-APRIL-JUNE-2026.pdf
- Arkansas 2026 individual withholding tables: https://www.dfa.arkansas.gov/wp-content/uploads/withholdTaxTablesRegularIncome_2026.pdf
- VA Central Arkansas locations directory: https://www.va.gov/central-arkansas-health-care/locations/
- NOAA 1991-2020 Camden station normals: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USC00031152&format=json&units=standard&includeAttributes=false
- Arkansas Secretary of State election-results archive: https://www.sos.arkansas.gov/elections/research/election-results
- 2016 Ouachita County presidential totals (with state archive provenance): https://uselectionatlas.org/RESULTS/state.php?fips=5&year=2016
- 2024 Ouachita County presidential totals: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Arkansas
- Arkansas Department of Health medical-marijuana program: https://healthy.arkansas.gov/programs-services/data-statistics-registries/medical-marijuana/qualified-patient-requirements/
- RTX/Rafael East Camden facility announcement: https://apnews.com/article/8bbc9786b3cf5517234f7f2e1a9f91ee
- City of Camden visitor page: https://www.explorecamden.com/o/camdencity/page/open-visitor-page
