# Pittsburgh, Pennsylvania — retrieval notes

Researched and ingested 2026-07-16. Values below are the source basis for the curated CSV; blank CSV cells are deliberately not estimated.

| Field(s) | Source and retrieval note |
| --- | --- |
| County, population, land area, density | [U.S. Census QuickFacts](https://www.census.gov/quickfacts/fact/table/pittsburghcitypennsylvania/NES010222): 2020 Census population 302,971; land area 55.38 sq mi. Density calculated as 302,971 / 55.38 = 5,471 people/sq mi. |
| Politics | Allegheny County presidential results: 2016 Clinton 367,617 and Trump 259,480 (two-party Democratic share 58.62%); 2024 Harris 429,916 and Trump 283,595 (60.25%). Stored rounded 59% and 60%, with a +1.6 pp Democratic two-party shift and an explicit county-level qualifier. [2016 Pennsylvania results](https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Pennsylvania), [2024 Pennsylvania results](https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Pennsylvania). |
| Sales and income tax | [Pennsylvania Department of Revenue rates](https://www.pa.gov/agencies/revenue/resources/tax-rates): 6% state sales/use tax plus 1% Allegheny County local sales tax. Pennsylvania PIT flat rate is 3.07%; Pittsburgh may additionally levy local earned-income tax, which is not stored in the state-income-tax field. |
| Home value | [Zillow Pittsburgh Home Values](https://www.zillow.com/home-values/26529/pittsburgh-pa/), updated 2026-06-30: ZHVI $246,117. |
| VA access | [VA Pittsburgh Healthcare System](https://www.va.gov/pittsburgh-health-care/) and [University Drive Medical Center](https://www.va.gov/pittsburgh-health-care/locations/pittsburgh-va-medical-center-university-drive/). City-center-to-facility distance stored as an approximate 3 miles. |
| Veterans benefits | [PA DMVA Real Estate Tax Exemption](https://www.pa.gov/agencies/dmva/pennsylvania-veterans/pa-vetconnect/state-veterans-programs/financial-assistance/retx) and [VA overview of PA tax exemptions](https://news.va.gov/139592/unlocking-veteran-tax-exemptions-across-states-and-u-s-territories/). |
| Crime | 2024 FBI UCR-derived city data: 1,355 violent crimes, 427.21 per 100,000, via [FBI UCR data presentation](https://www.beautifydata.com/united-states-crimes/fbi-ucr/number-and-rate-of-crimes-trend-per-city/violent/pennsylvania/pittsburgh). Stored rounded to 427 and labeled High. |
| Marijuana | [Pennsylvania Department of Health Medical Marijuana Program](https://www.pa.gov/agencies/health/programs/medical-marijuana): active state medical program; no adult-use program was represented in the curated field. |
| LGBTQ | [HRC Pennsylvania 2025 MEI list](https://www.hrc.org/resources/mei-state/pennsylvania): Pittsburgh 100. [MAP Pennsylvania Equality Profile](https://mapresearch.org/equality-profiles/pa/): overall policy score 16.75/49; Pittsburgh is listed as locally fully inclusive and among municipalities with conversion-therapy ordinances. |
| Climate | [Visit Pittsburgh climate guide](https://www.visitpittsburgh.com/plan-your-trip/weather/): January 39/23 F, July high 85 F, snowfall 44 in. [Timeanddate Pittsburgh climate averages](https://www.timeanddate.com/weather/%40z-us-15232/climate): annual precipitation 42.33 in and July humidity 69%. |

No local gas-price snapshot, sunny-day count, federal Tech Hub status, or defense-hub manual designation was stored without a directly suitable source. `DefenseHub` is blank (neutral); post-import derived defense status comes from the standard employer-location recomputation.
