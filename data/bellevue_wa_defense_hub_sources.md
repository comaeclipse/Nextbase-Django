# Bellevue, WA — defense_hub_manual research (issue #20)

Note: this is a standalone addendum, not part of `data/bellevue_wa_sources.md`. That file
already existed in the working tree as unrelated, uncommitted in-progress work from another
pipeline when this research began; appending to it would have swept that WIP content into
this commit, so this research is tracked separately instead.

Retrieved: 2026-08-11.

Determination: **NULL (left unset — insufficient evidence either way)**

Genuine gap, not "no evidence": Esterline Technologies had roughly 1,000 employees in Bellevue
but was acquired by TransDigm Group in 2019, and current site status/headcount
post-acquisition could not be confirmed. Left NULL rather than guessing; worth a follow-up
local-news/TransDigm-facilities check before ever resolving this one.

Sources:
- Wikipedia, "Esterline Technologies" (TransDigm acquisition, 2019) — https://en.wikipedia.org/wiki/Esterline_Technologies
- TransDigm Group, investor/facilities disclosures (no Bellevue-specific current headcount found) — https://ir.transdigm.com/

## defense_hub_manual revision (issue #20, retrieved 2026-08-19)

Determination: **NULL (revised research, still left unset)**. Bellevue does have current DoD-funded contracting activity — a Bellevue Tetra Tech office received an approximately $2.9M Army Corps engineering order, and Bellevue-based Data Enterprises of the Northwest received approximately $532K from DoD for 2025-2026 software support. That rules out a hard FALSE veto. But these are general engineering/IT service contracts, not evidence of a substantial defense-industrial employer, and the earlier Esterline Technologies lead still doesn't resolve: TransDigm's current global-locations page lists no Bellevue site, and its current operating-unit directory contains no Esterline successor unit. Left NULL.

No DB write was made for this revision; `defense_hub_manual` remains NULL, matching the 2026-08-11 determination above.

Sources:
- USAspending.gov, Tetra Tech Bellevue award — https://www.usaspending.gov/award/CONT_AWD_W912P924F0036_9700_W912QR23D0047_9700
- TransDigm Group global locations — https://www.transdigm.com/transdigm-overview/global-locations/
