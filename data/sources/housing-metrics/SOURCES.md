# Housing metrics — source decisions and verification (issue #170 Phase A)

Verified 2026-08-27 against the US Census ACS **2024 5-year** release (2020–2024),
the latest 5-year available (2025 5-year due ~Dec 2026) and the same vintage the
existing `median_rent` sync used on 2026-08-18.

## Columns and variables

| Column | ACS variable | Definition |
| --- | --- | --- |
| `entry_home_value` | `B25076_001E` | Lower value quartile (25th percentile) of owner-occupied housing units' value, dollars |
| `median_rent_2br` | `B25031_004E` | Median gross rent, renter-occupied units paying cash rent, 2 bedrooms |
| `median_rent_3br` | `B25031_005E` | Median gross rent, renter-occupied units paying cash rent, 3 bedrooms |

Variable metadata confirmed keyless from the API of record:
`https://api.census.gov/data/2024/acs/acs5/variables/B25076_001E.json` and
`https://api.census.gov/data/2024/acs/acs5/groups/B25031.json` (B25031: `_001E`
total, `_002E` no bedroom, `_003E` 1br, `_004E` **2br**, `_005E` **3br**,
`_006E` 4br, `_007E` 5+br).

## Why B25076 is the "entry home" metric

`entry_home_value` is a **formal percentile of the whole owner-occupied
stock**, so a single burned-out fixer-upper listing can never make a city look
affordable. The trade, stated plainly (issue #170 open decision 1, resolved
for ACS): "value" is the respondent's own estimate of what the property
(house and lot, mobile home and lot, or condominium unit) would sell for — a
**self-reported stock value across all structure types**, not a recorded sale
price, and not restricted to detached single-family homes. Chosen over
Redfin/Zillow sale-price percentiles for full coverage of the curated places
and same-family comparability with the existing ACS rent columns.
Definitions: `https://www.census.gov/quickfacts/fact/note/US/HSG495221` and
the ACS Subject Definitions
(`https://www2.census.gov/programs-surveys/acs/tech_docs/subject_definitions/2024_ACSSubjectDefinitions.pdf`).

## Why B25031 (gross rent)

Gross rent = contract rent plus estimated average monthly utilities
(electricity, gas, water/sewer, fuels) when paid by the renter — the **same
utilities-inclusive definition as the existing `median_rent` (B25064)**, so
the three rent columns are directly comparable and all match the cost model's
utilities-in-housing convention.
Definition: `https://www.census.gov/quickfacts/fact/note/US/HSG860221`.

## Probe values (plausibility anchors, ACS 2024 5-year, place level)

| Place | B25076 entry value | B25077 median value | 2br rent | 3br rent |
| --- | --- | --- | --- | --- |
| Casper city, WY | $194,900 | $260,400 | $977 | $1,360 |
| Roseville city, CA | $533,500 | $661,400 | $2,140 | $2,569 |
| Elko city, NV | $193,800 | $309,100 | $1,283 | $1,679 |
| Paradise CDP, NV | $274,800 | $384,200 | $1,424 | $1,825 |
| Hamilton town, WA (pop 299) | suppressed | $237,000 | suppressed | suppressed |

Probes were retrieved via Census Reporter's copy of the identical release
(keyless data queries are now rejected by api.census.gov) and cross-validated
to the dollar against the repo's own keyed 2026-08-18 pull (Casper/Elko
B25064). The importer re-confirms every figure against the API of record when
it runs with `CENSUS_API_KEY`.

## Suppression

A suppressed median/quartile arrives as a **negative sentinel** (-666666666
"insufficient sample"; also -222222222, -333333333, -555555555, -888888888,
-999999999), which the importer's positive plausibility bounds reject; `null`
means the geography has no row. Reference:
`https://www.census.gov/data/developers/data-sets/acs-1year/notes-on-acs-estimate-and-annotation-values.html`.
Observed pattern: places ~20k+ publish 2br/3br reliably; sub-1,000 places
lose everything including B25076 (the repo's known B25064-suppressed towns —
Hamilton WA, Malabar FL — will be null here too). CDPs are covered at ACS
geography `place`; neighborhoods that are not Census places have no direct
row and stay null (the `own()` inheritance policy forbids borrowing the
parent city's percentile).

## API access

As of 2026 the Census Data API **requires a key for every data query** (the
old keyless 500/day allowance is gone; metadata endpoints remain open).
Signup: `https://api.census.gov/data/key_signup.html` → `CENSUS_API_KEY` in
`.env`. Volume: all three variables fit one `get=`, one call per state per
geography ≈ 40–50 calls total.
