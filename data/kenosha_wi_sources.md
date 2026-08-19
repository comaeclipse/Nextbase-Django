# Kenosha, Wisconsin Data Sources

Retrieval date: 2026-08-19

This is a Phase 1 research artifact for the Nextbase ingest workflow. The CSV was validated with the importer in dry-run mode only; no production Neon write was run from this feature branch.

## Core Identity

- City: Kenosha, Wisconsin
- County: Kenosha County
- Coordinates: 42.587526, -87.879996 from local Census/pace-derived centroid data (`kenosha|WI`, GEOID 5539225).
- Population: 99,986 from the 2020 Decennial Census value surfaced by Census QuickFacts for Kenosha city, Wisconsin. Census QuickFacts also listed a July 1, 2025 estimate of 99,239.
- Density: 3,530 people per square mile, using the 2020 city population/density profile.
- Sources:
  - https://www.census.gov/quickfacts/fact/table/kenoshacitywisconsin/PST045225
  - https://en.wikipedia.org/wiki/Kenosha,_Wisconsin

## Cost, Housing, Taxes, And Fuel

- Average home value: $286,557 from Zillow's Kenosha home-values page, updated 2026-07-31.
- Cost of living: 97 from HomeSnacks' Kenosha cost-of-living index, where 100 is the national average. BestPlaces city-level COL was not available in search results; BestPlaces ZIP 53142 surfaced 90.8 and was treated as ZIP-specific context rather than the city value.
- Sales tax: 5.5%, from Avalara's 2026 Kenosha city rate and Kenosha County rate pages; Wisconsin DOR confirms the 5.0% state sales tax and county tax framework.
- Income tax: 7.65%, Wisconsin's top individual income tax rate. This is a legacy compatibility field; state-owned tax fields are normalized separately where available.
- Gas: $3.80, rounded from AAA's Kenosha County regular average of $3.8001 on 2026-08-19.
- Sources:
  - https://www.zillow.com/home-values/39220/kenosha-wi/
  - https://www.homesnacks.com/wi/kenosha-cost-of-living/
  - https://www.avalara.com/us/en/taxrates/state-rates/wisconsin/cities/kenosha.html
  - https://www.avalara.com/us/en/taxrates/state-rates/wisconsin/counties/kenosha-county.html
  - https://www.revenue.wi.gov/Pages/FAQS/pcs-taxrates.aspx
  - https://taxfoundation.org/location/wisconsin/
  - https://gasprices.aaa.com/?state=WI

## Politics

- 2016 county winner: Trump, 50% two-party share. Kenosha County official/Wikipedia county results were Trump 36,037 and Clinton 35,799; two-party Trump share is 50.17%.
- 2024 county winner: Trump, 53% two-party share. Kenosha County official/Wikipedia county results were Trump 47,478 and Harris 41,826; two-party Trump share is 53.16%.
- Shift: 3.0 percentage points more Republican by two-party vote share from 2016 to 2024.
- CityPolitics: "County-level: Lean Conservative; city: Lean Democratic." The election fields are county-level because comparable official city-level presidential time series were not used. Marquette Law School notes the City of Kenosha is the county's only consistently Democratic municipality, which is why the label separates county and city geography.
- StateParty and Governor are legacy compatibility fields only; Wisconsin governor Tony Evers is Democratic.
- Sources:
  - https://www.kenoshacountywi.gov/2364/Election-Results-for-11052024
  - https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Wisconsin
  - https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Wisconsin
  - https://mulawpoll.org/counties/kenosha.html

## Veterans And VA Access

- VA: Yes.
- Nearest VA: Kenosha VA Clinic, in city, 0 miles.
- Wisconsin veteran benefits summary: Wisconsin exempts qualifying military retired pay and related survivor payments from state income tax; state veteran benefits also include a veterans and surviving spouses property-tax credit or disabled-veteran property-tax exemption, Wisconsin G.I. Bill education benefits, state hiring preference, retraining grants, license plates, state park/trail benefits for disabled veterans, and hunting/fishing benefits.
- State-owned benefit fields are normalized in `locations_stateinfo`; the CSV keeps the summary for importer compatibility.
- Sources:
  - https://www.va.gov/lovell-federal-health-care-va/locations/kenosha-va-clinic/
  - https://www.revenue.wi.gov/Pages/FAQS/pcs-military.aspx
  - https://dva.wi.gov/Pages/benefitsClaims/WDVABenefits.aspx

## Public Safety

- TCI: 80, calculated as Kenosha violent crime rate divided by the national violent-crime baseline, multiplied by 100 and rounded: 285.7 / 359.0 * 100 = 79.6.
- CrimeRating: Low, because the violent-crime rate is below the cited national baseline and near existing low-band rows.
- Source:
  - https://www.homesnacks.com/wi/kenosha-crime/

## LGBTQ And Cannabis

- LGBTQ: 52.
- LGBTQ_MEI: 52.
- LGBTQ source: HRC 2025 Municipal Equality Index Kenosha scorecard. The scorecard search result reports total flex score 2 and total score 52.
- LGBTQStatePolicyScore is blank because the current Wisconsin normalized row has no MAP score populated; state policy data is state-owned and should not be invented in the city CSV.
- Marijuana: Illegal, from the normalized Wisconsin state row and NCSL state medical cannabis law status reference.
- Sources:
  - https://www.hrc.org/resources/mei-state/wisconsin
  - https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Kenosha-Wisconsin.pdf
  - https://www.ncsl.org/health/state-medical-cannabis-laws

## Retail Amenities

- HasWalmart: Yes. Walmart lists a Kenosha Supercenter at 3500 Brumback Blvd and a Kenosha store directory entry.
- HasCostco: No. Costco's Wisconsin warehouse directory lists Pleasant Prairie at 7707 94th Ave; that is nearby but outside Kenosha, so the in-city field is No.
- Sources:
  - https://www.walmart.com/store/1167-kenosha-wi
  - https://www.walmart.com/store-directory/wi/kenosha
  - https://www.costco.com/w/-/wi/pleasant-prairie/1198
  - https://www.costco.com/sitemaps/warehouses-by-state/WI

## Weather And Climate

- Climate: Humid continental.
- Average winter low: 16 F, rounded from NOAA/NCEI Kenosha Regional Airport January normal low of 16.4 F.
- Average summer high: 84 F, rounded from NOAA/NCEI Kenosha Regional Airport July normal high of 83.8 F.
- Rain: 35 inches, snow: 39 inches, sunny days: 193 from BestPlaces' Kenosha climate page. The Kenosha Regional Airport NOAA monthly file had no usable snow normals, so BestPlaces was used for the CSV's snow/rain/sun summary fields.
- Summer humidity: 74%, from Wanderlog's Kenosha July climate page. NOAA hourly normals were not available for station USW00004845 at the published hourly endpoint.
- Sources:
  - https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00004845.csv
  - https://www.bestplaces.net/climate/city/wisconsin/kenosha
  - https://wanderlog.com/weather/58589/7/kenosha-weather-in-july
  - https://weatherspark.com/y/146521/Average-Weather-at-Kenosha-Regional-Airport-Wisconsin-United-States-Year-Round

## Economy And Defense

- TechHub: No. Kenosha is not being classified as a source-backed major tech hub.
- DefenseHub: No. No source-backed evidence found for an in-city military installation or major defense-employer cluster. Nearby federal and military assets outside Kenosha do not make the city a defense hub under the city-scoped convention.

## Description Notes

- Description emphasizes Lake Michigan location, in-city VA access, moderate housing values, cultural/lakefront assets, lower-than-national violent-crime rate, modest HRC MEI score, in-city Walmart access, no in-city Costco, and cold/snowy Upper Midwest winters.
