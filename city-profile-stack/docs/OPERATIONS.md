# Operations: the per-city research loop

The standing operational contract for a nanogenre research pass. This is the
document a fresh session loads to *run* the product; the current findings live
in [STATE.md](STATE.md); the rules of what a genre *is* live in
[NANOGENRE_TAXONOMY.md](NANOGENRE_TAXONOMY.md). Proven across Discovery Corpus
v1 (ten cities, 2026-08); amended by the batch-of-10 review (§12 decisions
5–8).

## The loop

1. **Before research (order matters):**
   - Confirm the city has a `locations_location` row (importers hard-require
     it). If not, it needs the owner's city-ingest workflow first.
   - Generate predictions: `rank-dossier-candidates.ts --predict "<City, ST>"`
     and **commit the output** under
     `data/validation-corpus-v1/predictions/<city>-<st>.txt` (validation phase)
     **before any research happens**. Holdout discipline: the researcher is
     never shown these. A city that already has editorial features self-borrows
     at weight 1.0 — its propagation test is void (genre-classification pass
     only); say so up front.
   - Generate the research prompt: `generate-dossier-prompt.ts "<City, State>"`
     (Blocks 1–3 from the live ontology) + the Block 4 genre-proposal section
     from PROMPT_TEMPLATE.md. In the validation phase, append the city's
     pre-registered falsification module from
     [VALIDATION_CORPUS_V1.md](VALIDATION_CORPUS_V1.md). The prompt is
     byte-identical across cities except the TARGET CITY line and the
     hypothesis module — do not redesign the questionnaire per city.
   - The owner runs the prompt in an external research model and pastes back
     four blocks.

2. **On report-back — validate:**
   - Block 3 feature keys against `lib/ontology.ts` (`key: "..."` regex);
     values 0..1; confidence ≤ the 0.9 editorial ceiling; every referenced
     signal key must exist in Block 2.
   - Block 2 against the importer asserts: polarity
     `positive|caution|neutral`, confidence `high|medium|limited`, integer
     strength 1–5, HTTPS `source_urls`, established `evidence_kind` vocabulary.
   - **Delivery-defect playbook** (every defect is normalized mechanically,
     never rewritten, and flagged in the dossier json + verification record):
     utm/tracking params → strip; markdown-wrapped or parenthesized
     source_urls → extract bare URL; `:contentReference[oaicite]` artifacts →
     strip (if they *replaced* the URLs, reconstruct topically from Block 1 and
     flag as reconstruction); inline citation suffixes inside signal details →
     strip (URLs live in source_urls); odd hosts (pl.reddit / np.reddit / vi.
     reddit) → normalize to www.reddit.com in JSON, keep narrative verbatim;
     non-thread links (user profiles) → keep verbatim in narrative, exclude
     from source_urls.

3. **Verify every claim** (all findings recorded in the proposal's
   `verification` block):
   - Reddit: Arctic Shift batch —
     `arctic-shift.photon-reddit.com/api/posts/ids?ids=<id,id,...>` — check
     subreddit + title match for every thread. (PullPush lags ~2025+.)
   - Climate normals: NWS `product.php?version=N` URLs rotate — corroborate
     via NCEI: `ncei.noaa.gov/access/services/data/v1?dataset=
     normals-monthly-1991-2020&dataTypes=MLY-TMAX-NORMAL,MLY-TMIN-NORMAL&
     stations=USW000XXXXX&format=json`.
   - Bot-walled sites (census.gov QuickFacts, bls.gov, many city/gov/hospital
     sites): load in the real browser pane and re-read figures verbatim.
     reddit.com itself is policy-blocked there — use Arctic Shift.
   - County employment: BLS QCEW CSV API
     (`data.bls.gov/cew/data/api/YYYY/Q/area/FIPS.csv`).
   - PDFs that WebFetch can't read: parse directly (pypdf) and check the
     figure.
   - VA claims: verify against va.gov **and** cross-check the app's own
     `has_va`/`nearest_va_kind` for the location; file a fix task if the app
     is stale (do not fix inline).
   - Dead/rotated links: keep the cited URL verbatim (verbatim survives
     structuring), flag it, corroborate with a live substitute.

4. **Falsification table:** compare Block 3 against the pre-registered
   predictions. Criterion: **|prediction − measured| ≥ 0.30 = falsified**;
   0.25–0.29 recorded as near-misses. Record results **by prediction domain**
   (§12 decision 8): urban form · everyday rhythm · navigability/friction ·
   climate exposure · institutional capacity · lumpy infrastructure ·
   economics/housing · civic/social climate. Never summarize as one error
   rate.

5. **Artifacts (the fixed set — nothing else):**
   - `data/dossiers/research-dossiers/<city>-<st>.md` — Block 1 verbatim
     (mechanical strips only) + Sources.
   - `<city>-<st>.json` — dossier record: coverage, source_urls, structured
     note (falsification summary), location_context, archetype, signals,
     bottom line.
   - `<city>-<st>-nanogenre-proposal-v1.md/.json` — Block 4 companion:
     executive classification, reconciliation with reconstructed source URLs,
     divergences with KNOWLEDGE_MODEL stances
     (`co_true_different_measures` → board flag Minor), admission status,
     verification record.
   - Append the city to `location-profile-signals.json` and
     `location-features.json` (python round-trip append is diff-safe — always
     confirm the diff is pure additions).
   - **Splice** one ledger entry textually after `"entries": [` (round-trip
     reflows old entries — never json-dump the ledger). Update
     `recent_change` to describe **this change only** — git history is the
     changelog; do not chain "Previous change:" prose.
   - **Update [STATE.md](STATE.md) in place.** This replaces re-narrating
     program state (family counts, squeeze prevalence, trend) inside dossier
     notes and ledger limitations — state those once, in STATE.md.

6. **Import (order is load-bearing):** dossiers → signals → features, each
   `--dry-run` first. Features hard-error if the dossier row is missing. Run
   from an LF checkout (`.gitattributes` enforces LF in the dossier dir; CRLF
   makes every dossier look like a new revision to the sha256 dedupe).
   Verify rows in Neon by `location_id` after import.

7. **Ship:** run `npm test`; branch `city-profile-stack/<city>-dossier`;
   stage **by explicit path** (the tree often carries the owner's unrelated
   WIP); commit; PR. If a prior city's PR is still open, stack on its branch.
   **Stacked-merge rule: never `--delete-branch` a PR whose branch is another
   PR's base** — GitHub *closes* (not retargets) the dependent, and a closed
   PR whose base branch is gone can never be reopened. Merge without deletion,
   retarget the dependent (`gh pr edit N --base master` works only while
   open), then delete branches. A conflicted (DIRTY) PR has no merge ref, so
   its checks silently never run — resolve the conflict and they appear.
   Sequential merges: update-branch → wait for checks → merge, one PR at a
   time.

8. **Board (project 4):** the city card gets Status=Signals Drafted, Has
   Dossier=Full, Source Count, Corroboration=Partially, Divergence
   Flag=Minor, Draft Micro/Nanogenre, Dossier Path. **Leave Last
   Reviewed/Reviewed By empty** — those are the owner's §11 sign-off,
   recorded only on their explicit review.

## Standing architectural rules

- Features describe **places, not people**; personas derive at read time.
- Verbatim survives structuring; defects are flagged, never silently fixed.
- Abstention is a result: searched-not-found / discussed-but-unscoreable gaps
  are recorded, and an unscored feature never counts toward or against a
  divergence family.
- Geographically similar cities **do not inherit discrete institutions** (VA
  hospitals, trauma levels, tertiary depth) — never borrowed aggressively.
- Genres compress, traits describe: prefer short class labels + traits; test
  "would another city ever naturally inherit this label?"
