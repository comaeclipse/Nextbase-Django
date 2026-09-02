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

## defense_hub_manual revision (issue #55, retrieved 2026-09-02)

Determination: **TRUE** (moderate confidence; Bellevue-only headcount unverified). Anduril Industries subleased 39,851 sq ft — one full floor — at Skyline Tower, 10900 NE 4th St, Bellevue, from Meta in July 2025, "doubling its footprint in the Seattle region" to ~375 regional employees alongside its 2020 Seattle office; job listings show dozens of engineering roles geotagged Bellevue, i.e. an engineering site, not a sales office. Counter-evidence checked: Boeing has no current Bellevue facility (the Eastgate campus at 2525–2810 160th Ave SE was sold to Westbrook on 2021-07-06 with a two-year leaseback and is now "Woodlands at Bellevue"), and Lockheed Martin's 2005 Bellevue office (8,000 sq ft / ~20 people) is below the bar regardless of status. Immediate-metro context, not counted in the decision: the Redmond rocket-propulsion campus (~8 mi, 400+ employees) was L3Harris/Aerojet Rocketdyne 2023–2026 and is now the "Rocketdyne" AE Industrial/L3Harris joint venture. Unverified: GeekWire and MSN returned 403 to fetches, so the square-footage and regional-headcount figures come from search excerpts of those articles; The Registry's headline and 2025-07-02 date were fetched directly. Anduril's Greenhouse feed labels its Washington roles "Seattle, Washington", so no Bellevue-only headcount can be stated.

Applied via `data/sources/defense/location_defense_hub_manual_backfill_2026-09-02.json` (`scripts/apply-location-patches.ts`), then `scripts/recompute-defense-hub.ts`.

Sources:
- The Registry, Anduril secures 40,000 sq ft at Bellevue's Skyline Tower — https://news.theregistryps.com/defense-tech-firm-anduril-secures-40000-sqft-at-bellevues-skyline-tower/
- GeekWire, Anduril lands in Bellevue — https://www.geekwire.com/2025/military-tech-giant-anduril-lands-in-bellevue-doubling-footprint-in-seattle-region/
- Daily Journal of Commerce, Boeing Eastgate campus sale — https://www.djc.com/news/re/12141526.html
- AviationPros, Boeing local real-estate divestments — https://aviationpros.com/aircraft/commercial-airline/news/21250756/boeing-sells-its-commercial-airplanes-headquarters-for-100m-completing-its-local-real-estate-divestments
- Lockheed Martin, 2005 Bellevue office — https://news.lockheedmartin.com/2005-11-03-Lockheed-Martin-Opens-New-Office-in-Seattle
- Cosmic Log, Rocketdyne Redmond ownership (2026) — https://cosmiclog.com/2026/01/16/decades-old-rocket-factory-is-in-for-a-rocketdyne-rebrand/
