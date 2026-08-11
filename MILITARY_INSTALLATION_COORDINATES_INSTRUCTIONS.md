# Military Installation Coordinate Research Instructions

Use this guide when an LLM (or operator) is asked to source per-installation
latitude/longitude for the `military_installations` table. This is **Phase 1**
of issue [#4](https://github.com/comaeclipse/Nextbase-Django/issues/4) and is
the sole blocker on issue [#1](https://github.com/comaeclipse/Nextbase-Django/issues/1)
("near a base" city curation) and the `near_base` facet of issue #7.

This is a **research task, not a coding task**. Do not edit `scripts/`, do not
write to the database, and do not modify the existing `data/*_installations.json`
source files. Return findings in the output format below and let the calling
session (or the `data`/`backend` role) apply them.

## Why this is needed

`military_installations` has 182 rows (57 Air Force, 54 Navy, 51 Army, 20
Marine Corps), loaded from `data/air_force_installations.json`,
`data/navy_installations.json`, `data/army_installations.json`, and
`data/marine_corps_installations.json` via `scripts/import-military-installations.ts`.
Every row's `latitude`/`longitude` is `NULL` **by design** — the source files
only give a command's principal city/state, not a site-level point. Confirmed
still true in the DB as of 2026-08-11 (`SELECT count(*) FILTER (WHERE latitude
IS NULL) FROM military_installations` = 182).

Without coordinates, no "is city X within N miles of a base" query is possible.

## Target schema

Table `military_installations` (see `scripts/migrate-military-installations.ts`):

```
id bigserial PRIMARY KEY
service_branch text NOT NULL
command_name text NOT NULL
installation_type text NOT NULL DEFAULT 'installation_command'
operational_status text NOT NULL DEFAULT 'active'
country text NOT NULL DEFAULT 'US'
city text NOT NULL
state text NOT NULL
latitude numeric            -- target of this research
longitude numeric           -- target of this research
source_kind text NOT NULL
source_url text
source_retrieved_on date
notes text
UNIQUE (service_branch, command_name, country, city, state)
```

`command_name`, `city`, and `state` come verbatim from the branch JSON files —
they are the join key. **Do not rename or "correct" them**; if a source uses a
different name for the same installation, record that as a note, but key your
output to the exact string already in the JSON file.

## Scope

All 182 installations across:

- `data/air_force_installations.json` (57)
- `data/navy_installations.json` (54)
- `data/army_installations.json` (51)
- `data/marine_corps_installations.json` (20)

Read each file's `installations` array (`name`, `city`, `state`) as your work list.

## Coordinate requirement — read this twice

The coordinate must be the **installation site itself** (main gate, headquarters
point, or published facility centroid) — **never a city centroid**. This is the
exact gap the current data has (city/state only) and the exact thing that would
make the data useless if faked. If you cannot find a site-level point for an
installation, leave it blank and say so — do not substitute the city's coordinates.

## Authoritative sources, in priority order

1. **HIFLD "Military Installations, Ranges, and Training Areas."** This is the
   dataset originally proposed for this phase — an open, authoritative GIS layer
   maintained for the Homeland Infrastructure Foundation-Level Data program,
   carrying per-site coordinates plus branch/component/status attributes. Its
   hosting URL has moved before (ArcGIS Hub / `hifld-geoplatform` org / geoplatform.gov
   mirrors); search for the current authoritative location rather than trusting
   a hardcoded link, and record the exact URL and access date you used.
2. **The installation's official `.mil` site** — most bases publish a physical
   address (visitor center, main gate, or headquarters) on a "Contact Us" or
   "Directions" page. Geocode that address with a reliable geocoder and record
   both the address and the source page URL.
3. **GNIS (USGS Geographic Names Information System)** — authoritative for named
   physical features/installations, useful when HIFLD lacks a clean name match.
4. **Wikipedia infobox coordinates** — usable only as corroboration or a last
   resort, and only when the infobox itself cites a primary source. Never use
   Wikipedia as your sole source without saying so in `notes` and marking
   confidence `low`.

## Matching and edge cases

- **Renamed Army posts.** Several installations were renamed 2023–2024; check
  both names when searching. Known pairs: Fort Benning → Fort Moore, Fort Bragg
  → Fort Liberty (later reverted to Fort Bragg), Fort Hood → Fort Cavazos, Fort
  Rucker → Fort Novosel, Fort Polk → Fort Johnson, Fort Pickett → Fort Barfoot,
  Fort A.P. Hill → Fort Walker, Fort Lee → Fort Gregg-Adams. Confirm which name
  is current before treating a source as authoritative — some renamings were
  themselves reversed.
- **Joint bases.** The source JSON already consolidates joint bases under one
  current name (see each file's `city_method` note) rather than duplicating the
  legacy component name. Find the coordinate for the joint base as a whole, not
  a specific tenant component.
- **No name match found.** Don't force it. Report the row with coordinates left
  blank and a one-line note on what you checked and why it didn't resolve.

## Confidence tiers — tag every row

- **high** — matched by name directly in HIFLD (or an equivalent authoritative
  GIS layer), and the point falls geographically inside the stated city/state.
- **medium** — geocoded from an official `.mil` address, or matched in HIFLD
  under a name variant you had to reconcile.
- **low** — a single secondary source (e.g., Wikipedia) with no official
  corroboration. Flag these explicitly; they should get a human pass before
  being trusted for radius matching.

## Sanity checks before reporting a row

- Coordinate falls within (or very near) the stated state's bounding box.
- Not identical to another installation's coordinate unless they are genuinely
  co-located (e.g., true joint bases).
- Decimal degrees, WGS84, 4–6 decimal places.

## Output format

Do not write files or touch the database. Return your findings as one table
(or equivalent JSON) per branch, one row per installation, in this shape:

```
command_name | city | state | latitude | longitude | confidence | source_name | source_url | retrieved_on | notes
```

Leave `latitude`/`longitude` blank (not a guess) for anything unresolved, and
say why in `notes`. The calling session will persist this as
`data/<branch>_installations_coordinates.json` — an array of
`{ command_name, city, state, latitude, longitude, confidence, source_kind,
source_url, retrieved_on, notes }` — for the `data`/`backend` role to merge into
`military_installations` with a follow-up script keyed on
`(service_branch, command_name, country, city, state)`.

## Explicitly out of scope

- VA facility data (issue #4 Phase 2) — already substantially done, don't touch.
- Defense employer/industry data (issue #4 Phase 0) — already done, don't touch.
- Any code change to `scripts/import-military-installations.ts`,
  `scripts/migrate-military-installations.ts`, or `lib/filters.ts` — those are
  Phase 3/4 (`backend`/`data` role) work, not this research task.

## Open question for the data/backend role (not for the researcher to decide)

Whether coordinate provenance (`source_url`/`source_retrieved_on`) should share
the existing identity-ingest columns or get its own pair (e.g.
`coordinate_source_url`, `coordinate_retrieved_on`), since the two facts — "this
installation exists" vs. "this is its coordinate" — currently come from
different sources at different times and overwriting the identity provenance
with coordinate provenance would lose information.
