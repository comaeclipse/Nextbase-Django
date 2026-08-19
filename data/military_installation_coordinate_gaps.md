# Military installation coordinate gaps

Follow-up to `MILITARY_INSTALLATION_COORDINATES_INSTRUCTIONS.md`. Retrieved 2026-08-18 against the HIFLD MIRTA "DoD Sites - Point" layer (`https://services7.arcgis.com/n1YM8pTrFmm7L4hs/arcgis/rest/services/mirta/FeatureServer/0`).

The live inventory is 182 installations. After this pass, **181/182** have site-level coordinates. City centroids were not used.

## Issue #55 naming mismatch

#55 reported **9** ungeocoded installations but named only **eight**, and those eight used common-name aliases rather than the `military_installations.command_name` keys:

| #55 label | Actual `command_name` | Resolution |
| --- | --- | --- |
| Portsmouth Naval Shipyard (ME) | Naval Support Activity Maine (Kittery, ME) | HIFLD site "Portsmouth Naval Shipyard" |
| Marine Corps Mountain Warfare Training Center (Bridgeport, CA) | same | HIFLD site "Bridgeport" (USMC) |
| Marine Barracks Washington (DC) | same | Census geocode of official 8th & I address |
| Marine Corps Recruit Depot Parris Island (Beaufort, SC) | same | GNIS FID 2512275 |
| Dugway Proving Ground (UT) | same | HIFLD site "West Desert Test Center" |
| Natick Soldier Systems Center (Natick, MA) | U.S. Army Garrison Natick | HIFLD site "Combat Capabilities Development Command Soldier Center" |
| Yakima Training Center (WA) | same | GNIS FID 2512394 |
| United States Air Force Academy (CO) | same | HIFLD site "USAF Academy Site 2" |
| *(unnamed 9th)* | Naval Support Facility Thurmont (Thurmont, MD) | still unresolved — see below |

## Unresolved

**Naval Support Facility Thurmont** (Thurmont, MD) — Camp David. Not in the public MIRTA extract (no Thurmont/Camp David site on 2026-08-18). Official .mil pages do not publish a geocodable visitor-center or HQ address. Do **not** substitute the Thurmont city centroid. Revisit only if HIFLD or an official site-level point is published.

This row is excluded from `location_military_proximity` until it has coordinates. Radius matching for every other active installation is unblocked.
