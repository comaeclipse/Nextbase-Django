# Peoria, Illinois Data Sources

Retrieval date: 2026-08-19

This is a Phase 1 research artifact for the Nextbase ingest workflow. The CSV was validated with the importer in dry-run mode only; no production Neon write was run from this feature branch.

## Core Identity

- City: Peoria, Illinois.
- County: Peoria County.
- Coordinates: 40.751641, -89.617198 from local Census/pace-derived centroid data (`peoria|IL`, GEOID 1759000).
- Population: 113,150 from the 2020 Decennial Census value surfaced by Census QuickFacts for Peoria city, Illinois. Census QuickFacts also listed a July 1, 2025 estimate of 110,920.
- Density: 2,359 people per square mile from the 2020 city profile.
- Sources:
  - https://www.census.gov/quickfacts/fact/table/peoriacityillinois/PST045225
  - https://en.wikipedia.org/wiki/Peoria,_Illinois

## Cost, Housing, Taxes, And Fuel

- Typical home value: $136,960 from Zillow's Peoria home-values page, data through 2026-07-31.
- Cost of living: 76, rounded from BestPlaces' Peoria cost-of-living score of 75.6. HomeSnacks also reports Peoria below the national average, but BestPlaces was used for the CSV value because it provides an explicit city score.
- Sales tax: 10.0%, from Avalara's 2026 Peoria city rate page. Avalara lists the Illinois state rate as 6.25% and Peoria city rate as 1.75%.
- Income tax: 4.95%, Illinois' flat individual income-tax rate. This is a legacy compatibility field; state-owned tax fields are normalized separately where available.
- Gas: $4.33, rounded from AAA's Peoria-Pekin regular average of $4.3346 on 2026-08-19.
- Sources:
  - https://www.zillow.com/home-values/19903/peoria-il/
  - https://www.bestplaces.net/cost_of_living/city/illinois/peoria
  - https://www.homesnacks.com/il/peoria/
  - https://www.avalara.com/us/en/taxrates/state-rates/illinois/cities/peoria.html
  - https://tax.illinois.gov/research/taxrates/income.html
  - https://gasprices.aaa.com/?state=IL

## Politics

- 2016 county winner: Clinton, 52% two-party share. Peoria County results were Clinton 38,060 and Trump 35,633; two-party Clinton share is 51.65%.
- 2024 county winner: Harris, 52% two-party share. Peoria County results were Harris 40,564 and Trump 36,896; two-party Harris share is 52.35%.
- Shift: 0.7 percentage points more Democratic by two-party vote share from 2016 to 2024.
- CityPolitics: "County-level: Moderately Liberal." The presidential fields use Peoria County returns, not city precinct totals.
- StateParty and Governor are legacy compatibility fields only; Illinois governor JB Pritzker is Democratic.
- Sources:
  - https://electionarchive.peoriaelections.gov/eng/contests/view/4725
  - https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Illinois
  - https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Illinois
  - https://gov.illinois.gov/about/the-governor.html

## Veterans And VA Access

- VA: Yes.
- Nearest VA: Bob Michel Department of Veterans Affairs Outpatient Clinic, in city, 0 miles.
- Illinois veteran benefits summary: Illinois does not tax military retired pay and offers disabled-veteran and returning-veteran property-tax exemptions, adapted housing and mobile-home exemptions, employment preference and assistance, education benefits, veterans homes, burial benefits, plates, hunting/fishing, and state park camping privileges.
- State-owned benefit fields are normalized in `locations_stateinfo`; the CSV keeps the summary for importer compatibility.
- Sources:
  - https://www.va.gov/illiana-health-care/locations/bob-michel-department-of-veterans-affairs-outpatient-clinic/
  - https://tax.illinois.gov/localgovernments/property/disabledveteraninfo.html
  - https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Illinois

## Public Safety

- TCI: 375, calculated as Peoria violent crime rate divided by the national violent-crime baseline, multiplied by 100 and rounded: 1,344.9 / 359.0 * 100 = 374.6.
- CrimeRating: High, because the cited violent-crime rate is far above the national baseline.
- Source:
  - https://www.homesnacks.com/il/peoria-crime/

## LGBTQ And Cannabis

- LGBTQ: 67.
- LGBTQ_MEI: 67.
- LGBTQ source: HRC 2025 Municipal Equality Index Peoria scorecard.
- LGBTQStatePolicyScore is blank because the current Illinois normalized row has no MAP score populated; state policy data is state-owned and should not be invented in the city CSV.
- Marijuana: Recreational, from the normalized Illinois state row and Illinois' adult-use cannabis program.
- Sources:
  - https://www.hrc.org/resources/mei-state/illinois
  - https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Peoria-Illinois.pdf
  - https://cannabis.illinois.gov/

## Retail Amenities

- HasWalmart: Yes. Walmart lists Peoria stores including Walmart Supercenter #3460 at 8915 N Allen Rd and Walmart Store #1323 at 3315 N University St.
- HasCostco: No. Costco's Illinois warehouse directory lists East Peoria, not Peoria; the nearby warehouse at 301 W Washington St is outside the city boundary, so the in-city field is No.
- Sources:
  - https://www.walmart.com/store/3460-peoria-il
  - https://www.walmart.com/store/1323-peoria-il
  - https://www.walmart.com/store-directory/il/peoria
  - https://www.costco.com/w/-/il/east-peoria/1126
  - https://www.costco.com/sitemaps/warehouses-by-state/IL

## Weather And Climate

- Climate: Humid continental.
- NOAA station: USW00014842, Greater Peoria Airport / Peoria International Airport.
- Average winter low: 18 F, rounded from NOAA/NWS January normal low of 17.6 F.
- Average summer high: 86 F, rounded from NOAA/NWS July normal high of 86.3 F.
- Rain: 38 inches, rounded from NOAA/NWS annual precipitation normal of 37.55 inches.
- Snow: 26 inches, rounded from NOAA/NWS annual snowfall normal of 26.2 inches.
- Sunny days: 194 from BestPlaces' Peoria climate page.
- Summer humidity: 71%, derived from NOAA hourly July temperature and dew-point normals for USW00014842 using the standard saturation-vapor-pressure relative-humidity formula; this matches secondary Peoria July humidity summaries from Wanderlog and Timeanddate.
- Sources:
  - https://www.weather.gov/ilx/pia-climate
  - https://www.weather.gov/ilx/pia-normal-monthly
  - https://www.ncei.noaa.gov/data/normals-monthly/1991-2020/access/USW00014842.csv
  - https://www.ncei.noaa.gov/data/normals-hourly/1991-2020/access/USW00014842.csv
  - https://www.bestplaces.net/climate/city/illinois/peoria
  - https://wanderlog.com/weather/58564/7/peoria-weather-in-july
  - https://www.timeanddate.com/weather/usa/peoria/climate

## Economy, Defense, And Amenities

- TechHub: No. Peoria has major healthcare, manufacturing, and regional-service assets, but it is not being classified as a source-backed major tech hub.
- DefenseHub: Yes. Peoria hosts the 182nd Airlift Wing of the Illinois Air National Guard at Peoria Air National Guard Base; this is a curated military-community signal written through the CSV `DefenseHub` column as `defense_hub_manual`.
- Description support: Peoria Riverfront Museum, Peoria Civic Center, Peoria Park District, Peoria Park District trail maps, and Peoria Park District golf programming support the arts, culture, parks, trail, and golf tags.
- Sources:
  - https://www.182aw.ang.af.mil/
  - https://www.182aw.ang.af.mil/Units/
  - https://www.peoriariverfrontmuseum.org/
  - https://www.peoriaciviccenter.com/
  - https://peoriaparks.org/
  - https://www.peoriaparks-planning.org/park-maps/
  - https://peoriaparks.org/programs/golf/

## Description Notes

- Description emphasizes Illinois River location, in-city VA access, low typical home values, park and cultural assets, Peoria Air National Guard Base, high violent-crime rate, high city sales tax, humid summers, and cold snowy winters.
