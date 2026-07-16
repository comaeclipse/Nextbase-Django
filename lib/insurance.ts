import { bandForValue, type StateValue } from "@/lib/critters";

export type InsuranceStateValue = StateValue & {
  annualPremium: number;
  sixMonthPremium?: number;
  monthlyPremium: number;
  nationalDifference: number;
  insureComAnnual?: number;
  nerdwalletAnnual?: number;
};

export type InsuranceDataset = {
  id: "home" | "auto";
  label: string;
  metricLabel: string;
  unit: string;
  blurb: string;
  dataVintage: string;
  nationalAverage: number;
  benchmarkLabel: string;
  profile: string;
  sources: { label: string; href: string; detail: string }[];
  methodology: string;
  limitations: string;
  data: InsuranceStateValue[];
};

const HOME_PREMIUMS: [string, string, number, number][] = [
  ["Alabama", "AL", 3633, 12], ["Alaska", "AK", 1397, 45], ["Arizona", "AZ", 2344, 26], ["Arkansas", "AR", 3733, 11], ["California", "CA", 1616, 40], ["Colorado", "CO", 4963, 5], ["Connecticut", "CT", 1905, 33], ["Delaware", "DE", 1374, 46], ["Florida", "FL", 7136, 1], ["Georgia", "GA", 2323, 27], ["Hawaii", "HI", 659, 50], ["Idaho", "ID", 2240, 28], ["Illinois", "IL", 2643, 23], ["Indiana", "IN", 2887, 20], ["Iowa", "IA", 2902, 19], ["Kansas", "KS", 5260, 3], ["Kentucky", "KY", 4042, 8], ["Louisiana", "LA", 5986, 2], ["Maine", "ME", 1335, 47], ["Maryland", "MD", 1918, 32], ["Massachusetts", "MA", 1483, 43], ["Michigan", "MI", 2924, 18], ["Minnesota", "MN", 2729, 22], ["Mississippi", "MS", 2529, 24], ["Missouri", "MO", 3979, 9], ["Montana", "MT", 3215, 13], ["Nebraska", "NE", 4553, 6], ["Nevada", "NV", 1774, 37], ["New Hampshire", "NH", 1300, 48], ["New Jersey", "NJ", 1421, 44], ["New Mexico", "NM", 2869, 21], ["New York", "NY", 1683, 39], ["North Carolina", "NC", 3124, 14], ["North Dakota", "ND", 2982, 15], ["Ohio", "OH", 2118, 29], ["Oklahoma", "OK", 5010, 4], ["Oregon", "OR", 1572, 41], ["Pennsylvania", "PA", 1529, 42], ["Rhode Island", "RI", 2445, 25], ["South Carolina", "SC", 2974, 16], ["South Dakota", "SD", 3760, 10], ["Tennessee", "TN", 2958, 17], ["Texas", "TX", 4085, 7], ["Utah", "UT", 1814, 35], ["Vermont", "VT", 1063, 49], ["Virginia", "VA", 2074, 31], ["Washington", "WA", 1753, 38], ["West Virginia", "WV", 1860, 34], ["Wisconsin", "WI", 1812, 36], ["Wyoming", "WY", 2075, 30],
];

const AUTO_PREMIUMS: [string, string, number, number, number, number, number, number, number][] = [
  ["Florida","FL",1,100,3628,1814,302.33,3852,3854],["Louisiana","LA",2,90,3396,1698,283,4180,4482],["Kentucky","KY",3,69,2934,1467,244.5,2976,3006],["Missouri","MO",4,67,2880,1440,240,2410,2682],["Colorado","CO",5,64,2808,1404,234,3222,3204],["Nevada","NV",6,63,2798,1399,233.17,3284,2830],["Rhode Island","RI",7,58,2692,1346,224.33,2706,2670],["Georgia","GA",8,56,2642,1321,220.17,2739,3244],["New York","NY",9,55,2626,1313,218.83,2898,2705],["Michigan","MI",10,55,2624,1312,218.67,3146,2984],
  ["Delaware","DE",11,55,2610,1305,217.5,3097,2394],["Arkansas","AR",12,53,2560,1280,213.33,2723,2522],["Texas","TX",13,51,2518,1259,209.83,2631,3277],["Connecticut","CT",14,50,2512,1256,209.33,2726,2614],["New Jersey","NJ",15,48,2460,1230,205,2736,3835],["Oklahoma","OK",16,46,2412,1206,201,2705,2528],["Arizona","AZ",17,46,2404,1202,200.33,2333,2978],["Maryland","MD",18,45,2384,1192,198.67,2273,2766],["South Carolina","SC",19,44,2378,1189,198.17,2367,2509],["Kansas","KS",20,42,2322,1161,193.5,2410,2448],
  ["California","CA",21,41,2306,1153,192.17,3010,1898],["Pennsylvania","PA",22,41,2290,1145,190.83,2428,2225],["Utah","UT",23,38,2232,1116,186,2250,2565],["Montana","MT",24,37,2212,1106,184.33,2541,2776],["Mississippi","MS",25,36,2188,1094,182.33,2455,2446],["Washington","WA",26,36,2182,1091,181.83,2175,2360],["West Virginia","WV",27,33,2110,1055,175.83,2557,2071],["Nebraska","NE",28,32,2094,1047,174.5,2387,1912],["North Dakota","ND",29,31,2082,1041,173.5,2079,2160],["Minnesota","MN",30,31,2076,1038,173,2561,2414],
  ["Illinois","IL",31,29,2036,1018,169.67,1901,2468],["South Dakota","SD",32,29,2028,1014,169,2635,2060],["Tennessee","TN",33,29,2022,1011,168.5,2214,2118],["Alaska","AK",34,28,2012,1006,167.67,2215,1856],["New Mexico","NM",35,27,1976,988,164.67,2486,2198],["Alabama","AL",36,26,1972,986,164.33,2107,2134],["Oregon","OR",37,26,1958,979,163.17,1927,2144],["Virginia","VA",38,22,1882,941,156.83,1837,2064],["Wisconsin","WI",39,17,1754,877,146.17,2026,2254],["Iowa","IA",40,15,1720,860,143.33,2228,2186],
  ["Massachusetts","MA",41,15,1710,855,142.5,2430,1851],["Indiana","IN",42,13,1680,840,140,1856,2005],["Wyoming","WY",43,10,1598,799,133.17,1984,1148],["Hawaii","HI",44,9,1572,786,131,1721,1998],["Idaho","ID",45,7,1546,773,128.83,1791,1832],["Maine","ME",46,7,1538,769,128.17,1701,1598],["North Carolina","NC",47,6,1516,758,126.33,2587,1793],["Ohio","OH",48,6,1510,755,125.83,1739,1748],["New Hampshire","NH",49,4,1476,738,123,1650,1555],["Vermont","VT",50,0,1378,689,114.83,1504,1410],
];

const HOME_AVERAGE = 2543;
const AUTO_AVERAGE = Math.round(AUTO_PREMIUMS.reduce((total, row) => total + row[4], 0) / AUTO_PREMIUMS.length);
const homeIndex = (premium: number) => Math.round(100 * (Math.log(premium) - Math.log(659)) / (Math.log(7136) - Math.log(659)));

const HOME_DATA: InsuranceStateValue[] = HOME_PREMIUMS.map(([name, state, annualPremium, rank]) => ({ name, state, rank, value: homeIndex(annualPremium), band: bandForValue(homeIndex(annualPremium)), annualPremium, monthlyPremium: Math.round(annualPremium / 12), nationalDifference: Math.round(((annualPremium - HOME_AVERAGE) / HOME_AVERAGE) * 100) }));
const AUTO_DATA: InsuranceStateValue[] = AUTO_PREMIUMS.map(([name, state, rank, value, annualPremium, sixMonthPremium, monthlyPremium, insureComAnnual, nerdwalletAnnual]) => ({ name, state, rank, value, band: bandForValue(value), annualPremium, sixMonthPremium, monthlyPremium, insureComAnnual, nerdwalletAnnual, nationalDifference: Math.round(((annualPremium - AUTO_AVERAGE) / AUTO_AVERAGE) * 100) }));

export const INSURANCE_DATASETS: InsuranceDataset[] = [
  {
    id: "home", label: "Homeowners", metricLabel: "Homeowners insurance cost index", unit: "0-100 index", dataVintage: "2026 standardized benchmark", nationalAverage: HOME_AVERAGE, benchmarkLabel: "Annual homeowners premium", profile: "$300K dwelling, $300K liability, $1K deductible, good credit; 2% hurricane deductible where applicable.",
    blurb: "Higher scores represent higher standardized annual homeowners premiums. Dollar estimates remain visible because the index is a comparison aid, not a quote.",
    sources: [{ label: "Insurance.com / Quadrant Information Services", href: "https://www.insurance.com/home-and-renters-insurance/home-insurance-basics/average-homeowners-insurance-rates-by-state", detail: "Primary 2026 state premiums and policy assumptions." }, { label: "NerdWallet / Quadrant", href: "https://www.nerdwallet.com/insurance/homeowners/learn/average-homeowners-insurance-cost", detail: "Cross-check of national scale and broad high/low ordering." }, { label: "Bankrate / Quadrant", href: "https://www.bankrate.com/insurance/homeowners-insurance/homeowners-insurance-cost/", detail: "National-level reasonableness check." }, { label: "National Association of Insurance Commissioners", href: "https://content.naic.org/article/naic-releases-homeowners-insurance-report-2022", detail: "Authoritative historical context; not used as the 2026 map base." }],
    methodology: "The 50 states are ranked by annual premium. Scores use a natural-log min-max transformation from Hawaii's $659 to Florida's $7,136 and are rounded to a whole number, preserving premium order without flattening most states near the low end.",
    limitations: "This standardized market estimate is not a quote or measure of insurer availability. ZIP code, replacement cost, construction, roof age, claims, deductibles, credit rules, discounts and local hazards matter. Flood, earthquake, wind-only and hurricane coverage may be separate; Hawaii's standard rate excludes hurricane damage.", data: HOME_DATA,
  },
  {
    id: "auto", label: "Car", metricLabel: "Car insurance cost index", unit: "0-100 index", dataVintage: "2026 standardized full-coverage benchmark", nationalAverage: AUTO_AVERAGE, benchmarkLabel: "Annualized full-coverage premium", profile: "30-year-old single male, good credit, clean record, 2015 Honda Accord, 50/100/50 liability limits, and $500 comprehensive/collision deductibles; sampled across 34,000+ ZIP codes.",
    blurb: "Higher scores represent higher standardized annual full-coverage car-insurance premiums. The underlying six-month quote and independent comparison figures are available after selecting a state.",
    sources: [{ label: "The Zebra — Car Insurance Rates by State", href: "https://www.thezebra.com/states/", detail: "Primary six-month state premium table." }, { label: "The Zebra — Data Methodology", href: "https://www.thezebra.com/about/methodology/", detail: "Primary profile and ZIP-code sampling methodology." }, { label: "NerdWallet — Average Cost of Car Insurance", href: "https://www.nerdwallet.com/insurance/auto/average-car-insurance-cost", detail: "2026 median-rate cross-check; not averaged into the score." }, { label: "Insure.com — Average Car Insurance Cost", href: "https://www.insure.com/car-insurance/average-car-insurance-cost/", detail: "2026 annual-rate cross-check; not averaged into the score." }, { label: "NAIC — 2022/2023 Auto Insurance Database", href: "https://content.naic.org/article/naic-releases-20222023-auto-insurance-database-report", detail: "Official historical context; not used as the current benchmark." }],
    methodology: "The Zebra's published six-month full-coverage premium is annualized by multiplying by two. States are ranked from highest to lowest annualized premium. Scores use linear min-max normalization from Vermont's $1,378 (0) to Florida's $3,628 (100); the 2.63x range does not require the logarithmic compression used for homeowners insurance. NerdWallet and Insure.com fields validate the broad pattern but are not averaged because their profiles and calculations differ.",
    limitations: "This statewide standardized benchmark is not a personalized quote. ZIP code, age, credit, gender, vehicle, mileage, driving history, coverage requirements and carrier availability can materially change a premium. 'Full coverage' is not a single legally uniform policy; PIP and uninsured-motorist rules vary by state. Premiums change frequently and should be refreshed at least annually.", data: AUTO_DATA,
  },
];

export const HOME_INSURANCE_DATASET = INSURANCE_DATASETS[0];
