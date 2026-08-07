# City Profile Corpus Audit - 2026-08-07

**Milestone:** Phase 0 - Preserve the research corpus

**Scope:** local R&D material for Elko, Nevada; Odessa, Texas; North Platte,
Nebraska; and the cross-city comparison hypothesis. This audit does not verify
web pages anew, import anything to Neon, create embeddings, or turn a
conversation observation into a fact.

## Result

All seven current ledger entries are preserved in a checked-in local artifact.
The corpus is therefore safe to continue working from. It is deliberately not
uniformly source-complete:

| Preservation state | Entries | Meaning |
| --- | ---: | --- |
| `locally_normalized` | 3 | Claim, scope, limitations, and counterevidence live in a local artifact. |
| `source_linked` | 1 | URL is recorded, but scope or interpretation still needs review. |
| `conversation_captured` | 3 | Useful session material is retained but cannot be used as a source-backed answer yet. |
| `embedding_ready` | 3 | Bounded evidence exists for future chunking; this is not permission to embed or import. |

## Claim register

| ID | City / scope | State | Local artifact | Audit disposition |
| --- | --- | --- | --- | --- |
| `elko_cultural_baseline_2026` | Elko, NV | `locally_normalized` | `data/dossiers/research-dossiers/elko-nv-cultural-baseline.md` | Preserved. Keep separate from any claim about ordinary-week nightlife. |
| `elko_tuesday_evening_texture_2026` | Elko, NV | `conversation_captured` | `data/conversation-captures/2026-08-07-elko-odessa-north-platte.md` | Preserved; blocked on full source URLs and a bounded venue-hours sample. This is the Phase 1 gold-pack seed. |
| `odessa_elko_calibration_2026` | Odessa, TX | `locally_normalized` | `data/dossiers/research-dossiers/odessa-tx-elko-calibration.md` | Preserved; retain the Midessa geography caveat. |
| `north_platte_industrial_social_rhythm_2026` | North Platte, NE | `locally_normalized` | `docs/rhythm-calibration.md` | Preserved; industrial continuity is not evidence of broad nightlife. |
| `north_platte_county_politics_2024` | Lincoln County proxy | `source_linked` | `data/research-ledger.json` | Preserved as county-level only. Do not relabel it as North Platte city politics until precincts are aggregated. |
| `north_platte_mobility_family_hypotheses_2026` | North Platte, NE | `conversation_captured` | `data/conversation-captures/2026-08-07-elko-odessa-north-platte.md` | Preserved; demographics do not prove family norms or newcomer welcome. |
| `three_city_broad_family_hypothesis_2026` | Elko / Odessa / North Platte | `conversation_captured` | `data/conversation-captures/2026-08-07-elko-odessa-north-platte.md` | Preserved as a falsifiable cohort hypothesis, not a similarity result. |

## Audit checks

- Parsed `data/research-ledger.json` successfully.
- Confirmed each artifact path exists, including the ledger itself for the
  county-politics proxy.
- Confirmed no entry was silently promoted during the audit.
- Confirmed all current research remains local-only; no Neon write was made.

## Phase 0 exit decision

**Passed for preservation.** The current corpus is locatable and its evidence
state is explicit. Ongoing research must add a ledger entry and checked-in
artifact before it can be considered part of this corpus.

## Phase 1 handoff

Start the Elko normal-Tuesday gold pack from
`elko_tuesday_evening_texture_2026`. Its first task is not a score: recover the
actual source URLs, record current Tuesday hours and dates, and model both the
local venue evidence and the counterevidence.
