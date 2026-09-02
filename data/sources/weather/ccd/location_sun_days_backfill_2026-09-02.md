# `sun_days` backfill from NOAA Comparative Climatic Data — 2026-09-02 (issue #55)

Fills all **37** ranked city candidates with no weather-card "sunny days" value.

## Convention

`sun_days` = mean annual **clear + partly cloudy** days at the nearest NOAA
CCD-2018 cloudiness station (table *Cloudiness — Mean Number of Days: Clear,
Partly Cloudy, Cloudy*; daylight hours; clear ≤ 3/10 sky cover, partly cloudy
4/10–7/10). NOAA normals carry no sunshine element, and the values already in
the column came from consumer climate sites (usclimatedata / BestPlaces) that
publish exactly this NOAA figure. Checked against the 196 filled ranked cities
before deriving anything:

| Check (nearest-station CL+PC vs stored `sun_days`) | Result |
| --- | ---: |
| median difference | 0 days |
| mean difference | −1.5 days |
| within ±10 days | 177 / 196 |
| within ±20 days | 185 / 196 |

(Recomputed against the checked-in station file and live coordinates on
2026-09-02.)

So this backfill continues the existing convention rather than introducing a
second one.

## Sources and tooling

- CCD-2018 cloudiness table: <https://www.ncei.noaa.gov/products/land-based-station/comparative-climatic-data>
  (file `clpcdy18.dat`, mirrored at <https://github.com/noaaccd/noaaccd.github.io>).
- Station coordinates: NCEI HOMR WBAN master list
  (<https://www.ncei.noaa.gov/access/homr/file/wbanmasterlist.psv.zip>); 12
  stations the list has no parseable location for carry manual coordinates and
  are flagged `coord_source: "... manual coords"` in the station file.
- `data/sources/weather/ccd/ccd18_cloudiness_stations.json` — the 270 CCD
  stations with CL / PC / CD and coordinates (257 geocoded).
- `scripts/derive-sun-days-from-ccd.ts` — nearest-station lookup for every
  candidate with `sun_days IS NULL`; writes the patch below. Stations beyond
  110 mi are skipped and reported (none this run); beyond 50 mi the patch
  method text says "regional proxy".

## Result

| City | Station (WBAN) | Miles | Clear | Partly cloudy | `sun_days` |
| --- | --- | ---: | ---: | ---: | ---: |
| Florence, AL | Huntsville, AL (03856) | 52 | 100 | 101 | 201 |
| Camden, AR | Little Rock, AR (13963) | 89 | 119 | 100 | 219 |
| Gilbert, AZ | Phoenix, AZ (23183) | 18 | 211 | 85 | 296 |
| Eureka, CA | Eureka, CA (24213) | 2 | 77 | 102 | 179 |
| Goleta, CA | Santa Maria, CA (23273) | 47 | 176 | 110 | 286 |
| Lake Forest, CA | Long Beach, CA (23129) | 30 | 159 | 119 | 278 |
| Boulder, CO | Denver Intl, CO (03017) | 33 | 115 | 130 | 245 |
| Broomfield, CO | Denver Intl, CO (03017) | 21 | 115 | 130 | 245 |
| Grand Junction, CO | Grand Junction, CO (23066) | 3 | 136 | 106 | 242 |
| Marietta, GA | Atlanta, GA (13874) | 23 | 110 | 107 | 217 |
| Danville, IL | Indianapolis, IN (93819) | 76 | 88 | 99 | 187 |
| Shreveport, LA | Shreveport, LA (13957) | 2 | 114 | 100 | 214 |
| Lexington, MA | Boston, MA (14739) | 13 | 98 | 103 | 201 |
| Quincy, MA | Boston, MA (14739) | 7 | 98 | 103 | 201 |
| Waltham, MA | Boston, MA (14739) | 12 | 98 | 103 | 201 |
| McHenry, MS | Mobile, AL (13894) | 53 | 102 | 116 | 218 |
| Great Falls, MT | Great Falls, MT (24143) | 4 | 79 | 106 | 185 |
| Missoula, MT | Missoula, MT (24153) | 4 | 75 | 83 | 158 |
| Morrisville, NC | Raleigh, NC (13722) | 4 | 111 | 106 | 217 |
| Reno, NV | Reno, NV (23185) | 6 | 158 | 93 | 251 |
| Ithaca, NY | Binghamton, NY (04725) | 31 | 52 | 102 | 154 |
| Ashville, OH | Columbus, OH (14821) | 19 | 72 | 103 | 175 |
| Oklahoma City, OK | Oklahoma City, OK (13967) | 7 | 139 | 96 | 235 |
| Bend, OR | Eugene, OR (24221) | 95 | 75 | 82 | 157 |
| King of Prussia, PA | Philadelphia, PA (13739) | 17 | 93 | 112 | 205 |
| Pittsburgh, PA | Pittsburgh, PA (94823) | 14 | 59 | 103 | 162 |
| Warren, PA | Erie, PA (14860) | 56 | 63 | 97 | 160 |
| North Kingstown, RI | Providence, RI (14765) | 11 | 98 | 103 | 201 |
| Pierre, SD | Huron, SD (14936) | 103 | 104 | 107 | 211 |
| Rapid City, SD | Rapid City, SD (24090) | 8 | 111 | 115 | 226 |
| Memphis, TN | Memphis, TN (13893) | 3 | 118 | 96 | 214 |
| Amarillo, TX | Amarillo, TX (23047) | 7 | 157 | 104 | 261 |
| Odessa, TX | Midland-Odessa, TX (23023) | 9 | 165 | 96 | 261 |
| Virginia Beach, VA | Norfolk, VA (13737) | 12 | 106 | 107 | 213 |
| Bellevue, WA | Seattle C.O., WA (24281) | 8 | 71 | 93 | 164 |
| Hamilton, WA | Seattle C.O., WA (24281) | 65 | 71 | 93 | 164 |
| Spokane, WA | Spokane, WA (24157) | 6 | 86 | 88 | 174 |

Weakest matches, disclosed as regional proxies in the patch: Pierre (Huron,
103 mi — same central-plains regime), Bend (Eugene, 95 mi — Eugene sits west of
the Cascades and is cloudier than Bend's high desert, so 157 likely
**understates** Bend; Bend has no CCD station, and a better figure would need a
secondary source), Camden AR (Little Rock, 89 mi), Danville IL (Indianapolis,
76 mi), Hamilton WA (Seattle, 65 mi).

Patch file: `location_sun_days_backfill_2026-09-02.json`
(format: `scripts/apply-location-patches.ts`).

## Apply

```bash
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-location-patches.ts --patch data/sources/weather/ccd/location_sun_days_backfill_2026-09-02.json --dry-run
node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-location-patches.ts --patch data/sources/weather/ccd/location_sun_days_backfill_2026-09-02.json
```

Production write only after merge (AGENTS.md). Not a Fit-score input — the
weather card and `/city/[id]/climate` only.
