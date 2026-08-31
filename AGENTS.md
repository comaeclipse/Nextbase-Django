# AGENTS.md

Working rules for every agent and human on this repo (Claude Code, Codex, or hand-edits).

**Project, stack, and domain guidance live in [CLAUDE.md](CLAUDE.md) — read it first.**
This file is only about how we collaborate without clobbering each other. It used to be a
copy of CLAUDE.md and silently went stale, which is exactly the failure it now documents;
keep it a pointer, never a duplicate.

## Instruction files

Different tools read different files. Each one below is a **pointer**, not a copy —
`AGENTS.md` and `GEMINI.md` both silently became stale copies of `CLAUDE.md`, which is
how Codex and Claude ended up working from different instructions. Never duplicate
content across these; add a pointer instead.

| File | Read by |
|---|---|
| `AGENTS.md` (this file) | Codex, and most CLIs that adopted the agents.md convention |
| `CLAUDE.md` | Claude Code |
| `.cursor/rules/project.mdc` | Cursor (whichever model is selected, incl. Grok) |
| `GEMINI.md` | Gemini CLI |

To find out what a new tool reads, append a unique marker to each candidate file
(`Begin every reply with CANARY-<name>`), give the tool a trivial task, and see which
token comes back. Strip the markers afterward. If none come back, it is reading nothing
in this repo and needs its own pointer file.

## Branch hygiene

- **Branch from a freshly fetched `origin/master`.** Concurrent sessions share HEAD and can
  switch branches under you — `git fetch && git switch -c <name> origin/master`.
- **Use a worktree for any multi-step work.** Not just when branching.
- **One concern per PR.** Data ingest, app code, and docs go in separate PRs.
- **Rebase before review.** A branch more than ~15 commits behind master is a liability, not
  a PR. CI warns past that threshold.
- **Never stack a PR on another PR's branch** unless you intend to merge them in order.

## The stale-branch trap (PR #61, 2026-08-18)

A branch forked, the same work was re-applied elsewhere and landed on master, and the
original kept living. Eight days and 23 master commits later it had 7 merge conflicts and
was abandoned — stranding ~50 files of real data work that had to be recovered by hand in
#66/#67.

Two things made it hard to see:

- **Duplicate commits with different SHAs.** `8483cd4`/`9e678b0` ("Add retail access
  filters") and `606005b`/`042816c` ("Add military-installation proximity") are byte-identical
  pairs on different bases. Every commit is authored `comaeclipse` no matter which agent
  wrote it, so authorship tells you nothing.
- **`git diff master branch` overstates the damage.** Two-dot diff reports every file the
  base gained since the fork as a deletion. A real 3-way merge keeps them. Use three-dot
  (`git diff origin/master...HEAD`) to see what a PR *actually* changes — that is what
  GitHub's "Files changed" shows.

## Data changes

- **Never run a production import from a feature branch before its source file is merged.**
  Neon is shared and mutable: the import lands instantly, the DB looks done, and nobody
  notices the CSV never reached master. That is how #61 stranded 13 cities' provenance
  while every one of those cities was already live. For city ingests specifically, follow
  the two-phase workflow in
  [ALL_DATA_RETRIEVAL_INSTRUCTIONS.md](ALL_DATA_RETRIEVAL_INSTRUCTIONS.md#ingest-workflow-branch-pr-and-when-to-write-to-neon):
  research artifacts merge to `master` first, the Neon write happens from `master` after.
- **Treat `data/`, `baselines/`, and `city-profile-stack/data/` as an audit trail.** Deleting
  from them is almost always a stale-branch artifact. The `Data guard` workflow fails such a
  PR; if the removal is genuinely intended, add the `allow-data-deletions` label.
- **When recovering files from an old branch, diff both directions.** Confirm the branch
  version is a strict superset before taking it, or you re-introduce the bug you are fixing.
- **Verify against the DB, not the file diff**, when deciding what is actually missing.
- **Adding a geography is not the same as adding a candidate.** `locations_location`
  holds places, not just retirement cities. `geo_type` says what a place is;
  `is_candidate` says whether it gets ranked. A structural parent (Los Angeles, so
  Canoga Park has a municipality to inherit from) or a neighborhood is
  `is_candidate=false`. Setting it true puts the row into `/explore`, the quiz and
  the map, and it must not be true until that place's cost, safety and housing data
  is measured for it rather than inherited. Run `scripts/verify-geo-hierarchy.ts`
  after any geography change — it checks cycles, `parent_geo_id` against
  `geo_relationships`, and shadowed aliases, and exits non-zero.
- **Inserting a location silently links employer postings.** `locations_location`
  carries an `AFTER INSERT` trigger, `trg_link_city_to_employer_locations`, which
  back-links `defense_employer_locations` rows by exact `(city, state)`. Adding a
  place can therefore change defense figures with no importer run; re-run
  `scripts/recompute-defense-hub.ts --dry-run` and read the flips before going live.

## Applying merged ingests (the serial Apply phase)

Ingest PRs stop at the PR by design — they write no prod data. (The `nextbase-data-retrieval`
skill runs its research phase this way so it can be run many-up in parallel: a run's deliverable
is a CSV + source notes + a `--dry-run` log + a PR, never a database write.) After those PRs
merge, the Neon write and every global recompute/sync happen in a **serial Apply phase run by a
single operator**: once, from a `master` checkout, `--dry-run` before each live step.

- **Never from a feature branch, never two at a time, never looped per-city while agents are
  still ingesting.** `import-csv.ts` (live), `recompute-defense-hub`, `sync-va-facilities`,
  `sync-military-proximity`, `import-bea-rpp` / `sync-col-index-from-rpp`,
  `prepare-map-coordinates`, `classify-pace`, and the verifiers each read or write the whole DB
  or a single shared file, so parallel runs (or a run racing an agent that is still ingesting)
  clobber each other — torn writes, one regenerated artifact overwriting another.
- **Batch the whole merged set once** — do not re-run the global scripts per city.
- Exact order, flags, and per-script gotchas live in the retrieval skill's Apply phase and
  [ALL_DATA_RETRIEVAL_INSTRUCTIONS.md](ALL_DATA_RETRIEVAL_INSTRUCTIONS.md); this section is only
  the collaboration rule (serial, one operator, from `master`, after merge).
- Every `master` push auto-redeploys Vercel with cold caches, so merged rows appear at once — a
  deploy is not a separate step. A `needs_review` pace result, though, won't show a lifestyle
  tag until it is approved.

## Scratch files

Keep them out of the repo root — `.gitignore` covers `/.check_*`, `/*_tmp.js`, `/*.tmp`,
`/*.png`, `/*.csv`. Ingest CSVs belong in `data/<city>_<st>.csv`, never at the root.
A geography below city level uses its parent in the name — `data/<parent>_<st>_<place>.csv`,
e.g. `data/los_angeles_ca_canoga_park.csv` — because `<place>_<st>` is not unique
("Downtown, CA" exists many times over) and the file name should match the slug.

## Before opening a PR

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
git diff --name-status origin/master...HEAD | grep '^D' || true   # expect nothing under data/
git rev-list --count HEAD..origin/master                          # if >15, rebase
```

## Task handoff

Paste this preamble into any task given to an outside agent (Codex, Grok, or a fresh
Claude session). Every rule here maps to a specific failure from the 2026-08-19 cleanup,
where eight PRs and four recovery rounds were needed to unpick work that was never
wrong — only mislocated.

```
Before starting:
  git fetch origin && git switch -c <branch> origin/master

Rules:
  - Never commit to master; never reuse an existing branch.
  - One concern per branch. No scratch files, screenshots, or temp
    scripts in the repo root.
  - Do not run production DB imports. Produce the data file and a
    --dry-run log instead.
  - Read AGENTS.md before opening a PR.

When done:
  git push -u origin <branch>, open a PR against master, report the URL.
  If the branch is >15 commits behind master, rebase first.
```

Why each line exists:

- **Never commit to master.** The local `master` accumulated 12 unpushed commits, and
  another branch a 13th (Idaho Falls). All correct work, all existing in exactly one
  place on one machine, all nearly deleted during branch cleanup.
- **Push and open a PR.** Unpushed work is indistinguishable from work that never
  happened. Both stranded caches were commits that were simply never pushed.
- **One ticket, one agent.** `8483cd4` and `9e678b0` are byte-identical "Add retail
  access filters" commits with different SHAs — the same issue handed to two tools.
- **No production imports from a task.** An import lands in Neon instantly, so the DB
  looks correct while the source file never merges. That is how 13 cities went live
  with zero provenance on master, and the DB actively hid the failure.

## Detecting drift

Run these periodically; each catches one failure mode before it compounds.

```bash
git log origin/master..master                          # unpushed local commits
git branch -a --no-merged origin/master                # branches drifting from master
git log --all --format='%s' | sort | uniq -d           # duplicated work (same subject, different SHA)
```

The third would have flagged the retail-access collision on the day it happened.

Note for Windows/PowerShell: `&&` is not a valid separator in Windows PowerShell 5.1.
Use `cmd-a; if ($?) { cmd-b }`, or run the commands separately.
