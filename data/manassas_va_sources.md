# Manassas, VA Source Notes

Retrieval date: 2026-08-31.

## Geography and economics

- Geography: City of Manassas (independent city, FIPS 51683), Virginia.
- Population and density: Census Reporter ACS 2024 5-year profile reports 42,976 people living within a land area of 9.8 square miles, yielding 4,366.1 people per square mile; stored as `"42,976"` and `4366`.
- Housing: Zillow city-level ZHVI for Manassas, VA reports $556,241 as of July 31, 2026. The schema field is `avg_home_value`, stored as `"$556,241"`.
- Cost of living: BEA Regional Price Parities for Washington-Arlington-Alexandria MSA (2024) = 108.884, rounded to `109`.
- Sales and income tax: Manassas City combined sales tax total is 6.00% (Virginia state 4.3% + local 1.0% + Northern Virginia regional transportation 0.7%). Virginia's top individual income tax rate is 5.75%.
- Gas: AAA Northern Virginia regional regular gas average was $3.89 on retrieval.

## Veterans access and benefits

- VA access: VA.gov lists Fort Belvoir VA Clinic at 9300 DeWitt Loop, Fort Belvoir, VA, providing primary care, mental health, and outpatient services. Located ~25 miles driving from central Manassas, `has_va=Yes`.
- Benefits: Virginia Department of Veterans Services documents military retirement pay subtraction up to $40,000 for tax year 2025 and later, 100% disabled veteran real property tax exemptions, and disabled veteran vehicle tax exemptions.

## Politics and elections

- Governor/state party: Abigail Spanberger is Virginia's current governor as of retrieval (`state_party=D`, `governor=D`).
- Manassas City is an independent city in Virginia. Presidential election results for Manassas City (FIPS 51683):
  - 2016 Official: Clinton 8,423 votes (55.21%), Trump 5,953 votes (39.02%). Two-party total = 14,376 votes. Clinton two-party share = 58.59%.
  - 2024 Official: Harris 56.18%, Trump 41.50%. Two-party Dem share = 57.51%.
  - Trend: Democratic two-party share decreased by 1.08 pp, Republican two-party share increased by 1.08 pp. Stored as `1.1 pp more Republican since 2016`, `rep_vote_share_change_pp=1.1`, `dem_vote_share_change_pp=-1.1`.
- Political culture: `Liberal` (Democratic two-party share 57.5%, within 55–64.9% threshold).

## Safety, policy, and inclusion

- Crime: Manassas City Police Department / FBI UCR 2024 reports violent crime rate of 274.2 per 100,000 residents (118 violent crimes). Indexed to FBI 2024 national violent-crime rate of 359.1 per 100,000, normalized TCI is 76 (lower is safer). Stored as `TCI=76`, `CrimeRating=Low`.
- Marijuana: Virginia Cannabis Control Authority lists personal adult possession and cultivation as legal (`Recreational`).
- LGBTQ: HRC MEI 2025 did not publish a municipal scorecard for Manassas (`Not Rated`). MAP Virginia Equality Profile 2026 overall score is 25/49 (`LGBTQStatePolicyScore=25`).

## Climate and amenities

- Weather: NOAA 1991-2020 normals (Manassas Regional Airport HEF / Washington Dulles NCEI normals framework): annual rainfall 43 inches, annual snowfall 17 inches, 198 sunny days, January low 24°F, July high 88°F, July humidity 70%. Climate classification: `Humid subtropical (Cfa)`.
- Amenities & Hubs: Manassas is home to major defense contractors and advanced manufacturing facilities including Lockheed Martin Rotary and Mission Systems (undersea/submarine combat systems & sonar), BAE Systems Space Systems HQ (radiation-hardened space microelectronics), and Micron Technology (semiconductor fabrication). Classified as `TechHub=Y` and `DefenseHub=Y`.

## Source URLs

- Census Reporter Manassas City profile: https://censusreporter.org/profiles/16000US5149224-manassas-city-va/
- Zillow Manassas ZHVI: https://www.zillow.com/home-values/30829/manassas-va/
- Manassas City Tax Rates: https://www.manassasva.gov/government/departments/city_treasurer/tax_rates.php
- Virginia Tax individual rates: https://www.tax.virginia.gov/
- AAA Northern Virginia gas prices: https://gasprices.aaa.com/
- Fort Belvoir VA Clinic: https://www.va.gov/washington-dc-health-care/locations/fort-belvoir-va-clinic/
- Virginia Department of Veterans Services: https://www.dvs.virginia.gov/
- Virginia Department of Elections (2016 & 2024 official results): https://historical.elections.virginia.gov/
- VPAP Manassas City 2016 election results: https://www.vpap.org/
- FBI Crime Data Explorer / Virginia State Police Crime in Virginia: https://cde.ucr.cjis.gov/
- OpenCrime 2024 Manassas Crime Summary: https://opencrime.us/
- Virginia Cannabis Control Authority: https://cca.virginia.gov/
- HRC Municipal Equality Index: https://www.hrc.org/resources/municipal-equality-index
- MAP Virginia Equality Profile: https://mapresearch.org/equality-profiles/va/
- NOAA NCEI Climate Normals: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
- Choose Manassas Economic Development: https://choosemanassas.org/
- Lockheed Martin Manassas: https://www.lockheedmartin.com/
- BAE Systems Space Systems Manassas: https://www.baesystems.com/
