# Cody, WY Source Notes

**Retrieval Date:** 2026-08-08
**Prepared by:** Claude Sonnet 5 (Claude Code), replacing an earlier unsigned/unsourced scratch pass (root-level `cody.json`/`cody.csv`) that never made it into a tracked archive.

---

## Geography and source choices

- Primary geography: incorporated City of Cody, Park County, Wyoming (county seat).
- `DefenseHub` is `N`. A search surfaced GT Aeronautics (UAS/aerospace, relocated from California) and general Wyoming aerospace-conference activity, but GT Aeronautics' actual manufacturing facility is in Powell, WY (a separate city), not Cody. No confirmed physical defense/aerospace facility inside Cody was found, so this is a documented negative judgment, not an unresearched gap.
- `TCI` is left blank: available crime comparisons (BestPlaces-style per-population rates, SafeWise/Reolink "safest cities" rankings) use different baselines and aren't reducible to one honest composite number without picking a single proprietary methodology. `CrimeRating = Low` is a qualitative judgment supported by all sources agreeing Cody is meaningfully safer than both the Wyoming and national averages.
- `CostOfLiving` and `HumiditySummer` are blank — no independently verifiable index/normal was found for either.
- `SunnyDays = 300` reuses the commonly cited tourism-site figure; a secondary source (weather-and-climate.com) gives a lower 213-day estimate using a different definition of "sunny." Flagged here as a soft number, not NOAA-sourced.

## Imported values and method

### Population and density
- 2020 Decennial Census: 10,028 (11th-largest city in Wyoming). Density ~958/sq mi.
- Source: Wikipedia (Cody, Wyoming), citing Census Bureau.

### Housing
- `AvgHomeValue`: $464,142 — Zillow ZHVI, up 5.2% YoY as of retrieval.

### Taxes
- `SalesTax`: 4.0% (Wyoming state rate only; Park County and Cody levy no additional local sales tax).
- `Income`: 0 — Wyoming has no individual state income tax.

### Veterans benefits
- Wyoming has no state income tax, so military retirement pay is untaxed. Qualifying veterans may receive a $6,000 assessed-value property-tax exemption (or apply it to vehicle licensing).

### VA access
- Cody VA Clinic is a Sheridan VA Health Care System CBOC physically located in Cody; `VA = Yes`, `DistanceToVA = 0 miles`. Sheridan VA Medical Center is the referral hospital for services not available locally (exact driving distance not independently verified here — a good candidate for the VA sync script rather than a manual figure).

### Crime
- BestPlaces-style comparison: violent crime rate 12.8 vs. national 22.7; overall crime rate 11.9 vs. national 33.37 (roughly 2.2x safer than the national average).
- Cody ranked #11 safest city in Wyoming for 2026 (SafeWise/Reolink roundups); 2024 crime fell 48% versus 2023 per the same sources.
- `TCI` blank (methodology conflict, see above); `CrimeRating = Low`.

### Defense / economy
- No confirmed physical defense-industry facility inside Cody (see DefenseHub rationale above). `TechHub = N` — no diversified tech-employment base identified.

### Climate
- NOAA 1991–2020 Normals, Cody, WY (GHCND:USC00481840): January mean minimum 17.5°F (stored as 18), July mean maximum 84.0°F (stored as 84), annual snowfall 45.00 in, annual precipitation 11.51 in (stored as 12).
- `Climate`: Cold Semi-Arid (large seasonal swings, low precipitation, high plains).
- `SunnyDays = 300`: secondary source (BestPlaces/tourism figure), not NOAA-derived — see caveat above.

### Cannabis
- Wyoming has not legalized recreational or broad medical cannabis. `Marijuana = Illegal`.

### LGBTQ
- No HRC Municipal Equality Index rating exists for Cody; `LGBTQ` and `LGBTQ_MEI` left blank.
- `LGBTQStatePolicyScore = -6`: MAP's 2026 Wyoming overall policy tally (out of a possible 49), rated "Negative" — driven by an absence of nondiscrimination protections and multiple restrictions on transgender rights.

### Politics and elections
- County-level returns used; `CityPolitics` qualified as `County-level: Strongly Conservative`.
- 2016 Park County (Wikipedia, sourced from official county results): Trump 11,115 (73.63%), Clinton 2,535 (16.79%). Two-party Trump share 81.42%.
- 2024 Park County (Park County Clerk unofficial general-election totals, all 22 precincts reporting): Trump 13,079 (78.14%), Harris 3,259 (19.47%), Oliver 232, write-in 168; 16,871 total ballots. Two-party Trump share 80.05%.
- `rep_vote_share_change_pp = -1.37`, `dem_vote_share_change_pp = +1.37`, `ElectionChange = "1.4 pp more Democratic since 2016"`.

## Source URLs

- Cody, WY population/density (Wikipedia, citing Census): https://en.wikipedia.org/wiki/Cody,_Wyoming
- Zillow Cody ZHVI: https://www.zillow.com/home-values/17504/cody-wy/
- Cody/Park County sales tax (SalesTaxHandbook): https://www.salestaxhandbook.com/wyoming/rates/cody
- Cody VA Clinic (VA Sheridan Health Care): https://www.va.gov/sheridan-health-care/locations/cody-va-clinic/
- Cody safety ranking (Reolink "Safest Cities in Wyoming"): https://reolink.com/blog/safest-cities-in-wyoming/
- Cody crime stats (BestPlaces): https://www.bestplaces.net/crime/city/wyoming/cody
- GT Aeronautics Powell, WY facility background: http://www.gtaeronautics.com/aboutus.html
- NOAA NCEI monthly normals, USC00481840: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USC00481840&format=json&units=standard&includeAttributes=false
- NOAA NCEI annual/seasonal normals, USC00481840: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USC00481840&format=json&units=standard&includeAttributes=false
- Cody sunny-days estimate: https://www.bestplaces.net/climate/city/wyoming/cody
- MAP Wyoming Equality Profile: https://mapresearch.org/equality-profiles/wy/
- 2016 Park County presidential results (Wikipedia county table): https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Wyoming
- 2024 Park County unofficial general election totals (Park County Clerk PDF): https://parkcounty-wy.gov/wp-content/uploads/2024/11/2024-General-Unofficial-Totals.pdf
- Wyoming gas price average, Aug 2026 (GasBuddy via wyomingnews.com): http://www.wyomingnews.com/news/local_news/wyomings-average-gasoline-prices-decline-by-less-than-a-penny-per-gallon/article_628675ad-da08-4b29-b941-65b6a13bc002.html
