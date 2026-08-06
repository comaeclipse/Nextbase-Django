# Grand Junction, CO Source Notes

Retrieval date: 2026-08-06.

## Geography and economics

- Primary geography is incorporated Grand Junction city in Mesa County, Colorado. The row is city-based; presidential fields use Mesa County because a city-boundary precinct crosswalk was not prepared in this pass.
- Census QuickFacts reports the July 1, 2024 city population as 70,554 and 2020 land area as 39.63 square miles. The stored density is 1,780 people per square mile, calculated as the 2024 estimate divided by that land area.
- Zillow's Grand Junction page reported a ZHVI (typical home value, not an average or median) of $429,488 through 2026-06-30.
- CostOfLivingData reports a 104 city cost index on a 100=U.S.-average scale, using 2023 ACS 5-year data. This is a documented secondary proxy rather than an official government cost index; the row's product category is therefore `Moderate`.
- The City of Grand Junction sales-tax chart lists 2.90% Colorado, 2.37% Mesa County, and 3.39% city tax, for 8.66% combined. Colorado's individual-income-tax guide is the source for the 4.4% rate used here.

## Veterans access and benefits

- VA.gov lists the Grand Junction VA Medical Center at 2121 North Avenue in Grand Junction. The city therefore has local medical-center access and stores `has_va=Yes`, `nearest_va=Grand Junction VA Medical Center`, and `distance_to_va=0 miles`.
- The benefits summary is a short eligibility-sensitive product summary based on Colorado military/veterans-benefit guidance; it is not individualized benefits advice.

## Politics and elections

- Governor/state party: Governor Jared Polis is a Democrat; the existing product convention stores `D` in both `Governor` and `StateParty`.
- Colorado Secretary of State official Mesa County 2016 presidential results: Trump 49,779 and Clinton 21,729. Two-party Republican share = 69.61%.
- Colorado Secretary of State official Mesa County 2024 presidential results: Trump 55,839 and Harris 33,573. Two-party Republican share = 62.45%.
- Republican two-party share changed by -7.16 percentage points, so the row stores -7.2 for `rep_vote_share_change_pp`, +7.2 for Democratic change, and `7.2 pp more Democratic since 2016`. The 2024 county result remains conservative, so the political-culture value is explicitly `County-level: Conservative`.

## Policy, inclusion, climate, and amenities

- Colorado permits adult-use cannabis; the row stores `Recreational`.
- No HRC 2025 Municipal Equality Index scorecard was located for Grand Junction. The municipal MEI column is left blank; the row separately stores MAP's current Colorado statewide Equality Profile score, 45.5/49. This is a state-policy proxy, not a city score.
- NOAA 1991-2020 normals for Grand Junction Walker Field station `USW00023066` provide annual precipitation 9.06 inches, annual snowfall 17.70 inches, January average low 17.3 F, and July average high 94.5 F. The row stores rounded values 9, 18, 17, and 95. NOAA's normals response does not provide a directly comparable July-relative-humidity value, and no source-comparable sunshine-days source was found, so both fields are blank.
- The City and public-land sources support the recreation-oriented description and tags, including Colorado National Monument, Grand Mesa access, river recreation, golf, and the downtown cultural district. No source-backed city-scale technology or defense-hub determination was prepared; `TechHub` and `DefenseHub` are left blank rather than asserted false.
- Crime/TCI and gas price are also blank: no locally sourced, method-compatible crime index or appropriately current city-level fuel value was found during this pass.

## Source URLs

- Census QuickFacts, Grand Junction city: https://www.census.gov/quickfacts/fact/table/grandjunctioncitycolorado/INC110224
- Zillow ZHVI, Grand Junction: https://www.zillow.com/home-values/31819/grand-junction-co/
- Cost-of-living proxy and methodology: https://costoflivingdata.com/cost-of-living/co/grand-junction/
- City of Grand Junction sales-tax chart: https://www.gjcity.org/DocumentCenter/View/735/Sales-Tax-Chart-PDF
- Colorado individual income-tax guide: https://tax.colorado.gov/individual-income-tax-guide
- Grand Junction VA Medical Center: https://www.va.gov/western-colorado-health-care/locations/grand-junction-va-medical-center/
- Colorado military and veterans benefits: https://myarmybenefits.us.army.mil/Benefit-Library/State/Territory-Benefits/Colorado
- Governor Jared Polis, National Governors Association: https://www.nga.org/governor/jared-polis/
- Colorado Secretary of State, 2016 official presidential results: https://coloradosos.gov/pubs/elections/Results/Abstract/2016/general/president.html
- Colorado Secretary of State, 2024 Biennial Abstract: https://www.coloradosos.gov/pubs/elections/Results/2024/2024BiennialAbstract.pdf
- Colorado cannabis regulatory agency: https://cannabis.colorado.gov/
- MAP Colorado Equality Profile: https://mapresearch.org/equality-profiles/co/
- NOAA 1991-2020 annual/seasonal normals, USW00023066: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00023066&format=json&units=standard&includeAttributes=false
- NOAA 1991-2020 monthly normals, USW00023066: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00023066&format=json&units=standard&includeAttributes=false
- Visit Grand Junction: https://www.visitgrandjunction.com/
- National Park Service, Colorado National Monument: https://www.nps.gov/colm/index.htm
