# Phase 4 — Career chat tool (design)

Status: **design / not yet implemented.** Implement only after Phases 1–3 merge to
master (see Prerequisites). This is the spec the Phase 4 PRs (#228 tool + SYSTEM,
#229 UI) follow. It exists so the chat tool is built the same way the five city
tools were: **code owns the match; the model only narrates.**

## Goal

Let `/chat` answer "I'm a retired Navy electrician — what can I do as a civilian
and are there jobs?" honestly, end to end:

```
utterance → resolveSpecialty → catalog (skills + roles + employers) → listingsForSpecialty → structured JSON → model narrates
```

The model never keyword-searches listings and never picks a specialty. If the
occupation is ambiguous ("electrician") the tool asks; if it is uncovered the
tool says so. A wrong guess here recommends a ship electrician avionics jobs —
the exact failure this whole project exists to prevent.

## Prerequisites (do not start until these are on master)

| Needs | PR | Why |
| --- | --- | --- |
| `resolveSpecialty` | #235 | Turns the utterance into resolved / ambiguous / uncovered |
| Skills layer + `SpecialtyMatchView.skills` | #238 (on #236) | Skill keywords + the skills the model narrates |
| `listingsForSpecialty` bridge | #240 (on #238) | Real listings + honest employer-URL fallback |
| Data Applied to Neon | #236/#238 | EM/ET/IC + skills present; `migrate-career-transition.ts` re-run for the two skill tables |

All four land on a single clean master before Phase 4. Do **not** build Phase 4
on a stacked chain of the above — it composes three pieces that today live on
three different branches.

## Architecture: one composed tool, not three

The tool exposes a **single** function to the model. Its `execute` runs the whole
deterministic pipeline server-side and returns everything at once. This is the
integrity crux: the model gets one "explore this occupation" verb and cannot
substitute its own search or pick among candidates — it can only narrate the
structured result (or relay the ambiguity question the tool hands back).

Put the composition in `lib/`, not the route — mirror how the city tools call
`@/city-profile-stack/lib/city-queries`.

### New module: `lib/career-tool.ts`

```ts
import { getCareerTransitionCatalog, resolveSpecialty, normalizeSpecialtyKey,
         type MilitaryBranch } from "./career-transition";
import { listingsForSpecialty, type SpecialtyListings } from "./career-listings-bridge";

export type CareerToolResult =
  | { status: "resolved"; specialty: {...}; skills: {...}[]; roles: {...}[];
      employers: {...}[]; listings: SpecialtyListings }
  | { status: "ambiguous"; term: string; branch: MilitaryBranch | null;
      candidates: { code: string; title: string; disambiguator: string }[];
      clarification: string }
  | { status: "uncovered"; query: string; branch: MilitaryBranch | null;
      explanation: string };

export async function exploreSpecialtyTransition(
  query: string,
  opts?: { branch?: MilitaryBranch; code?: string; nec?: string }
): Promise<CareerToolResult> {
  const catalog = await getCareerTransitionCatalog();

  // If a branch+code is given explicitly, resolve directly; else run the resolver.
  const resolution = resolveSpecialty(catalog, opts?.code ?? query, opts?.branch);

  if (resolution.status !== "resolved") return resolution;   // ambiguous | uncovered pass straight through

  const match = catalog.matches.find(
    (m) => normalizeSpecialtyKey(m.specialty.branch, m.specialty.code)
         === normalizeSpecialtyKey(resolution.specialty.branch, resolution.specialty.code)
  );
  if (!match) return { status: "uncovered", query, branch: opts?.branch ?? null,
                       explanation: "Specialty resolved but not in the catalog." };

  const listings = await listingsForSpecialty(match);   // real listings + employer-URL fallback

  return {
    status: "resolved",
    specialty: pick(match.specialty),          // code, title, branch, status, source_url, source_retrieved_on
    skills: match.skills.map(pickSkill),       // title, kind, directness, rationale, source date
    roles: match.roles.map(pickRole),          // title, family, directness, summary, credential_notes
    employers: match.employers.map(pickEmployer),
    listings,                                  // status + listings[] (title, company, city, url) + employerLinks[]
  };
}
```

Notes:
- **`nec`** is passed through for future NEC-level disambiguation (e.g. EM nuclear
  vs. surface). v1 can accept and ignore it, or fold it into the resolver query;
  do not block Phase 4 on NEC resolution.
- Trim every returned object to display-safe fields — do not hand the model the
  whole catalog row. Include `snapshot_date` on employer matches and the apply
  `url` on listings so the model can cite them (SYSTEM requires it).

### Tool wiring in `app/api/chat/route.ts`

```ts
const exploreCareerTool = tool({
  description:
    "Explore how a U.S. military specialty (rating / MOS / AFSC) transitions to " +
    "civilian work: the reusable skills it builds, civilian roles, transition " +
    "employers, and any live defense job listings. Input is the person's own " +
    "words for their job (e.g. 'Navy electrician', 'retired 15T', 'CTT'). Returns " +
    "resolved | ambiguous | uncovered — when ambiguous or uncovered, ASK or " +
    "DECLINE, never pick a specialty yourself.",
  inputSchema: z.object({
    occupation: z.string().describe("The person's own words for their military job."),
    branch: z.enum(["army","navy","air_force","marine_corps","coast_guard","space_force"]).optional(),
    code: z.string().optional().describe("An explicit rating/MOS/AFSC code if they gave one, e.g. 'EM', '15T'."),
    nec: z.string().optional().describe("An NEC / sub-specialty code if they gave one."),
  }),
  execute: async ({ occupation, branch, code, nec }) => {
    try { return await exploreSpecialtyTransition(occupation, { branch, code, nec }); }
    catch (e) { return { error: e instanceof Error ? e.message : String(e) }; }
  },
});
```

Register it in the `tools` map as `explore_military_career`. **`stepCountIs(6)`
stays** — the whole pipeline is one tool call, so one step covers resolve →
listings; 6 leaves ample room for an ambiguity round-trip.

## The three outcomes and how the model must narrate them

| status | Model behavior |
| --- | --- |
| `resolved` | Narrate skills → roles → employers → listings. If `listings.status !== "listings"`, say there are no live listings right now and point to the employer career pages (`employerLinks[].website_url`). Cite a listing's apply `url` and an employer match's `snapshot_date` when stating them. |
| `ambiguous` | Ask the `clarification` question and present the `candidates` (their `disambiguator` text). **Never pick one.** e.g. "Electrician could mean a couple of Navy ratings — were you aircraft (AE) or shipboard power (EM)?" |
| `uncovered` | Say plainly it isn't covered yet (relay `explanation`), and do not substitute a nearby rating or answer from general knowledge. Offer the city tools instead. |

## SYSTEM prompt changes (`SYSTEM` in `app/api/chat/route.ts`)

1. Change the opening: the assistant now answers **six** kinds of question, and
   the "five tools" / "exactly five kinds" lines become six.
2. Add question type **6** with rules:
   - Route any military-occupation question ("I was a Navy electrician", "what
     can a 15T do", "jobs for a retired CTT") to `explore_military_career`.
   - **Ambiguous → ask** using the tool's `clarification` + `candidates`; never
     choose a specialty. **Uncovered → decline** honestly; never name a nearby
     rating or invent a civilian path from general knowledge.
   - **Never invent a listing or an apply URL.** Only cite `listings[].url` from
     the tool result; if `listings.status` is `unmapped`/`no_hits`, say there are
     no live listings and hand over the employer career pages.
   - Skills/roles/employers are curated matches, not a promise of a job — say so
     like a person, per the existing Voice section.
   - Cite `snapshot_date` (employer posting snapshots) and the listing apply URL
     when you state them, the same way the gun-freedom tool cites `dataVintage`.
3. Keep the Voice + honesty sections as-is; they already forbid inventing facts,
   naming the machinery, and lecturing. The career tool obeys the same voice.
4. Phase 4 is **occupation-only**. Composing career with place ("EM skills AND a
   no-income-tax state near a VA clinic") is Phase 5 (#230) — the SYSTEM should
   not yet try to chain `explore_military_career` with the city tools.

## UI changes (`app/chat/page.tsx`, issue #229)

- `TOOL_LABEL`: add `"tool-explore_military_career": "Matching your military job to civilian work"`.
- `SUGGESTIONS`: add one starter, e.g. `"I'm a retired Navy electrician — what civilian jobs fit?"`.
- Leave the placeholder and the five city entries unchanged.

## Data-gap behavior (expected, not a bug)

`defense_job_listings` today holds only Shield AI, Palantir, Saronic, Vannevar
Labs, and Kratos — none hire Navy electricians. So for EM the bridge returns
`no_hits`/`unmapped` and the model shows employer career pages. That is the
**honest** answer and the acceptance below reflects it. Real electrician listings
arrive when shipyard/prime employers are scraped into `defense_job_listings`
(separate ingest effort; also unblocks #226 slug unification).

## Testing

- **`lib/career-tool.test.ts`** — unit-test `exploreSpecialtyTransition` with a
  stub catalog + stub `listingsForSpecialty` (inject via a param, same pattern as
  the bridge's `listPage`). Cover:
  - `"navy electrician"` → `ambiguous` (AE vs EM), no listings call made.
  - `"navy EM"` (post-seed) → `resolved`, skills are electrical, listings status
    relayed.
  - an uncovered occupation → `uncovered`, no borrowed specialty.
- **The tool `execute` stays a thin wrapper** (try/catch → JSON) — no logic to
  test beyond the compose function.
- **SYSTEM behavior** can't be unit-tested; add 3 example transcripts to this doc
  (or a `__fixtures__`) as review acceptance: the electrician ask, the EM resolve,
  an uncovered decline.

## Acceptance (mirrors #228 / #229)

- [ ] Sixth tool `explore_military_career` on `app/api/chat/route.ts`, city tools unchanged.
- [ ] Input: free-text occupation + optional branch / code / NEC.
- [ ] Executes resolver → catalog skills/roles/employers → listings; returns structured JSON only.
- [ ] SYSTEM adds question type 6; ambiguous → ask, uncovered → decline; never invents a listing URL; cites snapshot/apply URL.
- [ ] `stepCountIs(6)` unchanged and sufficient.
- [ ] One `TOOL_LABEL` + one starter suggestion; city tools/labels unchanged.
- [ ] `lib/career-tool.ts` composition unit-tested; `npx vitest run`, `tsc --noEmit`, `npm run lint` all green.

## Suggested PR split

1. **`lib/career-tool.ts` + tests** (compose function) — pure, testable, no route.
2. **Route + SYSTEM + UI** (#228 + #229) — wire the tool and the label/suggestion.

Keeps the testable logic separate from the prompt/UI wiring, per one-concern-per-PR.

## Non-goals (Phase 4)

- No city/tax/VA composition — that's Phase 5 (#230).
- No profile save, no new data, no new tables.
- No change to the five city tools or their SYSTEM sections.
