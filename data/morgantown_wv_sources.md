# Morgantown, WV Source Notes

Retrieval date: 2026-08-20.

## Geography

- Primary geography: Morgantown city/place, WV, in Monongalia County. The row represents the city, not the MSA.
- Census place GEOID: 5455756. County FIPS: 54061. CBSA: Morgantown, WV MSA (34060).
- Census 2024 Gazetteer place centroid (from `data/sources/pace/derived/pace_derived.json`): 39.637487, -79.946856.
- Population: U.S. Census QuickFacts reports Morgantown city population estimate 30,293 for July 1, 2025 (V2025). 2020 Census population 30,347. 2020 land area 10.19 square miles. FIPS 5455756.
- Stored density is calculated from the 2025 estimate divided by 2020 land area: 30,293 / 10.19 = 2,972.8, stored as 2,973 people per square mile. QuickFacts' 2020 Census density is 2,977.5.
- Pace: project classifier handles pace after import. Do not infer pace from population or density.

## Cost, Taxes, and Housing

- Zillow Home Value Index city page for Morgantown reports a typical home value of $274,455. Stored `AvgHomeValue` is `$274,455`. This is ZHVI / typical home value, not an average sale price. ZIP 26508 on the same date was higher ($332,703) and is not used.
- `CostOfLiving` / `col_index` is BEA Regional Price Parities, not a consumer cost-of-living site. BEA MARPP 2024 all-items RPP for Morgantown, WV MSA (GeoFIPS 34060) is 93.323, stored as 93. That is metro geography, not a city-only index. Phase 2 should run `scripts/import-bea-rpp.ts` then `scripts/sync-col-index-from-rpp.ts` so the live `col_index` is derived from `location_cost_rpp.all_items_rpp`.
- West Virginia state consumers sales and service tax is 6%. The West Virginia Tax Division municipal sales-and-use-tax table lists Morgantown at a 1% municipal rate effective July 1, 2020, combined rate 7%. Stored SalesTax is 7.
- West Virginia top individual income tax for TY2026 is 4.58% on taxable income over $60,000 after the SB 392 5% across-the-board cut (W. Va. Code § 11-21-4j, retroactive to January 1, 2026). This is state-owned; `scripts/import-csv.ts` will not write it.
- Gas uses AAA Morgantown metro regular average $4.1729 on 2026-08-20, rounded to `$4.17`. Statewide WV regular average the same day was $3.8735.

## VA and Veteran Benefits

- Nearest outpatient-capable VA site: Monongalia County VA Clinic, 40 Commerce Drive, Suite 101, Westover, WV 26501-3952. Official VA Clarksburg Health Care page lists primary care, mental health, diagnostics, X-ray, and immunizations. Westover is a separate municipality immediately west of Morgantown.
- Crow-fly from the Census place centroid (39.637487, -79.946856) to the Westover clinic address is about 1 mile. Stored `DistanceToVA` is `1 miles`. The VHA VAST sync should replace this with the official facility-coordinate distance after import.
- `VA=Y` because the outpatient clinic is well inside the 25-mile crow-fly gate.
- Nearest VA medical center: Louis A. Johnson Veterans' Administration Medical Center, 1 Medical Center Drive, Clarksburg, WV 26301-4155, about 34 miles crow-fly from the Morgantown centroid. Not stored in the CSV nearest-VA pair; the hospital pair is owned by `scripts/sync-va-facilities.ts`.
- Morgantown Vet Center (34 Commerce Drive, counseling, non-medical) is not used as `nearest_va`.
- West Virginia veterans benefits (state-owned; CSV summary is documentation only):
  - Military retired pay is fully exempt from state income tax, no cap (W. Va. Code § 11-21-12; repo `data/state_retired_pay_tax.csv` verified 2026-08-11).
  - Refundable personal income-tax credit equal to timely paid homestead real-property tax for honorably discharged veterans rated 90% or greater service-connected disability (W. Va. Code § 11-13MM-4).
  - Employment preference, education assistance, vehicle tags, and hunting/fishing privileges per the existing WV row in `data/state_vet_benefits.csv`.

## Climate

- NOAA/NCEI 1991-2020 Climate Normals station: USW00013736, Morgantown Hart Field (Morgantown Municipal Airport). Station location 39.6428 N, 79.9164 W, elev. 1,240 ft. PDF generated 2026-08-20.
- Monthly normals: January low 24.0 F, July high 84.4 F, annual precipitation 43.15 inches. Stored rounded fields: Rain 43, AverageLowWinter 24, AverageHighSummer 84.
- Annual snowfall is missing from the 1991-2020 monthly normals for this station (blank / insufficient occurrences). Stored Snow 28 uses the NOAA 1981-2010 normals for the same station, annual snowfall 27.6 inches, rounded. BestPlaces city climate independently reports 27.5 inches.
- Sunny days use BestPlaces Morgantown city climate of 155 sunny days per year because NOAA monthly normals do not include annual sunny-day counts. ZIP 26505 BestPlaces reports 153; the city comparison figure 155 is stored.
- Summer humidity uses Timeanddate Morgantown July climate average humidity of 71% (1992–2021 station reports). NOAA monthly normals do not carry relative humidity.
- Climate label is humid subtropical. With Snow 28, AverageLowWinter 24, AverageHighSummer 84, and HumiditySummer 71, the project categorizer classifies Morgantown as `cold_snowy` (four seasons): winter low ≤ 25 F and snow ≥ 15 inches.

## Politics

- Election geography: Monongalia County, WV. This is a county-level political proxy and the row labels `CityPolitics` accordingly. Morgantown is a WVU college town and may vote to the left of the county; a durable official city/precinct presidential crosswalk was not obtained, so city-level results are not asserted.
- Denominator: two-party presidential vote for trend math and stored winner percentages.
- 2016 Monongalia County official results (WV Secretary of State): Trump 18,432; Clinton 14,699. Two-party total 33,131. Trump two-party share = 55.63%, rounded winner percent 56.
- 2024 Monongalia County certified canvass: Trump 21,084; Harris 19,265. Two-party total 40,349. Trump two-party share = 52.25%, rounded winner percent 52.
- Trend: Republican two-party share decreased 3.4 pp; Democratic two-party share increased 3.4 pp. Stored ElectionChange: `3.4 pp more Democratic since 2016`.
- `CityPolitics` uses the 2024 two-party share (52.3% Republican) against the documented 51–54.9% band: `County-level: Moderately Conservative`.
- State party/governor: Patrick Morrisey, Republican, took office January 13, 2025. These are state-owned legacy CSV fields and are not written by `scripts/import-csv.ts`.

## Safety and Social

- TCI method: OpenCrime / PlainCrime expose FBI UCR 2024 city/agency-level violent-crime rates for Morgantown, WV.
- OpenCrime reports 64 violent crimes, population 30,510, violent-crime rate 209.8 per 100,000, and national average 359.1 per 100,000. PlainCrime reports the same 209.8 rate.
- TCI = 209.8 / 359.1 * 100 = 58.4, stored as 58. CrimeRating stored as Low.
- This `TCI` field is a violent-crime index, not a total/property-crime index. OpenCrime reports 598 property crimes / 1,960.0 per 100,000 in 2024. Violent-crime count fell from 105 in 2023 to 64 in 2024.
- Marijuana status: Medical, matching `data/state_owned_marijuana_status_2026-08-17.csv` (NCSL, verified 2026-08-17). State-owned; importer ignores the CSV column.
- LGBTQ: HRC 2025 Morgantown Municipal Equality Index final score is 115 (city-hosted scorecard; Dominion Post reports 115, up from 110 in 2024; West Virginia’s only 2025 “perfect” base-score city in that article). MAP West Virginia Equality Profile overall policy score 0.25/49, Low. Stored LGBTQ rating and LGBTQ_MEI are both `115`. Fit-score parsing clamps the 0–100 rating at 100. `LGBTQStatePolicyScore` 0.25 is state-owned and is not written by the importer.

## Economic Hubs, Amenities, and Lifestyle

- TechHub=N. WVU and the National Energy Technology Laboratory (DOE, not a software/IT employment hub) are the distinctive local institutions. No BLS or economic-development evidence of a broad technology-employment hub was found.
- DefenseHub=N. No city-level military installation or physical defense-contractor cluster was verified. NETL is a Department of Energy lab, not DoD. `DefenseHub=N` writes a reviewed manual false, and `scripts/recompute-defense-hub.ts` owns the derived `defense_hub` column.
- HasWalmart=Y. Walmart’s official store page lists Supercenter #2083, Morgantown Retail Circle Supercenter, 75 Retail Circle, Morgantown, WV 26508. A City of Morgantown Board of Zoning Appeals case (V17-26) treats that parcel as in-city B-5 Shopping Center District, so this is in-city, not a neighboring suburb. Supercenter #3215 at University Town Centre Drive is labeled Westover by WV DOT and was not used as the in-city proof.
- HasCostco=N. Costco’s warehouse locator has no West Virginia warehouse; the nearest listed warehouse for this area is West Homestead, PA. `HasCostco=N` means no official in-city warehouse page as of 2026-08-20.
- Tags: Healthcare (WVU Medicine J.W. Ruby Memorial Hospital, 1 Medical Center Drive, Morgantown), Culture (WVU college-town civic/arts setting; HRC MEI participation), Hiking and Mountains (Coopers Rock State Forest, 12,747 acres, ~13 miles east via I-68 Exit 15, 50+ miles of trails), Fishing (Cheat Lake Park fishing pier and shoreline, ~10 miles east).

## Source URLs

- Census QuickFacts Morgantown: https://www.census.gov/quickfacts/fact/table/morgantowncitywestvirginia/PST045225
- Zillow Morgantown ZHVI: https://www.zillow.com/home-values/53415/morgantown-wv/
- BEA MARPP Morgantown, WV MSA all-items 2024: `data/sources/rpp/MARPP_MSA_2008_2024.csv` (GeoFIPS 34060)
- WV Tax Division sales and use tax (6% state): https://tax.wv.gov/Business/SalesAndUseTax/Pages/SalesAndUseTax.aspx
- WV Tax Division municipal sales and use tax table (Morgantown 1% / combined 7%, July 1, 2020): https://tax.wv.gov/Business/SalesAndUseTax/MunicipalSalesAndUseTax/Pages/MunicipalSalesAndUseTax.aspx
- WVU Shared Services Morgantown municipal sales-tax FAQ: https://wvusharedservices.wvu.edu/s/article/Morgantown-Municipal-Sales-Tax
- WV Tax Division 2026 income-tax rate cut (top rate 4.58%): https://tax.wv.gov/Individuals/Pages/PersonalIncomeTaxReductionBill.aspx
- AAA West Virginia / Morgantown gas prices: https://gasprices.aaa.com/?state=WV
- Monongalia County VA Clinic: https://www.va.gov/clarksburg-health-care/locations/monongalia-county-va-clinic/
- VA Clarksburg locations: https://www.va.gov/clarksburg-health-care/locations/
- Louis A. Johnson VA Medical Center: https://www.va.gov/clarksburg-health-care/locations/louis-a-johnson-veterans-administration-medical-center/
- Morgantown Vet Center (not used as nearest VA): https://www.va.gov/morgantown-vet-center/
- WV military retired-pay exemption: https://code.wvlegislature.gov/11-21-12/
- WV disabled-veteran homestead tax credit: https://code.wvlegislature.gov/11-13MM/
- NOAA/NCEI 1991-2020 monthly normals (JSON): https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00013736&startDate=2010-01-01&endDate=2010-12-31&format=json
- NOAA/NCEI 1991-2020 monthly normals PDF: https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly-1991-2020&stations=USW00013736&format=pdf&startDate=0001-01-01&endDate=9996-12-31
- NOAA/NCEI 1981-2010 monthly normals (snowfall): https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-monthly&stations=USW00013736&format=pdf&startDate=0001-01-01&endDate=9996-12-31
- BestPlaces Morgantown climate (sunny days / snow cross-check): https://www.bestplaces.net/climate/?c1=53977000&c2=55455756
- Timeanddate Morgantown climate (July humidity): https://www.timeanddate.com/weather/usa/morgantown/climate
- WV Secretary of State 2016 Monongalia official results: https://apps.sos.wv.gov/elections/results/results.aspx?county=Monongalia&eid=23&type=OFFICIAL&year=2016
- Monongalia County 2024 certified general-election returns PDF: https://www.monongaliacountyclerk.org/myfiles/elections/2024General/Certified_Results_for_2024_General_Election.pdf
- Monongalia County 2024 election summary PDF: https://www.monongaliacountyclerk.org/myfiles/elections/2024General/Election_Summary/24GeneralElectionSummary.pdf
- WV Governor Patrick Morrisey: https://governor.wv.gov/about-us
- OpenCrime Morgantown FBI UCR mirror: https://www.opencrime.us/cities/morgantown-west-virginia
- PlainCrime Morgantown FBI UCR mirror: https://plaincrime.com/city/morgantown-wv
- FBI 2024 national crime release (359.1 baseline used across this dataset): https://www.fbi.gov/news/press-releases/fbi-releases-2024-reported-crimes-in-the-nation-statistics
- City of Morgantown 2025 MEI scorecard PDF: https://www.morgantownwv.gov/DocumentCenter/View/6241/2025-MEI-Final-Morgantown-WV-1
- Dominion Post MEI 2025 coverage: https://www.dominionpost.com/2025/11/21/city-ranks-nationally-in-annual-lgbtq-equality-index/
- MAP West Virginia Equality Profile: https://mapresearch.org/equality-profiles/wv/
- Walmart Supercenter #2083 pharmacy page (75 Retail Circle): https://www.walmart.com/store/2083-morgantown-wv/pharmacy
- City of Morgantown BZA case V17-26 (75 Retail Circle in-city zoning): http://morgantownwv.gov/DocumentCenter/View/1480/V17-26_Walmart_75-Retail-Circle
- Costco warehouse locator: https://www.costco.com/Warehouse/locator.aspx
- WVU Medicine J.W. Ruby Memorial Hospital: https://wvumedicine.org/ruby-memorial/
- Coopers Rock State Forest (WV Division of Forestry): https://wvforestry.com/west-virginia-state-forests/coopers-rock-state-forest/
- Coopers Rock State Forest (WV State Parks): https://wvstateparks.com/parks/coopers-rock-state-forest/
- Cheat Lake Park and Trail: https://www.visitmountaineercountry.com/business/cheat-lake-park-and-trail/

## Known Limitations

- City-level crime data is sourced from FBI UCR mirrors because a direct live FBI CDE API pull was not used. The notes preserve the exact rate, denominator, and mirror sources.
- 1991-2020 NOAA snowfall is missing for USW00013736; Snow uses the prior 1981-2010 normal (27.6 in) rather than guessing a 1991-2020 value.
- `SunnyDays` and `HumiditySummer` are secondary (BestPlaces / Timeanddate) because NOAA monthly normals do not publish those elements.
- `CityPolitics` and presidential shares are county-level. Precinct returns for Morgantown city were not obtained; the college-town vs county divergence is noted, not quantified.
- `DistanceToVA` is a researched crow-fly estimate from the Census centroid to the Westover clinic address. The official VHA sync should overwrite it in phase 2.
- `CostOfLiving` 93 is the BEA 2024 MSA all-items RPP, not a city-only index. Live `col_index` should be refreshed from `location_cost_rpp` after import.
- `HasCostco=N` should be rechecked if Costco announces a West Virginia warehouse.
- State-owned fields (`StateParty`, `Governor`, `Income`, `Veterans Benefits`, `Marijuana`, `LGBTQStatePolicyScore`) are documented here and in the CSV for review; the importer intentionally does not write them.
