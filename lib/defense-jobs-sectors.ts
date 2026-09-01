/*
 * Pure, IO-free normalizers for the /defense-jobs page.
 *
 * The source CSV (master_defense_jobs.csv) carries a company-specific "Field"
 * value (e.g. "X-BAT Division", "Hivemind Solutions Division", "Delta") that is
 * a business unit, not a job function — it does not line up across employers.
 * `classifySector` derives a *broad, cross-employer* sector from the job title
 * (with Field as a fallback) so the page's sector filter is comparable across
 * Shield AI, Palantir, Saronic, etc. The raw Field is kept separately on each
 * listing as a sub-team tag (see DefenseJobListingRow.field_raw).
 *
 * These functions are unit-tested (defense-jobs-sectors.test.ts) and are the
 * single source of truth for the sector taxonomy used by the importer and UI.
 */

export type DefenseJobSector =
  | "Software & Data"
  | "Hardware & Engineering"
  | "Manufacturing & Production"
  | "Mission & Flight Ops"
  | "Product & Design"
  | "Business & Growth"
  | "Security & IT"
  | "Corporate & G&A"
  | "Other";

/** Ordered list for the sector filter UI (Other last). */
export const DEFENSE_JOB_SECTORS: DefenseJobSector[] = [
  "Software & Data",
  "Hardware & Engineering",
  "Manufacturing & Production",
  "Mission & Flight Ops",
  "Product & Design",
  "Business & Growth",
  "Security & IT",
  "Corporate & G&A",
  "Other",
];

/*
 * Rules are evaluated in order; the first whose regex matches the haystack wins.
 * Order encodes precedence for ambiguous titles — e.g. "Security Engineer" must
 * resolve to Security & IT before the generic "engineer" catch in Hardware, and
 * "Manufacturing Engineer" to Manufacturing before Hardware. Keep more specific
 * sectors above more generic ones.
 */
// Each pattern is a leading-boundary `\b(?:...)` alternation. Stems (financ,
// manufactur, recruit) intentionally omit a trailing boundary so they match
// inflections; short/ambiguous acronyms (fso, uas, ml, ai, ...) carry their own
// trailing `\b` so they do not match inside longer words.
const SECTOR_RULES: { sector: DefenseJobSector; pattern: RegExp }[] = [
  {
    sector: "Security & IT",
    pattern:
      /\b(?:information security|infosec|cyber|security engineer|security operations|soc analyst|insider threat|facility security officer|fso\b|physical security|security specialist|red team|penetration|vulnerabilit|it support|it technician|it infrastructure|it administrator|information technology|enterprise technology|help ?desk|systems administrator|network engineer|identity)/i,
  },
  {
    sector: "Manufacturing & Production",
    pattern:
      /\b(?:manufactur|production|assembly|assembler|machinist|fabricat|supply chain|procurement|buyer|quality (?:engineer|assurance|control|inspector)|logistic|warehouse|materials|inventory|shipping|receiving|welder|composites|tooling)/i,
  },
  {
    sector: "Mission & Flight Ops",
    pattern:
      /\b(?:flight test|flight ops|pilot|mission (?:ops|operations|manager|specialist|lead|development)|field (?:service|engineer|operations|technician)|forward deployed|deployment strategist|operator|uas\b|uav\b|air vehicle|aircraft (?:operations|maintenance)|range operations|maritime operations|test operations|ground control|payload operations)/i,
  },
  {
    sector: "Software & Data",
    pattern:
      /\b(?:software|swe\b|developer|back ?end|front ?end|full ?stack|web\b|mobile|ios\b|android|data (?:engineer|scientist|analyst|platform)|machine learning|ml\b|ai\b|artificial intelligence|autonomy|perception|firmware|embedded software|devops|sre\b|site reliability|platform engineer|infrastructure engineer|cloud|database|api\b)/i,
  },
  {
    sector: "Hardware & Engineering",
    pattern:
      /\b(?:mechanical|electrical|electrician|ee\b|me\b|hardware|rf\b|radio frequency|aerospace|aeronautic|avionics|propulsion|structural|systems engineer|design engineer|test engineer|integration engineer|controls|robotic|mechatronic|thermal|electronics|pcb\b|circuit|antenna|optics|photonics|engineer)/i,
  },
  {
    sector: "Product & Design",
    pattern:
      /\b(?:product manager|product management|product owner|product designer|ux\b|ui\b|user experience|user interface|industrial design|design|program manager|technical program|tpm\b|prototyp)/i,
  },
  {
    sector: "Business & Growth",
    pattern:
      /\b(?:sales|business development|bd\b|growth|partnership|marketing|market\b|account executive|account manager|revenue|go-to-market|gtm\b|customer success|solutions (?:architect|consultant)|capture|proposal)/i,
  },
  {
    sector: "Corporate & G&A",
    pattern:
      /\b(?:financ|accounting|accountant|controller|treasury|fp&a|legal|counsel|attorney|paralegal|complianc|contracts|contract specialist|contracting|acquisition specialist|general business|people|human resources|hr\b|recruit|talent|sourcer|administrativ|admin\b|executive assistant|office manager|facilities|workplace|communication|public relations|government relations|policy|strategy|operations|program manager|program management|chief of staff|benefits|payroll)/i,
  },
];

/**
 * Derive a broad, cross-employer job sector. Matches the title first; if nothing
 * matches, falls back to the raw Field value; otherwise "Other".
 */
export function classifySector(
  title: string | null | undefined,
  field?: string | null | undefined,
): DefenseJobSector {
  const title_ = (title ?? "").toLowerCase();
  for (const { sector, pattern } of SECTOR_RULES) {
    if (pattern.test(title_)) return sector;
  }
  const field_ = (field ?? "").toLowerCase();
  if (field_) {
    for (const { sector, pattern } of SECTOR_RULES) {
      if (pattern.test(field_)) return sector;
    }
  }
  return "Other";
}

/**
 * Collapse the CSV's many employment spellings into a small set.
 * Full Time Employee / FullTime / Full-time -> "Full-time"; Intern(ship) ->
 * "Internship"; Contract(or) -> "Contract"; International EOR / International
 * Office Entity -> "Full-time"; Fixed-Term / Scholarship kept as-is.
 */
export function normalizeEmployment(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  const low = v.toLowerCase();
  // Order matters: "International EOR"/"International Office Entity" both contain
  // the substring "intern", so full-time signals are checked first.
  if (low.includes("full") || low.includes("eor") || low.includes("office entity")) {
    return "Full-time";
  }
  if (low.includes("intern")) return "Internship";
  if (low.includes("scholarship")) return "Scholarship";
  if (low.includes("fixed")) return "Fixed-Term";
  if (low.includes("contract")) return "Contract";
  return v;
}

/** Normalize PayInterval ("per-year-salary", "per-hour-wage", ...) to year|hour|month. */
export function normalizePayInterval(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return null;
  if (v.includes("year")) return "year";
  if (v.includes("hour")) return "hour";
  if (v.includes("month")) return "month";
  if (v.includes("week")) return "week";
  if (v.includes("day")) return "day";
  return null;
}
