/*
 * The defense slice for commercial / dual-use employers (issue #336).
 *
 * Most seeds in DEFENSE_EMPLOYER_SEEDS are defense primes / pure-plays where
 * every opening counts. A handful (Oracle, Dell, Microsoft, AWS, Cisco, SpaceX,
 * x.ai, Tesla) are commercial companies with a defense / GovCloud / national-
 * security arm — seeded `counts_as_defense: false`. They run huge commercial job
 * boards, so we must NOT ingest every opening: only the *defense slice*.
 *
 * Decided policy (#336): a listing from a `counts_as_defense: false` employer is
 * defense-relevant iff it EITHER requires a US security clearance ("cleared")
 * OR sits in an explicit defense / government business unit or serves a defense
 * customer ("gov_customer"). Everything else is dropped.
 *
 * This module is the single, pure, IO-free authority for that decision — the
 * same shape as classifySector() in lib/defense-jobs-sectors.ts. Two gates make
 * the slice: the per-employer `ats_config.defense_slice` narrows at the ATS
 * source (a volume/recall aid), and THIS classifier is the truth applied to
 * every fetched row before it is written, so precision does not depend on each
 * ATS's facet quality. The sync/importer persists the verdict on the row
 * (`defense_relevance` + `defense_signal`) for auditability. Pure defense
 * employers (`counts_as_defense: true`) bypass the classifier — every listing is
 * "prime". Unit-tested in defense-jobs-slice.test.ts; that table is the spec.
 */

export type DefenseRelevance = "prime" | "cleared" | "gov_customer";

/**
 * The text fields of a *freshly fetched* listing. The classifier runs at sync
 * time, on the rich ATS payload (description/qualifications), even though the
 * stored row keeps only the verdict — so pass whatever the adapter has. Missing
 * fields are fine; they just contribute nothing to the haystack.
 */
export interface DefenseSliceInput {
  title?: string | null;
  /** Full JD / responsibilities text where the ATS provides it. */
  description?: string | null;
  /** Basic / preferred qualifications, if the ATS separates them (e.g. amazon.jobs). */
  qualifications?: string | null;
  /** Business unit / org / department (AWS Public Sector, Azure Government, field_raw). */
  businessUnit?: string | null;
}

export interface DefenseSliceVerdict {
  /** null => not defense-relevant; the listing must be dropped, not written. */
  relevance: DefenseRelevance | null;
  /** The matched text, for provenance. null for `prime` and for a drop. */
  signal: string | null;
}

/*
 * CLEARANCE rules — the strongest, least ambiguous signal (a US personnel
 * security clearance). Ordered; first match wins. Patterns are phrased to avoid
 * the obvious false positives: bare "secret" (marketing), bare "SAP" (the ERP),
 * and "clearance" without a security context ("clearance sale", "medical
 * clearance"). The generic clearance rules therefore require a level/gov word or
 * an eligibility verb within a short window of the word "clearance".
 */
const CLEARANCE_RULES: RegExp[] = [
  /\bts[\s/-]?sci\b/i,
  /\btop[\s-]?secret\b/i,
  /\bsecret[\s-]?level\b/i,
  /\bsecurity clearance\b/i,
  /\b(?:secret|ts[\s/-]?sci|dod|government|public[\s-]?trust)\b[^.\n]{0,30}\bclearance\b/i,
  /\bclearance\b[^.\n]{0,30}\b(?:required|active|current|eligib|preferred|secret|ts[\s/-]?sci)/i,
  /\b(?:active|current|maintain(?:s|ed|ing)?|obtain|eligible for)\b[^.\n]{0,25}\bclearance\b/i,
  /\bpolygraph\b/i,
  /\b(?:ci|full[\s-]?scope)\s+poly(?:graph)?\b/i,
  /\bsci[\s-]?eligib/i,
  /\bspecial access program\b/i,
  /\b[ql]\s+clearance\b/i, // DOE "Q clearance" / "L clearance"
];

/*
 * GOV_CUSTOMER rules — the listing serves a defense / government customer or
 * sits in a named gov business unit, without necessarily requiring a clearance.
 * Phrased to require defense/government CONTEXT so generic commercial text does
 * not leak in: no bare "defense" (avoids "defensive coding", "defense in
 * depth"), no bare "federal" (avoids "Federal Reserve", "federal holiday"), no
 * bare "military" (avoids "military-grade").
 */
const GOV_CUSTOMER_RULES: RegExp[] = [
  /\bdepartment of defense\b/i,
  /\bdod\b/i,
  /\bnational security\b/i,
  /\bintelligence community\b/i,
  /\bwarfighter/i,
  /\bmissile defense\b/i,
  /\bdefense industrial base\b/i,
  /\bdefense (?:department|agency|agencies|contract|program|customer|mission|sector|logistics|health)\b/i,
  /\bgovcloud\b/i,
  /\baws\s+dedicated cloud\b/i,
  /\bazure government\b/i,
  /\bgovernment community cloud\b/i,
  /\bcombatant command\b/i,
  /\bfedramp\s+high\b/i,
  /\b(?:u\.?s\.?\s+)?federal government\b/i,
  /\bfederal agenc(?:y|ies)\b/i,
  /\bcivilian agenc(?:y|ies)\b/i,
  /\bpublic sector\b/i,
  /\b(?:u\.?s\.?\s+)?(?:military|armed forces)\b[^.\n]{0,25}\b(?:customer|mission|branch|service|installation|base|program|contract)\b/i,
];

const MAX_SIGNAL_LEN = 120;

function firstMatch(rules: RegExp[], hay: string): string | null {
  for (const rule of rules) {
    const m = rule.exec(hay);
    if (m) return m[0].trim().slice(0, MAX_SIGNAL_LEN);
  }
  return null;
}

/**
 * Decide whether a fetched listing belongs in the defense slice, and why.
 *
 * - `counts_as_defense: true` employer (a prime): always `{ prime, null }` — the
 *   classifier is bypassed, every listing counts.
 * - otherwise: `cleared` (a clearance signal) or `gov_customer` (a gov/defense
 *   customer signal), whichever matches first, with the matched text as `signal`;
 *   or `{ null, null }` when neither matches — the listing must be dropped.
 */
export function classifyDefenseRelevance(
  input: DefenseSliceInput,
  opts: { countsAsDefense: boolean },
): DefenseSliceVerdict {
  if (opts.countsAsDefense) return { relevance: "prime", signal: null };

  const hay = [input.title, input.businessUnit, input.qualifications, input.description]
    .filter((s): s is string => Boolean(s))
    .join("\n")
    .toLowerCase();

  const cleared = firstMatch(CLEARANCE_RULES, hay);
  if (cleared) return { relevance: "cleared", signal: cleared };

  const gov = firstMatch(GOV_CUSTOMER_RULES, hay);
  if (gov) return { relevance: "gov_customer", signal: gov };

  return { relevance: null, signal: null };
}

/** Convenience boolean: is this listing in the defense slice at all? */
export function isDefenseRelevant(
  input: DefenseSliceInput,
  opts: { countsAsDefense: boolean },
): boolean {
  return classifyDefenseRelevance(input, opts).relevance !== null;
}
