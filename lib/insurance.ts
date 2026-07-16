import { bandForValue, type BandName, type StateValue } from "@/lib/critters";

export type InsuranceStateValue = StateValue & {
  annualPremium: number;
  monthlyPremium: number;
  nationalDifference: number;
};

export type InsuranceDataset = {
  id: "home" | "auto";
  label: string;
  available: boolean;
  metricLabel: string;
  unit: string;
  blurb: string;
  dataVintage: string;
  nationalAverage: number;
  sources: { label: string; href: string; detail: string }[];
  methodology: string;
  limitations: string;
  data: InsuranceStateValue[];
};

const HOME_PREMIUMS: [string, string, number, number][] = [
  ["Alabama", "AL", 3633, 12], ["Alaska", "AK", 1397, 45], ["Arizona", "AZ", 2344, 26], ["Arkansas", "AR", 3733, 11], ["California", "CA", 1616, 40],
  ["Colorado", "CO", 4963, 5], ["Connecticut", "CT", 1905, 33], ["Delaware", "DE", 1374, 46], ["Florida", "FL", 7136, 1], ["Georgia", "GA", 2323, 27],
  ["Hawaii", "HI", 659, 50], ["Idaho", "ID", 2240, 28], ["Illinois", "IL", 2643, 23], ["Indiana", "IN", 2887, 20], ["Iowa", "IA", 2902, 19],
  ["Kansas", "KS", 5260, 3], ["Kentucky", "KY", 4042, 8], ["Louisiana", "LA", 5986, 2], ["Maine", "ME", 1335, 47], ["Maryland", "MD", 1918, 32],
  ["Massachusetts", "MA", 1483, 43], ["Michigan", "MI", 2924, 18], ["Minnesota", "MN", 2729, 22], ["Mississippi", "MS", 2529, 24], ["Missouri", "MO", 3979, 9],
  ["Montana", "MT", 3215, 13], ["Nebraska", "NE", 4553, 6], ["Nevada", "NV", 1774, 37], ["New Hampshire", "NH", 1300, 48], ["New Jersey", "NJ", 1421, 44],
  ["New Mexico", "NM", 2869, 21], ["New York", "NY", 1683, 39], ["North Carolina", "NC", 3124, 14], ["North Dakota", "ND", 2982, 15], ["Ohio", "OH", 2118, 29],
  ["Oklahoma", "OK", 5010, 4], ["Oregon", "OR", 1572, 41], ["Pennsylvania", "PA", 1529, 42], ["Rhode Island", "RI", 2445, 25], ["South Carolina", "SC", 2974, 16],
  ["South Dakota", "SD", 3760, 10], ["Tennessee", "TN", 2958, 17], ["Texas", "TX", 4085, 7], ["Utah", "UT", 1814, 35], ["Vermont", "VT", 1063, 49],
  ["Virginia", "VA", 2074, 31], ["Washington", "WA", 1753, 38], ["West Virginia", "WV", 1860, 34], ["Wisconsin", "WI", 1812, 36], ["Wyoming", "WY", 2075, 30],
];

const MIN_PREMIUM = 659;
const MAX_PREMIUM = 7136;
const NATIONAL_AVERAGE = 2543;

function insuranceIndex(premium: number) {
  return Math.round(
    100 *
      (Math.log(premium) - Math.log(MIN_PREMIUM)) /
      (Math.log(MAX_PREMIUM) - Math.log(MIN_PREMIUM))
  );
}

const HOME_DATA: InsuranceStateValue[] = HOME_PREMIUMS.map(
  ([name, state, annualPremium, rank]) => {
    const value = insuranceIndex(annualPremium);
    return {
      name,
      state,
      value,
      rank,
      band: bandForValue(value),
      annualPremium,
      monthlyPremium: Math.round(annualPremium / 12),
      nationalDifference: Math.round(
        ((annualPremium - NATIONAL_AVERAGE) / NATIONAL_AVERAGE) * 100
      ),
    };
  }
);

export const INSURANCE_DATASETS: InsuranceDataset[] = [
  {
    id: "home",
    label: "Home insurance",
    available: true,
    metricLabel: "Homeowners insurance cost index",
    unit: "0-100 index",
    blurb:
      "A higher score means a higher standardized annual homeowners premium. Dollar estimates remain visible because the index is a comparison aid, not a quote.",
    dataVintage: "2026 standardized benchmark",
    nationalAverage: NATIONAL_AVERAGE,
    sources: [
      { label: "Insurance.com / Quadrant Information Services", href: "https://www.insurance.com/home-and-renters-insurance/home-insurance-basics/average-homeowners-insurance-rates-by-state", detail: "Primary 2026 state premiums and policy assumptions." },
      { label: "NerdWallet / Quadrant", href: "https://www.nerdwallet.com/insurance/homeowners/learn/average-homeowners-insurance-cost", detail: "Cross-check of national scale and broad high/low ordering." },
      { label: "Bankrate / Quadrant", href: "https://www.bankrate.com/insurance/homeowners-insurance/homeowners-insurance-cost/", detail: "National-level reasonableness check." },
      { label: "National Association of Insurance Commissioners", href: "https://content.naic.org/article/naic-releases-homeowners-insurance-report-2022", detail: "Authoritative historical premium and exposure context; not used as the 2026 map base." },
    ],
    methodology:
      "Insurance.com’s 2026 benchmark uses $300,000 dwelling coverage, $300,000 liability, a $1,000 deductible, good credit, and a 2% hurricane deductible where applicable. The 50 states are ranked by annual premium. The map score is a natural-log min-max transformation from Hawaii’s $659 to Florida’s $7,136, rounded to a whole number; this retains the premium order without flattening most states near the low end.",
    limitations:
      "This is a standardized market estimate, not a quote or a measure of insurer availability. ZIP code, replacement cost, construction, roof age, claims, deductibles, credit rules, discounts and local hazards can materially change a household’s price. Flood, earthquake, wind-only and hurricane coverage may be separate. Hawaii’s underlying standard rate excludes hurricane damage, so its score understates a fully hurricane-insured package.",
    data: HOME_DATA,
  },
  {
    id: "auto",
    label: "Car insurance",
    available: false,
    metricLabel: "Car insurance cost index",
    unit: "0-100 index",
    blurb: "A comparable 50-state auto-insurance dataset will be added here.",
    dataVintage: "Coming soon",
    nationalAverage: 0,
    sources: [],
    methodology: "Not yet available.",
    limitations: "Not yet available.",
    data: [],
  },
];

export const HOME_INSURANCE_DATASET = INSURANCE_DATASETS[0];
export type { BandName };
