# Memphis, TN Source Notes

Retrieval date: 2026-07-28.

## Geography and imported values

- Primary geography: incorporated City of Memphis, Shelby County, Tennessee. Census QuickFacts reports the July 1, 2025 population estimate as 609,647 and 2020 density as 2,131.8 people per square mile; the CSV stores 609,647 and 2,132. Memphis's Census place FIPS is 4748000.
- Housing: Zillow reported a typical Memphis home value (ZHVI, not an average or median) of $146,746 through 2026-06-30. It is stored in the model's legacy `avg_home_value` field.
- Taxes and veteran benefits: the Tennessee Department of Revenue says the state has no individual income tax on wages, pensions, Social Security, IRAs, or 401(k) distributions. Tennessee's general sales tax is 7% plus local tax; the Memphis combined rate is stored as 9.75%. The Tennessee Comptroller's 2026 state-benefits review documents disabled-veteran/surviving-spouse property-tax relief and education, recreation, and service programs.
- VA access: the in-city Lt. Col. Luke Weathers, Jr. VA Medical Center is at 116 N. Pauline Street, so `VA=Yes` and `DistanceToVA=0 miles` are city-level access values.
- Elections: fields use Shelby County rather than a city-boundary precinct rollup, and `CityPolitics` explicitly says so. The Tennessee Secretary of State's official 2016 precinct report gives Shelby County Clinton 208,992 and Trump 116,344; two-party Democratic share was 64.24%. Shelby County's certified 2024 combined report gives Harris 201,759 and Trump 118,917; two-party Democratic share was 62.91%. Thus Republican share rose 1.33 percentage points and Democratic share fell 1.33 points. Display winner percentages are rounded to 64 and 63.
- LGBTQ: HRC's 2025 Memphis Municipal Equality Index scorecard gives a final municipal score of 63. MAP's Tennessee Equality Profile was retrieved live on 2026-07-28 and reports an overall state policy score of -16.5/49 (negative). The two measures remain separate in the row.
- Climate: NOAA 1991-2020 normals for Memphis International Airport (`USW00013893`) supply annual precipitation of 54.94 inches, annual snowfall of 2.6 inches, January average low near 31 F, and July average high near 92 F; stored values are rounded to 55, 3, 31, and 92. July relative humidity of 69% is a secondary climatological value reported by Current Results, used only to make the repository's deterministic climate classifier represent Memphis's hot-humid summer conditions. `sun_days` is blank because no comparable primary annual normal was found.
- Defense linkage: the CSV deliberately leaves `DefenseHub` blank: it is not a direct data flag. Before ingestion, Neon contained one L3Harris Memphis site (one onsite posting, no location link). The link/recompute workflow determines the derived value.
- Safety, local cost-of-living index, gas price, technology-hub flag, and any manual defense-hub judgment remain blank rather than inferred. The City of Memphis's 2024 report documents improvement in total crime and homicides, but it does not supply a compatible retirement-safety index for `TCI`.

## Source URLs

- Census QuickFacts, Memphis city: https://www.census.gov/quickfacts/fact/table/memphiscitytennessee/HSG860223
- Zillow Memphis ZHVI: https://www.zillow.com/home-values/230531/memphis-tn/
- Tennessee Department of Revenue, pension and retirement income: https://revenue.support.tn.gov/hc/en-us/articles/360057371832-HIT-18-Pension-Income-Social-Security-401-k-and-IRA-Distributions
- Tennessee Department of Revenue, sales-tax overview: https://revenue.support.tn.gov/hc/en-us/articles/360058139672-SUT-13-Sales-and-Use-Tax-Rates-Overview
- Tennessee Comptroller, state benefits and services for veterans: https://comptroller.tn.gov/news/2026/3/4/comptroller-s-office-updates-review-of-state-benefits-and-services-for-veterans.html
- VA Memphis, Lt. Col. Luke Weathers, Jr. VA Medical Center: https://www.va.gov/memphis-health-care/locations/lt-col-luke-weathers-jr-va-medical-center/
- Tennessee Secretary of State, 2016 presidential precinct results: https://sos-tn-gov-files.s3.amazonaws.com/PresidentbyPrecinctNov2016.pdf
- Shelby County Election Commission, certified 2024 combined results: https://www.electionsshelbytn.gov/wp-content/uploads/2025/09/Conbined-Results-Totals-Reports-11.5.24.pdf
- HRC 2025 Memphis MEI scorecard: https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-Memphis-Tennessee.pdf
- MAP Tennessee Equality Profile: https://mapresearch.org/equality-profiles/TN/
- NOAA annual/seasonal normals, USW00013893: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00013893&format=json&units=standard&includeAttributes=false
- NOAA monthly normals, USW00013893: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00013893&format=json&units=standard&includeAttributes=false
- Current Results, Memphis July humidity: https://www.currentresults.com/Weather/Tennessee/humidity-july.php
- City of Memphis, 2024 crime report and public-safety update: https://www.memphistn.gov/2024-crime-report-and-public-safety-update/

## defense_hub_manual (issue #20, retrieved 2026-08-11)

Determination: **FALSE (hard veto)**

Vetoed. The old Naval Air Station Memphis / Defense Depot Memphis closed in 1997 and is now an EPA Superfund site inside city limits. The region's actual active installation, Naval Support Activity Mid-South, is in Millington, TN — a separate city roughly 21 miles away, not Memphis proper. The single tracked L3Harris posting (1 onsite) is a token presence with no supporting military/defense character in Memphis itself.

Sources:
- Wikipedia, "Memphis Defense Depot" — https://en.wikipedia.org/wiki/Memphis_Defense_Depot
- EPA Superfund site profile, Defense Depot Memphis — https://cumulis.epa.gov/supercpad/
- Military.com, Naval Support Activity Mid-South (Millington) base guide — https://www.military.com/
