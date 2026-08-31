/*
 * Compute a city's Total Crime Index (TCI) and `crime` label from FBI offense
 * data, using the fixed method in lib/crime-index.ts. Read-only: it writes
 * nothing, it just prints the CSV-ready values so a city ingest gets a
 * defensible, comparable TCI instead of a scraped consumer index.
 *
 * See data/sources/crime/TCI_METHODOLOGY.md for where the inputs come from.
 *
 * Usage (raw FBI counts + the agency's covered population):
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/compute-tci.ts \
 *     --name "Melbourne, FL" --violent 470 --property 2600 --population 87572 [--year 2023]
 *
 * Or feed rates directly (already per 100k):
 *   ... --violent-rate 537 --property-rate 2970
 *
 * Override the national reference (defaults to NATIONAL_CRIME_REFERENCE):
 *   ... --ref-violent 363.8 --ref-property 1916.6 --year 2023
 */
import {
  NATIONAL_CRIME_REFERENCE,
  ratesFromCounts,
  referenceForYear,
  totalCrimeIndexBreakdown,
  type CrimeReference,
} from "../lib/crime-index";

function num(args: string[], flag: string): number | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  const raw = args[i + 1];
  if (!raw || raw.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  const n = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(n)) throw new Error(`${flag} must be a number`);
  return n;
}

function str(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  const raw = args[i + 1];
  if (!raw || raw.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return raw;
}

function main() {
  const args = process.argv.slice(2);
  const name = str(args, "--name") ?? "(city)";

  const violent = num(args, "--violent");
  const property = num(args, "--property");
  const population = num(args, "--population");
  const violentRate = num(args, "--violent-rate");
  const propertyRate = num(args, "--property-rate");

  /*
   * National reference, in priority order: explicit --ref-violent/--ref-property
   * override → a stored year via --year → the shipped default. Pairing a city's
   * counts with the SAME FBI year is the whole point (see the methodology doc),
   * so --year selects the matching national baseline rather than just labelling.
   */
  const refViolent = num(args, "--ref-violent");
  const refProperty = num(args, "--ref-property");
  const year = num(args, "--year");
  let reference: CrimeReference;
  if (refViolent != null && refProperty != null) {
    reference = {
      year: year ?? NATIONAL_CRIME_REFERENCE.year,
      violentRatePer100k: refViolent,
      propertyRatePer100k: refProperty,
      source: `custom reference (year ${year ?? NATIONAL_CRIME_REFERENCE.year})`,
    };
  } else if (refViolent != null || refProperty != null) {
    throw new Error("Pass BOTH --ref-violent and --ref-property, or neither.");
  } else if (year != null) {
    reference = referenceForYear(year); // throws with guidance if the year isn't stored
  } else {
    reference = NATIONAL_CRIME_REFERENCE;
  }

  let rates: { violentRatePer100k: number; propertyRatePer100k: number };
  if (violentRate != null && propertyRate != null) {
    rates = { violentRatePer100k: violentRate, propertyRatePer100k: propertyRate };
  } else if (violent != null && property != null && population != null) {
    rates = ratesFromCounts({ violentCount: violent, propertyCount: property, population });
  } else {
    console.error(
      "Provide either --violent-rate and --property-rate, or --violent, --property and --population.\n" +
        "See data/sources/crime/TCI_METHODOLOGY.md.",
    );
    process.exit(1);
    return;
  }

  const b = totalCrimeIndexBreakdown(rates, reference);
  console.log(`${name} — Total Crime Index (national avg = 100, lower is safer)`);
  console.log(`  violent rate : ${rates.violentRatePer100k.toFixed(1)}/100k  → index ${b.violentIndex}`);
  console.log(`  property rate: ${rates.propertyRatePer100k.toFixed(1)}/100k  → index ${b.propertyIndex}`);
  console.log(`  reference    : FBI ${reference.year} (violent ${reference.violentRatePer100k}, property ${reference.propertyRatePer100k}/100k)`);
  console.log("");
  console.log(`  TCI = ${b.tci}   CrimeRating = ${b.label}`);
  console.log(`  CSV: ...,${b.tci},${b.label},...`);
}

try {
  main();
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
