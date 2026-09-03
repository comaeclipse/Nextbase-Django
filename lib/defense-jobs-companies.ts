/*
 * Company name (the CSV "Company" column of a scraped listings feed) ->
 * defense_employers slug. Shared by scripts/import-defense-job-listings.ts and
 * the registry test (lib/defense-jobs-companies.test.ts), which asserts that
 * every slug here has a seed in DEFENSE_EMPLOYER_SEEDS and that every employer
 * with committed listings records the board it was scraped from (issue #313).
 *
 * Keys are lowercased. Add an entry per spelling a feed actually emits (an ATS
 * often carries the legal name, e.g. "Anduril Industries", while a rebrand
 * keeps the old one, e.g. Govini -> Air).
 */
export const COMPANY_SLUG: Record<string, string> = {
  hii: "hii",
  "huntington ingalls": "hii",
  "shield ai": "shield-ai",
  palantir: "palantir",
  saronic: "saronic",
  "vannevar labs": "vannevar-labs",
  kratos: "kratos",
  anduril: "anduril",
  "anduril industries": "anduril",
  epirus: "epirus",
  air: "air",
  govini: "air", // Govini rebranded to Air in 2026
  "chaos industries": "chaos-industries",
  castelion: "castelion",
  onebrief: "onebrief",
  firestorm: "firestorm",
  hadrian: "hadrian",
  hermeus: "hermeus",
  blacksky: "blacksky",
  "lockheed martin": "lockheed-martin",
  "palo alto networks": "palo-alto-networks",
  "bae systems": "bae-systems",
  "cyntel technologies": "cyntel-technologies",
  "northrop grumman": "northrop-grumman",
  "naval sea systems command": "navsea",
  "fantom corporation": "fantom-corporation",
  fantom: "fantom-corporation",
  spacex: "spacex",
  "space exploration technologies": "spacex",
  "space exploration technologies corp.": "spacex",
  xai: "xai",
  "x.ai": "xai",
  oracle: "oracle",
  "oracle corporation": "oracle",
  dell: "dell",
  "dell technologies": "dell",
  microsoft: "microsoft",
  "microsoft corporation": "microsoft",
  "amazon web services": "amazon-web-services",
  "amazon web services (aws)": "amazon-web-services", // seed display_name (lib/defense.ts)
  aws: "amazon-web-services",
  cisco: "cisco",
  "cisco systems": "cisco",
  tesla: "tesla",
  "tesla, inc.": "tesla",
};

/** Resolve a feed's company label to its employer slug, or null when unmapped. */
export function companySlug(company: string): string | null {
  return COMPANY_SLUG[company.trim().toLowerCase()] ?? null;
}
