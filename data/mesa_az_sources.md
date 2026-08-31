# Mesa, Arizona source notes

Retrieved: 2026-08-31

## Identity and geography

- Geography: Mesa city, Maricopa County, Arizona; Census place GEOID `0446000`.
- Population: 511,764 (Census July 1, 2024 estimate). Census 2020 land area is 138.1 square miles; stored population density is `3,706` residents per square mile.
- Sources:
  - https://www.census.gov/quickfacts/fact/table/mesacityarizona/POP010220
  - https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html

## Housing and Cost of Living

- Housing: Zillow Home Value Index (ZHVI) single-family home typical value for Mesa, AZ is $433,754 as of July 2026.
- Cost of Living: `CostOfLiving` / `col_index` is left blank in the CSV per project instructions. It will be derived automatically post-ingest from BEA Regional Price Parities by running `scripts/import-bea-rpp.ts` and `scripts/sync-col-index-from-rpp.ts`.
- Sources:
  - https://www.zillow.com/home-values/53289/mesa-az/

## Taxes, VA access, and veterans benefits

- Sales tax: stored as 8.30%, reflecting the combined Arizona state sales tax (5.60%), Maricopa County tax (0.70%), and Mesa city privilege tax (2.00%). Arizona's individual income-tax rate is 2.50% flat for tax year 2025 and later.
- VA: Mesa VA Clinic is located in Mesa at 4135 South Power Road, Suite 103, Mesa, AZ 85212, providing primary care and outpatient specialty services. Stored as `VA=Yes` and `0 miles`.
- Veterans benefits: Arizona taxes military retirement pay and does not provide a general statewide property-tax exemption for all veterans; eligibility-based property-tax relief and Arizona Department of Veterans' Services programs may apply.
- Sources:
  - https://azdor.gov/transaction-privilege-tax-tpt
  - https://azdor.gov/individuals/withholding-tax-individual
  - https://www.va.gov/phoenix-health-care/locations/mesa-va-clinic/
  - https://dvs.az.gov/

## Politics and social policy

- State-party/governor: stored as `R` / `D` following the app convention (Republican legislature, Democratic Governor Katie Hobbs).
- Politics: uses Maricopa County presidential election results. Maricopa County 2016 final: 747,361 Trump vs 702,907 Clinton (51.53% Rep two-party). 2024 final: 1,051,531 Trump vs 980,016 Harris (51.76% Rep two-party). Trend is +0.23 pp Republican (stored as `0.2` pp shift; `County-level: Moderately Conservative`).
- Cannabis: Recreational and medical adult-use permitted in Arizona (`Recreational`).
- LGBTQ: HRC 2024 Municipal Equality Index scorecard gives Mesa a score of 88/100 ("All-Star City" designation for municipal non-discrimination and equality leadership).
- Sources:
  - https://elections.maricopa.gov/
  - https://cannabis.azdhs.gov/
  - https://www.hrc.org/resources/municipal-equality-index

## Climate

- Climate: Hot desert. Normals proxy based on Phoenix/Mesa 1991-2020 NOAA normals: ~9 inches annual rainfall, 0 inches snow, 301 sunny days, 42°F average January low, 106°F average July high, 22% July relative humidity.
- Sources:
  - https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
  - https://www.weather.gov/psr/Climate

## Safety

- Safety: `TCI=72` and `CrimeRating=Moderate`.
- According to City of Mesa Data Hub and Mesa PD NIBRS reporting, Mesa maintains lower violent (4.83 per 1,000) and property crime rates (14.65 per 1,000) than the national average for large US cities (population 500k-650k).
- Sources:
  - https://data.mesaaz.gov/
  - https://www.mesaaz.gov/government/police

## Economic Hubs and Defense Footprint

- Defense Hub (`DefenseHub=Yes` / `defense_hub_manual = true`): Boeing operates a massive aerospace manufacturing plant in Mesa (~5,000 employees), serving as the global production assembly site for the AH-64 Apache helicopter and advanced composite components.
- Tech Hub (`TechHub=Yes`): Major semiconductor, aerospace, and software employer presence in the Mesa/East Valley tech corridor.
- Sources:
  - https://www.boeing.com/
  - https://www.selectmesa.com/
