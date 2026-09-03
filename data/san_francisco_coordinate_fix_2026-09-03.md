# San Francisco (id 499) centroid correction — 2026-09-03

## Problem

`locations_location` id 499 (`San Francisco, CA`, `slug=ca-san-francisco`,
`geo_type=city`, `is_candidate=false`) stored an out-of-city centroid:

    latitude  37.727239
    longitude -123.032229

That longitude places the point ~25–30 mi WSW of the city, out in the Pacific.
Every distance-derived field for the row was therefore wrong. It surfaced during
the issue #303 VA sanity-check: `scripts/sync-va-facilities.ts` reported the
nearest VA outpatient site at 29 mi and `has_va=false`, even though the San
Francisco VA Medical Center (Fort Miley) is in-city and present in the feed — the
Oakland row (id nearby) correctly sees that same VAMC at 15 mi. The bad centroid,
not a missing facility, was the cause.

## Fix

Set the centroid to the Census Gazetteer internal point for San Francisco city,
CA (GEOID 0667000) — the same convention the other rows use:

    latitude  37.7562271
    longitude -122.4430742

Verified against the Census geocoder (`geographies/coordinates`,
`Public_AR_Current` / `Current_Current`, `Incorporated_Places`): the point
resolves to "San Francisco city". Source:
https://geocoding.geo.census.gov/geocoder/

## Follow-up performed

- `scripts/sync-va-facilities.ts --ids 499` re-run live: `has_va` false → true,
  nearest_va now the in-city SF VA facility. See the companion
  `va_facilities_sync_2026-09-03_ids-499.md`.

## Not affected / deliberately not re-run

- **Fit-score baseline**: id 499 is `is_candidate=false`, so it is not a ranked
  candidate and is absent from `baselines/fit_scores.json`. No regen needed.
- **Global military-proximity / structural-feature recomputes**: a global run
  would sweep in unrelated drift for one non-ranked row; deferred to the next
  full Apply phase. SF does not surface on any near-base or similar-city
  surface (both gate on `is_candidate`).
