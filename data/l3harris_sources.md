# L3Harris job-location sources

The 92 U.S. rows in `l3harris_job_locations.csv` were captured on 2026-07-16 from the official [L3Harris careers search](https://careers.l3harris.com/en/search_jobs) city facets.

- **Scope:** The supplied city list, limited to United States facets. The page independently resolved every state and supplied the per-city active-listing facet count.
- **Duplicate city names:** The source has both **Bristol, PA** and **Bristol, England**; only the Pennsylvania row is in scope. It has both **Camden, AR** and **Camden, NJ**, and both U.S. rows are retained.
- **Counts:** `TotalPostings` preserves the source facet count captured that day. It is a city-facet count, so multi-location postings can make city totals exceed the number of distinct jobs.
- **Presence signal:** `Onsite=1` is a conservative attestation that an active city-specific L3Harris listing demonstrates a physical local footprint. It is **not** a claim that exactly one job is onsite or a breakdown of work arrangements; the importer therefore stores `Hybrid=0` and `Remote=0`.

Refresh this dataset from the same official city facets, then run `scripts/import-defense-employer-locations.ts` and `scripts/recompute-defense-hub.ts`. The generic importer owns provenance and preserves the distinction between attested presence and a live ATS work-arrangement sync.
