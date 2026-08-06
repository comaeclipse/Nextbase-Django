import { bandForValue, type StateValue } from "@/lib/critters";

type VeteranBenefitsRow = [name: string, state: string, score: number, rank: number];

const ROWS: VeteranBenefitsRow[] = [
  ["Texas", "TX", 97, 1], ["Florida", "FL", 93, 2], ["Illinois", "IL", 93, 3], ["Alabama", "AL", 86, 4], ["Louisiana", "LA", 86, 5],
  ["New Mexico", "NM", 84, 6], ["Virginia", "VA", 81, 7], ["Oklahoma", "OK", 81, 8], ["Utah", "UT", 81, 9], ["Wisconsin", "WI", 80, 10],
  ["Nebraska", "NE", 80, 11], ["South Carolina", "SC", 78, 12], ["Arkansas", "AR", 78, 13], ["Mississippi", "MS", 78, 14], ["Iowa", "IA", 78, 15],
  ["Michigan", "MI", 78, 16], ["South Dakota", "SD", 78, 17], ["Arizona", "AZ", 78, 18], ["Alaska", "AK", 78, 19], ["Minnesota", "MN", 78, 20],
  ["Washington", "WA", 77, 21], ["New Jersey", "NJ", 75, 22], ["Connecticut", "CT", 75, 23], ["Maryland", "MD", 74, 24], ["Indiana", "IN", 72, 25],
  ["Hawaii", "HI", 71, 26], ["New York", "NY", 70, 27], ["Nevada", "NV", 70, 28], ["Pennsylvania", "PA", 67, 29], ["North Dakota", "ND", 67, 30],
  ["California", "CA", 66, 31], ["West Virginia", "WV", 66, 32], ["Tennessee", "TN", 65, 33], ["Ohio", "OH", 64, 34], ["Massachusetts", "MA", 64, 35],
  ["Wyoming", "WY", 63, 36], ["New Hampshire", "NH", 62, 37], ["Colorado", "CO", 60, 38], ["Georgia", "GA", 60, 39], ["Maine", "ME", 59, 40],
  ["Kansas", "KS", 58, 41], ["Missouri", "MO", 57, 42], ["Kentucky", "KY", 56, 43], ["Rhode Island", "RI", 56, 44], ["Vermont", "VT", 56, 45],
  ["Montana", "MT", 55, 46], ["North Carolina", "NC", 54, 47], ["Oregon", "OR", 53, 48], ["Idaho", "ID", 50, 49], ["Delaware", "DE", 43, 50],
];

export type VeteranBenefitsState = StateValue;

export const VETERAN_BENEFITS_DATA: VeteranBenefitsState[] = ROWS.map(([name, state, value, rank]) => ({
  name,
  state,
  value,
  rank,
  band: bandForValue(value),
  displayBand: value >= 80 ? "Exceptional" : value >= 70 ? "Strong" : value >= 60 ? "Competitive" : "Limited",
}));

export const PROFILE_CONTEXT = [
  { id: "overall", label: "Overall benefits", winner: "Texas", state: "TX", score: "97", note: "The strongest all-around package in the supplied 2026 ranking." },
  { id: "general", label: "General veteran", winner: "South Dakota", state: "SD", score: "93.3", note: "Strong education, recreation, employment, direct support, and no income tax." },
  { id: "retiree", label: "Military retiree", winner: "South Dakota", state: "SD", score: "97.3", note: "No income tax plus unusually strong general-veteran programs." },
  { id: "50-percent", label: "Rated 50% disabled", winner: "Alaska", state: "AK", score: "85.1", note: "A $150,000 assessed-value property exemption starts at a 50% disability rating." },
  { id: "pt", label: "100% P&T / TDIU", winner: "Texas", state: "TX", score: "97.5", note: "Full homestead relief, no pension tax, family tuition, and survivor continuation." },
  { id: "survivor", label: "Survivor or dependent", winner: "Texas", state: "TX", score: "95.0", note: "Hazlewood education help, survivor property continuation, and tax treatment." },
  { id: "college", label: "College for children", winner: "Indiana", state: "IN", score: "94.2", note: "Exceptionally broad tuition-remission categories for spouses and children." },
  { id: "partial", label: "Homeowner below 100%", winner: "New Mexico / Utah", state: "NM", score: "83.2 / 82.3", note: "Both offer proportional property relief at 50%, rather than waiting for 100%." },
] as const;

export const BENEFIT_CATEGORIES = [
  ["Military retirement and SBP tax", 20],
  ["100% P&T/TDIU property relief", 24],
  ["Partial-disability property relief", 10],
  ["Veteran education", 8],
  ["Dependent and survivor education", 14],
  ["Vehicle and registration", 6],
  ["Employment and licensing", 6],
  ["Recreation", 4],
  ["Cash and state support", 4],
  ["Survivor continuation", 4],
] as const;
