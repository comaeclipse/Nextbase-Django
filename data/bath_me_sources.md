# Bath, ME Source Notes

- Retrieval guide: `ALL_DATA_RETRIEVAL_INSTRUCTIONS.md` was reviewed for the active TS/Neon import path, source priority, scoped `climate_category` update guidance, and verification checklist.
- Geography and demographics: Census Reporter reports Bath, ME / Bath city, Sagadahoc County at 8,815 population, 9.1 square miles, and 966.5 people per square mile from ACS 2024 5-year data, rounded to density 967.
- Current state-party convention: the row follows the product convention of using current governor party for `state_party` and `governor`; Maine's official Governor page identifies Janet Mills as governor, so both fields are `D`.
- Elections: Maine Secretary of State official town-level presidential Excel files were parsed for Bath. 2016 Bath was Clinton 2,717 and Trump 1,571, giving Clinton 63.37 percent of the two-party vote, stored as 63. 2024 Bath was Harris 3,492 and Trump 1,581, giving Harris 68.84 percent, stored as 69. Republican two-party share changed from 36.63 percent to 31.16 percent, so `rep_vote_share_change_pp = -5.5` and `dem_vote_share_change_pp = 5.5`. Because this is city-level evidence and the 2024 Democratic share is above 65 percent, `city_politics` is `Strongly Liberal`.
- Taxes: Maine Revenue Services lists the general sales tax rate at 5.5 percent and individual income tax rates ranging from 5.8 percent to 7.15 percent for tax years beginning after 2015. The stored income value is the top marginal rate, consistent with existing rows.
- Cost and housing: ERI reports Bath as 9 percent above the national average cost of living, so `CostOfLiving` is stored as 109. Zillow's Bath ZHVI page reports an average home value of $376,977, updated May 31, 2026.
- VA access and veteran benefits: VA Maine lists the Lewiston VA Clinic at 15 Challenger Drive, Lewiston. Public driving-distance lookup showed Bath to Lewiston at about 27 miles, stored as `27 miles`. Maine Bureau of Veterans' Services pages document tax/financial assistance, education, employment, healthcare, housing, recreation, license, and veterans-service-office benefit categories; the benefits text is a compact summary, not a full eligibility guide.
- Crime: NeighborhoodScout and AreaVibes both report 6 violent crimes and a violent-crime rate of about 0.68 per 1,000 / 68 per 100,000 for Bath. Using the repo's open TCI method against the FBI 2024 national violent-crime rate of 359.1 per 100,000 gives 68 / 359.1 * 100 = 18.9, rounded to 19. The public-facing label is `Low`.
- Cannabis: Maine's Office of Cannabis Policy operates the adult-use cannabis program; the row stores `Recreational`.
- LGBTQ: MAP's Maine Equality Profile reports Sexual Orientation Policy Score 21/23, Gender Identity Policy Score 23.5/26, and Overall Score 44.5/49. No current HRC Municipal Equality Index score for Bath was found, so `LGBTQ_MEI` is intentionally blank rather than inferred.
- Economy and tags: General Dynamics Bath Iron Works identifies itself as a U.S. Navy shipbuilding and support leader and part of the defense industrial base, so `DefenseHub=Y`. I did not find evidence that Bath is a broad technology hub, so `TechHub=N`. Maine Maritime Museum documents Bath's "City of Ships" identity and a 20-acre waterfront campus on the Kennebec River. Tags are kept to existing filter vocabulary.
- Climate: BestPlaces reports Bath averages 66 inches of snow, 50 inches of rain, and 202 sunny days per year. WeatherSpark reports July as the hottest month with a 78 F average high and January as the coldest month with a 15 F average low. Timeanddate reports July humidity around 72 percent. The display climate is `Humid continental`; the app `climate_category` should be set to `cold_snowy` because annual snow is over 30 inches.
- Gas: AAA Fuel Prices reported Maine regular gasoline at $3.878 on July 10, 2026, rounded to `$3.88`.

## URLs

- Census Reporter Bath profile: https://censusreporter.org/profiles/16000US2303355-bath-me/
- Maine Governor Janet Mills official page: https://www.maine.gov/governor/mills/
- Maine SOS 2024 results page: https://www.maine.gov/sos/elections-voting/election-results-data/election-results-2024
- Maine SOS 2024 President by County/Town Excel: https://www.maine.gov/sos/sites/maine.gov.sos/files/inline-files/President%20and%20Vice%20President%20FINAL-Corrected%2020241205.xlsx
- Maine SOS 2016 results page: https://www.maine.gov/sos/elections-voting/election-results-data/election-results-2016-2017
- Maine SOS 2016 President Excel: https://www.maine.gov/sos/sites/maine.gov.sos/files/content/assets/president.xlsx
- Maine sales/use tax rates: https://www.maine.gov/revenue/taxes/sales-use-service-provider-tax/rates-due-dates
- Maine individual income tax: https://www.maine.gov/revenue/taxes/income-estate-tax/individual-income-tax-1040me
- ERI Bath cost of living: https://www.erieri.com/cost-of-living/united-states/maine/bath
- Zillow Bath home values: https://www.zillow.com/home-values/37299/bath-me/
- VA Maine locations: https://www.va.gov/maine-health-care/locations/
- Lewiston VA Clinic: https://www.va.gov/maine-health-care/locations/lewiston-va-clinic/
- Maine veterans tax and financial benefits: https://www.maine.gov/veterans/benefits/tax-finance-benefits
- Maine veterans service offices: https://www.maine.gov/veterans/veterans-services-offices
- NeighborhoodScout Bath crime: https://www.neighborhoodscout.com/me/bath/crime
- AreaVibes Bath crime: https://www.areavibes.com/bath-me/crime/
- FBI 2024 national crime summary: https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- Maine Office of Cannabis Policy adult use: https://www.maine.gov/dafs/ocp/adult-use
- MAP Maine Equality Profile: https://mapresearch.org/equality-profiles/me/
- General Dynamics Bath Iron Works: https://www.gdbiw.com/
- Maine Maritime Museum visit page: https://www.mainemaritimemuseum.org/visit
- BestPlaces Bath climate: https://www.bestplaces.net/climate/city/maine/bath
- WeatherSpark Bath climate: https://weatherspark.com/y/27197/Average-Weather-in-Bath-Maine-United-States-Year-Round
- Timeanddate Bath climate averages: https://www.timeanddate.com/weather/%404957570/climate
- AAA Maine gas prices: https://gasprices.aaa.com/?state=ME
