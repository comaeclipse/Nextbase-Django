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

/**
 * State benefits key off *status*, not goals — so the selector is one axis of four
 * mutually exclusive statuses. A status gets a second axis only where the answer
 * actually changes (the 100% P&T property-tax cliff, and tuition vs. household for
 * survivors). Everything else is a consequence of the status, not a question to ask.
 */
export type BenefitPick = {
  id: string;
  /** Sub-axis button label. Unused when a status has a single pick. */
  label: string;
  /** Abbrs ringed on the map for this pick. */
  states: readonly string[];
  winner: string;
  score: string;
  note: string;
};

export type BenefitStatus = {
  id: string;
  label: string;
  /** Who this covers, in one line. */
  who: string;
  /** The lever this status adds on top of the previous ones. */
  lever: string;
  picks: readonly BenefitPick[];
};

export const BENEFIT_STATUSES: readonly BenefitStatus[] = [
  {
    id: "veteran",
    label: "Veteran",
    who: "Served and separated. No VA rating, no retirement pay.",
    lever: "The broad, small-dollar programs: tuition, hiring preference, license and permit fees, vehicle registration, and state parks.",
    picks: [{
      id: "general",
      label: "",
      states: ["SD"],
      winner: "South Dakota",
      score: "93.3",
      note: "Strong education, recreation, employment, and direct-support programs, with no state income tax underneath them.",
    }],
  },
  {
    id: "retiree",
    label: "Military retiree",
    who: "Drawing military retirement pay or SBP.",
    lever: "How the state taxes retirement pay and SBP — the single largest recurring dollar difference between states.",
    picks: [{
      id: "retiree",
      label: "",
      states: ["SD"],
      winner: "South Dakota",
      score: "97.3",
      note: "No income tax at all, layered on top of unusually strong general-veteran programs.",
    }],
  },
  {
    id: "disabled",
    label: "Disabled veteran",
    who: "Holds a VA disability rating.",
    lever: "Property-tax relief on your home. Relief scales with your rating, and 100% P&T is a cliff rather than the next step up.",
    picks: [
      {
        id: "partial",
        label: "Rated under 100%",
        states: ["AK", "NM", "UT"],
        winner: "Alaska",
        score: "85.1",
        note: "A $150,000 assessed-value exemption that starts at a 50% rating. New Mexico (83.2) and Utah (82.3) are the closest alternatives — both scale property relief proportionally instead of making you wait for 100%.",
      },
      {
        id: "pt",
        label: "100% P&T or TDIU",
        states: ["TX"],
        winner: "Texas",
        score: "97.5",
        note: "Full homestead exemption, no tax on retirement pay, tuition for the family, and the exemption continues to a surviving spouse.",
      },
    ],
  },
  {
    id: "survivor",
    label: "Survivor or dependent",
    who: "Surviving spouse or child of a veteran.",
    lever: "Tuition remission, and whether the veteran's property exemption carries over to you rather than ending at death.",
    picks: [
      {
        id: "household",
        label: "Household benefits",
        states: ["TX"],
        winner: "Texas",
        score: "95.0",
        note: "Hazlewood education help, property-exemption continuation for the surviving spouse, and no income tax.",
      },
      {
        id: "college",
        label: "Tuition for children",
        states: ["IN"],
        winner: "Indiana",
        score: "94.2",
        note: "Exceptionally broad tuition-remission categories covering both spouses and children.",
      },
    ],
  },
];

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
