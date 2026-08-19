# Rhythm Calibration v0.1

**Status:** local R&D method. Not imported to Neon, not a production schema, and
not a similarity score.

## Why this exists

"Is this town dead after 8?" collapses two different realities:

1. **Industrial rhythm** -- whether major work systems run continuously, on
   shifts, or mostly on a daytime schedule.
2. **Social rhythm** -- whether ordinary residents have a broad, reliable
   evening social ecosystem beyond isolated bars, special events, or venues.

A city can be industrially awake and socially quiet. North Platte is the first
calibration case: Bailey Yard runs on a freight/logistics clock while the
available social evidence is mostly destination- and event-led. Do not use a
late shift, a festival, or a single bar as proof of broad nightlife.

## Descriptor contract

Use these independently. They are ordered evidence labels, not 0--1 scores.

| Descriptor | Allowed values | Evidence that can support it | What it cannot prove |
| --- | --- | --- | --- |
| `industrial_rhythm` | `daytime`, `extended_hours`, `shift_based`, `continuous_24_7` | major employer operations, industry schedules, freight/utility/healthcare operations | ordinary social life or street activity |
| `social_evening_ecosystem` | `broad`, `distributed`, `venue_led`, `event_led`, `thin`, `unknown` | representative venue/event sample plus resident accounts | whether industry is quiet |
| `after_8_social_pattern` | `active`, `selective`, `sparse_except_venues_events`, `unknown` | comparable ordinary-week observation and counterevidence | a numeric nightlife score |
| `rhythm_mismatch` | `low`, `moderate`, `high`, `unknown` | independently established industrial and social descriptors | a value judgment about the town |

Every entry needs a `scope` (city, county, metro, downtown, or neighborhood),
`retrieved_on` date, and a counterexample where one exists.

Every calibration row also carries a `calibration_status`: `complete` only when
all four items of the retrieval test below are satisfied for that city;
`provisional` otherwise. The eval v1 full-suite run (N02) caught this table
assigning North Platte a `high` mismatch while its own record supplies only
items #1 and #3 of that bar — a partial assignment must not silently read as a
finished one (see `KNOWLEDGE_MODEL.md` §4.5).

## First three calibration cases

| City | Industrial rhythm | Social rhythm | Mismatch | Status | What is actually established |
| --- | --- | --- | --- | --- | --- |
| North Platte, NE | `continuous_24_7` | `event_led` / `venue_led` | `high` | `provisional` — items #2 and #4 of the evidence bar are outstanding | Bailey Yard covers 2,850 acres and handles about 10,000 cars daily. Current tourism and local accounts show events, arts, bars, and downtown programming, but not a broad ordinary-night social inventory. |
| Elko, NV | `shift_based` | `unknown` | `unknown` | `provisional` | Mining is a major regional labor anchor and outdoor/Western institutions are visible. The current evidence does not establish a representative after-hours pattern. |
| Odessa, TX | `shift_based` | `thin` / `venue_led` | `moderate` (hypothesis) | `provisional` | Oilfield, construction, logistics, health, and trade are major work anchors. Residents describe limited broad clubbing/nightlife alongside specific activities; a citywide social-night sample is still absent. |

The table intentionally leaves Elko and Odessa less resolved than North Platte.
The point is not to make all three look comparable; it is to reveal exactly
which question remains unresearched.

## North Platte calibration record

```json
{
  "city": "North Platte",
  "state": "NE",
  "industrial_rhythm": {
    "value": "continuous_24_7",
    "confidence": "high",
    "scope": "Bailey Yard and linked logistics operations",
    "evidence": [
      "Union Pacific: Bailey Yard covers 2,850 acres",
      "Union Pacific: approximately 10,000 cars handled daily",
      "Union Pacific: yard sits on key east-west and north-south corridors"
    ]
  },
  "social_evening_ecosystem": {
    "value": "event_led",
    "confidence": "moderate",
    "scope": "city social life; not industrial operations",
    "evidence": [
      "scheduled downtown music, food, shopping, and family events",
      "resident accounts identify churches and bars as important social paths"
    ],
    "counterevidence": [
      "organized concerts, breweries/wineries, theater, and seasonal events exist"
    ]
  },
  "after_8_social_pattern": "sparse_except_venues_events",
  "rhythm_mismatch": "high",
  "calibration_status": "provisional"
}
```

This record clearly supplies items #1 (Bailey Yard as the shift/continuous
anchor) and #3 (an event calendar read as event evidence) of the retrieval
test. Items #2 (a current, ordinary-week evening venue-hours sample) and #4
(two disagreeing lived-experience accounts) are outstanding; until both land,
`rhythm_mismatch: high` is a provisional assignment, not an established one.

## Retrieval test before assigning a city

For a candidate city, collect all four before assigning `rhythm_mismatch`:

1. One authoritative source on the largest shift/continuous employer.
2. A current, ordinary-week sample of evening venue hours across categories.
3. A current event calendar, labeled as event evidence rather than nightlife.
4. At least two lived-experience accounts that disagree or cover different
   routines.

If only #1 and #3 exist, record `industrial_rhythm` and leave social rhythm
unknown. If only #2 and #4 exist, record social rhythm and leave industrial
rhythm unknown.

## Sources

- Union Pacific, [Senior Leaders Reinforce Safety is Job No. 1 During North Platte Field Visit](https://www.up.com/news/safety/Senior-Leads-Reinforce-Safety-250707), retrieved 2026-08-07.
- Visit North Platte, [Live Music](https://www.visitnorthplatte.com/things-to-do/arts-entertainment/live-music/), retrieved 2026-08-07.
- KNOP News 2, [Music on the Bricks kicks off summer season](https://www.knopnews2.com/2026/05/16/music-bricks-kicks-off-summer-season-north-platte/), retrieved 2026-08-07.
- r/Nebraska, [What do folks think of North Platte?](https://www.reddit.com/r/Nebraska/comments/1j8xdr6/what_do_folks_think_of_north_platte/), nonrepresentative lived-experience accounts, retrieved 2026-08-07.
- Existing local R&D drafts: `north-platte-ne-independent-rd.md`,
  `elko-nv-cultural-baseline.md`, and `odessa-tx-elko-calibration.md`.
