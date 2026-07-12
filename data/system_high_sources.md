# System High — job-location sources

System High Corporation is an intelligence/defense services integrator. It has no
public ATS feed we scrape (unlike RTX), so its site footprint is hand-sourced.

- **Provenance:** the 14 cities in `system_high_job_locations.csv` were attested on
  2026-07-11 from System High's careers site as locations with active job listings.
- **Counts:** `Onsite=1` / `TotalPostings=1` record *attested presence* (≥1 onsite
  opening), not a scraped opening total. Under the derived-hub rule
  (`onsite+hybrid ≥ DEFENSE_HUB_MIN_POSTINGS`, currently 1) this is enough for a
  city to count as a physical defense facility and promote to a defense hub.
- **Linkage:** 6 of the 14 map to curated retirement locations (San Diego CA,
  Albuquerque NM, New Orleans LA, Huntsville AL, Colorado Springs CO, Chantilly VA).
  Only **Albuquerque, NM** was not already a hub, so it is the one hub flip. The
  other 8 (Fort Worth TX, Ellsworth AFB SD, Robins AFB GA, Arlington VA,
  Wright-Patterson AFB OH, Scott AFB IL, Bedford MA, Fort Belvoir VA) are stored as
  `location_id = NULL` footprint rows and will attach automatically if those cities
  are ever added as retirement locations.

Refresh: re-run `scripts/import-defense-employer-locations.ts` with an updated CSV,
then `scripts/recompute-defense-hub.ts`. If System High later exposes a scrapable
careers API, add a sync writer and drop the attested counts from the CSV.
