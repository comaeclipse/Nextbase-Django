# Total Crime Index (TCI) methodology

The reproducible way to produce `locations_location.tci` and its `crime` label
for a curated city, replacing scraped consumer "crime index" values (which are
proprietary and disagree by ~3×). The math lives in `lib/crime-index.ts`; this
file is the sourcing runbook. Solved once for issue #278 / the #64 follow-up.

## Definition

TCI is a **national-indexed composite**, national average = 100, lower is safer:

```
violentIndex  = 100 × cityViolentRatePer100k  / nationalViolentRatePer100k
propertyIndex = 100 × cityPropertyRatePer100k / nationalPropertyRatePer100k
TCI           = round( 0.5 × violentIndex + 0.5 × propertyIndex )
```

Each offense family is indexed to the national rate first, then averaged with
**equal weight**. This is deliberate: property crime is ~5× more common than
violent crime by raw count, so summing counts would make TCI track shoplifting
more than assault. Equal weighting gives the two families parity. "Total" means
it spans both families, not that it is their unweighted sum. The weights are
`VIOLENT_WEIGHT` / `PROPERTY_WEIGHT` in `lib/crime-index.ts` (must sum to 1).

The `crime` label is derived from TCI with clean, documented bands:

| Label | TCI |
|---|---|
| `Low` | < 75 |
| `Moderate` | 75–149 |
| `High` | ≥ 150 |

These supersede the legacy `crime` values, which mix two vocabularies
(`Low/Moderate/High` and letter grades `A+…F`) and are flagged as unreliable in
SCHEMA.md. Do **not** try to reproduce the letter grades.

## Inputs and where to get them

Both the city counts and the national reference must be from the **same FBI
year**.

1. **City offense counts** — FBI Crime Data Explorer (CDE), agency data:
   - Find the city police agency and its ORI at <https://cde.ucr.cjis.gov/> →
     search the agency, or via the CDE API (`api.usa.gov/crime/fbi/cde/...`,
     free api.data.gov key).
   - **Keyless batch path:** the CDE web app's own backend needs no key.
     `https://cde.ucr.cjis.gov/LATEST/agency/byStateAbbr/{ST}` lists every
     agency with its ORI, and
     `https://cde.ucr.cjis.gov/LATEST/summarized/agency/{ORI}/{violent-crime|property-crime}?from=01-YYYY&to=12-YYYY`
     returns the agency's monthly counts, covered population and rates.
     `scripts/fetch-cde-tci.ts` turns a list of `(location id, ORI)` pairs
     into a patch file for `scripts/apply-location-patches.ts`, applying the
     year rule below automatically (see `cde_tci_backfill_2026-09-02.md`).
     A town with no municipal agency uses its county sheriff as a disclosed
     county-wide proxy.
   - Pull, for the chosen year: **violent** offense count (murder + rape +
     robbery + aggravated assault), **property** offense count (burglary +
     larceny-theft + motor-vehicle theft), and the agency's **covered
     population**.
   - If the agency did **not** report for that year (NIBRS transition gaps are
     common), say so and use the most recent reported year, or fall back to the
     county sheriff / a state UCR program — never a consumer index. A
     "not reported" answer is a valid blocker, not something to paper over.

2. **National reference rates** — FBI national estimates for the same year,
   encoded in `NATIONAL_CRIME_REFERENCE` in `lib/crime-index.ts`.

### National reference (keep this and the code in sync)

`NATIONAL_CRIME_REFERENCE_BY_YEAR` in `lib/crime-index.ts`:

| Year | Violent /100k | Property /100k | Source |
|---|---|---|---|
| 2023 (default) | 363.8 | 1916.7 | FBI UCR, *Crime in the Nation 2023* (violent rate stated verbatim in the FBI release; property from the 2023 CDE national estimate) |
| 2022 | 380.7 | 1954.4 | FBI UCR 2022 national estimates (CDE) |
| 2020 | 387.8 | 1958.2 | FBI UCR, *Crime in the United States 2020* national estimates |

More than one year is kept on purpose — see the coverage gap below, which forces
some cities to be indexed against an older year. When you add a year, update
**both** this table and the code map, and index each city's counts against the
**same** year's rates. (2024 exists — USAFacts gives national property 1,760.1;
the national *violent* rate was not confirmed from an FBI-primary page, so 2024
is intentionally not shipped yet.)

## The NIBRS coverage gap (read before trusting a recent year)

The FBI's move to NIBRS-only collection left large gaps: whole states dropped to
~50% agency coverage around 2021, and the CDE returns a **`0` or `null` count**
for a non-reporting agency — which is *not* a real zero. **Always pair a city's
counts with the national rate of the same year, and never index a `0`/`null` as
if the city had no crime.** If a city's recent years are unusable:

1. Index its **last reliable FBI year** against that year's national rate (add
   the year to the code map if needed), or
2. use the state UCR program's agency file if it still publishes one, or
3. mark the city's TCI **blocked** — a defensible "not reported to the FBI"
   outcome, never a scraped consumer number.

**Consumer-site trap:** sites like NeighborhoodScout/AreaVibes/HomeSnacks often
relabel a city's last FBI-reported year under a newer year. If their "2023"
violent count equals the CDE's 2020 count, they are recycling 2020 — do not use
it as a 2023 figure.

## Computing it

```powershell
# raw FBI counts + the agency's covered population
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/compute-tci.ts `
  --name "City, ST" --violent <count> --property <count> --population <covered_pop> --year 2023

# or feed already-computed per-100k rates
node "--env-file=$envFile" node_modules/tsx/dist/cli.mjs scripts/compute-tci.ts `
  --name "City, ST" --violent-rate <r> --property-rate <r>
```

It prints the two sub-indices, the TCI, the `crime` label, and a CSV-ready
`...,<TCI>,<label>,...` fragment. Record the FBI year, ORI, and counts in the
city's `data/<city>_<st>_sources.md`.

## Worked example — Melbourne, FL (a real coverage-gap case)

Melbourne is exactly why the gap section above exists. FBI CDE agency
**FL0050700** (Melbourne PD):

| Year | Violent count | Covered pop | Usable? |
|---|---|---|---|
| 2019 | 579 | 83,668 | yes |
| 2020 | 757 | 83,806 | **yes — last reliable year** |
| 2021 | null | 84,112 | no (non-reporting) |
| 2022 | 0 | 85,761 | no (`0` placeholder) |
| 2023 | 0 | 87,147 | **no — fake zero, FL NIBRS gap** |
| 2024 | 34 | 87,601 | no (partial/incomplete) |

So Melbourne **cannot** be indexed against 2023. Its consumer-site "903/100k"
figures are the FBI **2020** count (757 ÷ 83,806) recycled under a newer label.
Melbourne is indexed against its **2020** counts and the FBI **2020** national
reference:

```
scripts/compute-tci.ts --name "Melbourne, FL" --violent 757 --property 2544 --population 83806 --year 2020
```

That yields `TCI = 194`, `CrimeRating = High`. Record the ORI, counts, same-year
reference and fake-zero later years in `data/melbourne_fl_sources.md`.

Source: [FBI 2023 Crime in the Nation](https://www.fbi.gov/news/press-releases/fbi-releases-2023-crime-in-the-nation-statistics),
[FBI 2020 Crime Statistics](https://www.fbi.gov/news/press-releases/fbi-releases-2020-crime-statistics),
[FBI Crime Data Explorer](https://cde.ucr.cjis.gov/) (agency FL0050700).
