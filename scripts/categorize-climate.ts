/*
 * Port of `python manage.py categorize_climate`
 * (locations/management/commands/categorize_climate.py).
 *
 * Writes locations_location.climate_category (the Explore/quiz climate filter)
 * from the shared classifier in lib/climate-category.ts. The rules live there so
 * scripts/import-csv.ts derives the same value at ingest time.
 *
 * Usage:
 *   # global rewrite (the historical behaviour)
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/categorize-climate.ts [--dry-run]
 *   # a single city, with the rule + inputs that decided it
 *   ... --name "Grand Junction, CO" --explain
 *   ... --id 111 --dry-run
 *   # report null/invalid categories across the table WITHOUT rewriting
 *   ... --audit
 *
 * --dry-run reports without writing. --explain adds the rule and reason per row.
 * --audit is read-only and exits non-zero if any row is null or outside the enum.
 */
import { getSql } from "../lib/db";
import type { LocationRow } from "../lib/types";
import {
  CLIMATE_CATEGORIES,
  explainClimate,
  isClimateCategory,
} from "../lib/climate-category";

type Category = (typeof CLIMATE_CATEGORIES)[number];

/** Exactly one optional --name/--id selector; SQL identifiers chosen here. */
function parseSelector(args: string[]): { where: string; params: (string | number)[]; label: string } | null {
  let selector: { where: string; params: (string | number)[]; label: string } | null = null;
  const flagsWithValues = ["--name", "--id"];
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (!flagsWithValues.includes(flag)) continue;
    if (selector) throw new Error("Choose at most one of --name or --id");
    const raw = args[++i]?.trim();
    if (!raw || raw.startsWith("--")) throw new Error("Missing value for " + flag);
    if (flag === "--id") {
      if (!/^\d+$/.test(raw) || Number(raw) <= 0) throw new Error("Invalid location id");
      selector = { where: "id = $1", params: [Number(raw)], label: "id " + raw };
    } else {
      const parts = raw.split(",").map((p) => p.trim());
      if (parts.length !== 2 || !parts[0] || !/^[A-Z]{2}$/.test(parts[1])) throw new Error('Expected --name "City, ST"');
      selector = { where: "name = $1 AND state = $2", params: parts, label: raw };
    }
  }
  return selector;
}

async function runAudit(): Promise<void> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, state, is_candidate, climate_category
    FROM locations_location
    ORDER BY is_candidate DESC, name ASC`) as unknown as Array<{
    id: number; name: string; state: string; is_candidate: boolean; climate_category: string | null;
  }>;
  const offenders = rows.filter((r) => r.climate_category === null || !isClimateCategory(r.climate_category));
  if (!offenders.length) {
    console.log(`All ${rows.length} rows have a valid climate_category (${CLIMATE_CATEGORIES.join(", ")}).`);
    return;
  }
  console.error(`${offenders.length} row(s) have a null or invalid climate_category:`);
  for (const r of offenders) {
    const shown = r.climate_category === null ? "NULL" : `"${r.climate_category}"`;
    console.error(`  - ${r.name}, ${r.state} (id ${r.id}${r.is_candidate ? ", candidate" : ""}): ${shown}`);
  }
  console.error(`Accepted keys: ${CLIMATE_CATEGORIES.join(", ")}. Run without --audit to rewrite them.`);
  process.exitCode = 1;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const explain = args.includes("--explain");
  const audit = args.includes("--audit");
  const selector = parseSelector(args);

  const sql = getSql();
  if (audit) {
    if (selector || dryRun || explain) throw new Error("--audit is a standalone read-only mode");
    await runAudit();
    return;
  }

  const locations = (selector
    ? await sql.query(`SELECT * FROM locations_location WHERE ${selector.where} ORDER BY name ASC`, selector.params)
    : await sql`SELECT * FROM locations_location ORDER BY featured DESC, name ASC`) as unknown as LocationRow[];

  if (selector && !locations.length) throw new Error("Location not found: " + selector.label);

  const counts: Record<Category, number> = { cold_snowy: 0, hot_humid: 0, hot_dry: 0, mild_coastal: 0 };
  let changed = 0;

  for (const loc of locations) {
    const { category, rule, reason } = explainClimate(loc);
    const before = loc.climate_category;
    if (before !== category) changed++;
    if (!dryRun) {
      await sql.query(
        "UPDATE locations_location SET climate_category = $1, updated_at = now() WHERE id = $2",
        [category, loc.id]
      );
    }
    counts[category]++;
    const delta = before !== category ? ` (was ${before ?? "NULL"})` : "";
    console.log(
      `${loc.name}, ${loc.state}: ${category}${delta}` +
        (explain ? `\n    rule ${rule}: ${reason}` : "")
    );
  }

  console.log(
    `\n${dryRun ? "Would categorize" : "Categorized"} ${locations.length} location(s); ${changed} change(s):`
  );
  for (const [cat, n] of Object.entries(counts)) console.log(`  ${cat}: ${n}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
