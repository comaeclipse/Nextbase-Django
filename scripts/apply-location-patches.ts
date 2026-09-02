/**
 * Apply a reviewed patch file of per-row field values to locations_location.
 *
 * One generic applier for the issue #55 backfills (tci/crime, gas_price,
 * sun_days, lgbtq_state_policy_score, defense_hub_manual), so each backfill
 * ships as a data file with provenance instead of a new one-off script. A
 * patch file is:
 *
 *   {
 *     "retrieved_on": "2026-09-02",
 *     "patches": [
 *       { "id": 112, "name": "Florence", "state": "AL",
 *         "fields": { "tci": 131, "crime": "Moderate" },
 *         "method": "...", "source_url": "..." }
 *     ]
 *   }
 *
 * Rules:
 *   - Only the columns in ALLOWED_FIELDS can be written; anything else throws.
 *   - Every row is identity-checked (id + name + state) before a write.
 *   - A field is written only where the DB value is currently NULL, unless
 *     --overwrite is passed; a non-null value is otherwise reported and skipped,
 *     so re-running after a partial apply is safe.
 *   - Nothing is written in --dry-run.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-location-patches.ts --patch <file.json> --dry-run
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/apply-location-patches.ts --patch <file.json> [--overwrite]
 */
import { readFileSync } from "node:fs";
import { getSql } from "../lib/db";

export const ALLOWED_FIELDS = [
  "tci",
  "crime",
  "gas_price",
  "sun_days",
  "lgbtq_state_policy_score",
  "defense_hub_manual",
] as const;
export type PatchField = (typeof ALLOWED_FIELDS)[number];

export interface LocationPatch {
  id: number;
  name: string;
  state: string;
  fields: Partial<Record<PatchField, number | string | boolean | null>>;
  method: string;
  source_url: string;
}

export interface LocationPatchFile {
  retrieved_on: string;
  patches: LocationPatch[];
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  const v = process.argv[i + 1];
  if (!v || v.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return v;
}

export function validatePatchFile(file: LocationPatchFile): void {
  if (!Array.isArray(file.patches)) throw new Error("patch file has no patches[]");
  const seen = new Set<number>();
  for (const p of file.patches) {
    if (!Number.isInteger(p.id)) throw new Error(`patch without integer id: ${JSON.stringify(p)}`);
    if (seen.has(p.id)) throw new Error(`duplicate patch for id=${p.id}`);
    seen.add(p.id);
    if (!p.name || !p.state) throw new Error(`patch id=${p.id} is missing name/state`);
    if (!p.method || !p.source_url) throw new Error(`patch id=${p.id} is missing method/source_url`);
    const keys = Object.keys(p.fields ?? {});
    if (keys.length === 0) throw new Error(`patch id=${p.id} has no fields`);
    for (const k of keys) {
      if (!(ALLOWED_FIELDS as readonly string[]).includes(k)) {
        throw new Error(`patch id=${p.id} writes disallowed field "${k}"`);
      }
    }
  }
}

async function main() {
  const path = arg("--patch");
  if (!path) throw new Error("--patch <file.json> is required");
  const dryRun = process.argv.includes("--dry-run");
  const overwrite = process.argv.includes("--overwrite");

  const file = JSON.parse(readFileSync(path, "utf8")) as LocationPatchFile;
  validatePatchFile(file);
  const sql = getSql();

  console.log(
    `${dryRun ? "DRY RUN — would apply" : "Applying"} ${file.patches.length} patch row(s) from ${path}` +
      ` (retrieved ${file.retrieved_on})${overwrite ? " [overwrite]" : ""}\n`,
  );

  let written = 0;
  let skipped = 0;
  for (const p of file.patches) {
    const rows = (await sql`
      SELECT id, name, state, tci, crime, gas_price, sun_days, lgbtq_state_policy_score, defense_hub_manual
      FROM locations_location WHERE id = ${p.id}
    `) as Array<Record<string, unknown>>;
    if (rows.length !== 1) throw new Error(`Expected 1 row for id=${p.id} (${p.name}), found ${rows.length}`);
    const before = rows[0];
    if (before.name !== p.name || before.state !== p.state) {
      throw new Error(`Identity mismatch id=${p.id}: DB "${before.name}, ${before.state}" vs patch "${p.name}, ${p.state}"`);
    }

    for (const [field, value] of Object.entries(p.fields) as Array<[PatchField, unknown]>) {
      const current = before[field];
      if (current != null && !overwrite) {
        console.log(`  skip ${p.name}, ${p.state} ${field}: already ${JSON.stringify(current)} (patch ${JSON.stringify(value)})`);
        skipped += 1;
        continue;
      }
      console.log(`  ${p.name}, ${p.state} ${field}: ${JSON.stringify(current)} -> ${JSON.stringify(value)}  [${p.method}]`);
      if (!dryRun) {
        // Column names are validated against ALLOWED_FIELDS above, so a
        // per-field switch keeps the SQL fully parameterized.
        switch (field) {
          case "tci":
            await sql`UPDATE locations_location SET tci = ${value as number}, updated_at = now() WHERE id = ${p.id}`;
            break;
          case "crime":
            await sql`UPDATE locations_location SET crime = ${value as string}, updated_at = now() WHERE id = ${p.id}`;
            break;
          case "gas_price":
            await sql`UPDATE locations_location SET gas_price = ${value as string}, updated_at = now() WHERE id = ${p.id}`;
            break;
          case "sun_days":
            await sql`UPDATE locations_location SET sun_days = ${value as number}, updated_at = now() WHERE id = ${p.id}`;
            break;
          case "lgbtq_state_policy_score":
            await sql`UPDATE locations_location SET lgbtq_state_policy_score = ${value as number}, updated_at = now() WHERE id = ${p.id}`;
            break;
          case "defense_hub_manual":
            await sql`UPDATE locations_location SET defense_hub_manual = ${value as boolean}, updated_at = now() WHERE id = ${p.id}`;
            break;
        }
      }
      written += 1;
    }
  }

  console.log(`\n${dryRun ? "Would write" : "Wrote"} ${written} field value(s); skipped ${skipped} already-filled.`);
  if (dryRun) console.log("No write performed.");
  if (file.patches.some((p) => "defense_hub_manual" in p.fields)) {
    console.log(
      written > 0
        ? "defense_hub_manual is in this patch: run scripts/recompute-defense-hub.ts next (defense_hub is derived, never written here)."
        : "defense_hub_manual is in this patch but nothing was written (all rows already filled) — recompute-defense-hub.ts would be a no-op.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
