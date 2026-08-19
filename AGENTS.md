# AGENTS.md

Working rules for every agent and human on this repo (Claude Code, Codex, or hand-edits).

**Project, stack, and domain guidance live in [CLAUDE.md](CLAUDE.md) — read it first.**
This file is only about how we collaborate without clobbering each other. It used to be a
copy of CLAUDE.md and silently went stale, which is exactly the failure it now documents;
keep it a pointer, never a duplicate.

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
  while every one of those cities was already live.
- **Treat `data/`, `baselines/`, and `city-profile-stack/data/` as an audit trail.** Deleting
  from them is almost always a stale-branch artifact. The `Data guard` workflow fails such a
  PR; if the removal is genuinely intended, add the `allow-data-deletions` label.
- **When recovering files from an old branch, diff both directions.** Confirm the branch
  version is a strict superset before taking it, or you re-introduce the bug you are fixing.
- **Verify against the DB, not the file diff**, when deciding what is actually missing.

## Scratch files

Keep them out of the repo root — `.gitignore` covers `/.check_*`, `/*_tmp.js`, `/*.tmp`,
`/*.png`, `/*.csv`. Ingest CSVs belong in `data/<city>_<st>.csv`, never at the root.

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
