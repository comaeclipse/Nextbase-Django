# King of Prussia, PA Source Notes

Retrieval date: 2026-07-09.

## Geography and economics

- Geography: King of Prussia CDP in Upper Merion Township, Montgomery County, PA (Census place FIPS 4239736). The record is deliberately city/CDP-based, while election and crime data use the best available larger reporting geographies noted below.
- Population and density: 2020 Census population 24,695 and 2,907.0 people per square mile, from Census QuickFacts. The compact application display field is kept as the complete Census population rather than a metro population.
- Housing: city-level Zillow Home Value Index (ZHVI), all homes, $504,071 through 2026-05-31. The schema calls this `avg_home_value`; the source metric is a typical home value, not an average or median sale price.
- Cost of living: 139 (United States = 100) from CostOfLivingData's April 2026 city estimate, which identifies its data vintage as 2023 ACS 5-year. This is a documented public proxy, not a licensed C2ER index; the record therefore classifies cost as `High`.
- Sales and income tax: Pennsylvania Department of Revenue current rates: 6 percent state sales tax (no Montgomery County surcharge) and 3.07 percent flat personal income tax.
- Gas: AAA Philadelphia metro regular average, $3.926 on 2026-07-08, rounded to `$3.93`.

## Veterans access and benefits

- VA access: the official VA Coatesville location directory lists the West Norriton VA Clinic at 2495 General Armistead Avenue, Norristown. It is approximately 5 driving miles from central King of Prussia, so `has_va=Yes`. The proposed King of Prussia VA medical center was **not** treated as an operating facility.
- Benefits: PA Department of Military and Veterans Affairs materials document the Disabled Veterans' Real Estate Tax Exemption and other programs. Pennsylvania's military-retirement-pay exemption is summarized by the state veterans-benefits resources linked below.

## Politics and elections

- Governor/state party: Governor Josh Shapiro (D), current as retrieved from the Commonwealth's governor page. `state_party=D` follows the existing product convention of the governor's party; Pennsylvania's legislature is divided, so it is not a claim of unified party control.
- The CDP does not map cleanly to a single election precinct, so this record uses **Montgomery County** presidential returns and explicitly labels the political-culture field `County-level: Liberal`.
- Montgomery County official 2016 results: Clinton 256,082 and Trump 162,731. Two-party Democratic share = 61.15%.
- Montgomery County official 2024 results: Harris 317,103 and Trump 198,311. Two-party Democratic share = 61.53%.
- Therefore Democratic two-party share increased 0.38 percentage points (stored as `+0.4`), Republican share decreased 0.38 points (stored as `-0.4`), and winner percentages are rounded to 61 and 62, respectively.

## Safety, policy, and inclusion

- Crime geography: King of Prussia is served by Upper Merion Township police. The Township's reports page publishes the 2024 police annual report. FBI UCR-derived 2024 Upper Merion figures show 45 violent crimes, a 123.6 per-100,000 violent-crime rate. Using the FBI's 2024 national violent-crime rate of 359.1 per 100,000 gives a normalized TCI of 34.4, stored as 34. This uses the application convention where lower is safer.
- Marijuana: `Medical`. Pennsylvania's official Department of Health operates the medical-marijuana program; adult-use legalization remained a proposal as of retrieval.
- LGBTQ: King of Prussia has no HRC Municipal Equality Index scorecard. The current Movement Advancement Project Pennsylvania Equality Profile reports 16.75/49, `Fair`; that value is stored only as the state policy score and the absence of a municipal MEI is recorded rather than inferred.

## Climate and amenities

- Weather is representative of King of Prussia/Valley Forge. NOAA's 1991-2020 Climate Normals are the primary reference framework. City-level published climate summaries provide 19 inches annual snow, 48 inches annual precipitation, January low about 23 F, July high about 87 F, and July relative humidity about 72 percent. The city-specific sunny-days measure is left blank because no comparably sourced figure was located.
- These values classify as `cold_snowy` under the application's fixed four-bucket rule: the January low is 25 F or lower and annual snow is at least 15 inches. This is a product classification rather than a Köppen classification.
- Tags are supported by National Park Service documentation for Valley Forge National Historical Park: a 3,500-acre park with 35 miles of trails, historic sites, and monuments, located in King of Prussia. `tech_hub=N` and `defense_hub=N` because the research found a major retail/corporate corridor but no documented city-scale technology or defense cluster meeting the product definition.

## Source URLs

- Census QuickFacts: https://www.census.gov/quickfacts/fact/table/kingofprussiacdppennsylvania/EDU685224
- Zillow King of Prussia ZHVI: https://www.zillow.com/home-values/21825/king-of-prussia-pa/
- Cost-of-living proxy: https://costoflivingdata.com/cost-of-living/pa/king-of-prussia/
- Pennsylvania current tax rates: https://www.pa.gov/agencies/revenue/resources/tax-rates
- Pennsylvania retirement and military retainer-pay tax treatment: https://www.pa.gov/agencies/revenue/forms-and-publications/pa-personal-income-tax-guide/gross-compensation
- AAA Pennsylvania/Philadelphia fuel prices: https://gasprices.aaa.com/?state=PA
- VA Coatesville locations (West Norriton): https://www.va.gov/coatesville-health-care/locations
- VA King of Prussia proposal context: https://www.va.gov/AIRCOMMISSIONREPORT/docs/VISN04-Market-Recommendation.pdf
- Pennsylvania veterans benefits booklet: https://www.dmva.pa.gov/veteransaffairs/Documents/Benefits-Booklet.pdf
- Governor Josh Shapiro: https://www.pa.gov/governor/about/governor-josh-shapiro
- Montgomery County 2016 official presidential results: https://www.montgomerycountypa.gov/DocumentCenter/View/31509/GE16OfficialSummary-Report
- Montgomery County 2024 official presidential results: https://www.montgomerycountypa.gov/Archive.aspx?ADID=6363
- Upper Merion Police reports: https://www.umtownship.org/424/Reports
- FBI 2024 national crime report: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Pennsylvania medical marijuana program: https://www.pa.gov/agencies/health/programs/medical-marijuana
- Movement Advancement Project Pennsylvania equality profile: https://mapresearch.org/equality-profiles/pa/
- NOAA U.S. Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- King of Prussia climate summary: https://www.plantmaps.com/en/clim/f/us/pennsylvania/king-of-prussia/climate-data
- King of Prussia humidity summary: https://www.weather-atlas.com/en/pennsylvania-usa/king-of-prussia-climate
- Valley Forge National Historical Park: https://www.nps.gov/vafo/planyourvisit/index.htm
