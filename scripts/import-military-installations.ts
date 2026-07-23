/*
 * Imports a versioned military-installation source file into Neon.
 *
 * The source's city/state fields identify the command's primary municipality;
 * they are not coordinates. Keep latitude/longitude NULL until an authoritative
 * installation-site source supplies a precise point, then use those points for
 * radius matching. A slash-delimited city/state intentionally remains one command
 * row rather than inventing two sites from an ambiguous source record.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-military-installations.ts <json> [--dry-run]
 */
import { readFileSync } from "node:fs";
import { getSql } from "../lib/db";

interface Installation {
  name: string;
  city: string;
  state: string;
}

interface SourceFile {
  generated_date: string;
  service_branch: string;
  scope: string;
  count: number;
  installations: Installation[];
  official_sources: string[];
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid or missing ${field}`);
  }
  return value.trim();
}

function parseSource(path: string): SourceFile {
  const source = JSON.parse(readFileSync(path, "utf-8")) as Partial<SourceFile>;
  if (!Array.isArray(source.installations)) throw new Error("installations must be an array");
  if (source.count !== source.installations.length) {
    throw new Error(`count (${source.count}) does not match installations (${source.installations.length})`);
  }
  if (!Array.isArray(source.official_sources) || source.official_sources.length === 0) {
    throw new Error("official_sources must contain at least one source URL");
  }

  const installations = source.installations.map((row, index) => ({
    name: requireText(row?.name, `installations[${index}].name`),
    city: requireText(row?.city, `installations[${index}].city`),
    state: requireText(row?.state, `installations[${index}].state`),
  }));

  return {
    generated_date: requireText(source.generated_date, "generated_date"),
    service_branch: requireText(source.service_branch, "service_branch"),
    scope: requireText(source.scope, "scope"),
    count: source.count,
    installations,
    official_sources: source.official_sources.map((url, index) =>
      requireText(url, `official_sources[${index}]`)
    ),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sourcePath = args.find((arg) => !arg.startsWith("--"));
  if (!sourcePath) {
    throw new Error("Usage: import-military-installations <json> [--dry-run]");
  }

  const source = parseSource(sourcePath);
  const sourceUrl = source.official_sources[0];
  console.log(
    `Importing ${source.count} military installations from ${sourcePath}${dryRun ? " (dry run)" : ""}`
  );

  for (const row of source.installations) {
    console.log(`  ${dryRun ? "=" : "+"} ${source.service_branch}: ${row.name} — ${row.city}, ${row.state}`);
  }

  if (!dryRun) {
    const sql = getSql();
    for (const row of source.installations) {
      await sql.query(
        `INSERT INTO military_installations (
           service_branch, command_name, installation_type, operational_status,
           country, city, state, source_kind, source_url, source_retrieved_on, notes,
           created_at, updated_at
         ) VALUES (
           $1, $2, 'installation_command', 'active',
           'US', $3, $4, 'official_installation_directory', $5, $6::date, $7,
           now(), now()
         )
         ON CONFLICT (service_branch, command_name, country, city, state) DO UPDATE SET
           installation_type = EXCLUDED.installation_type,
           operational_status = EXCLUDED.operational_status,
           source_kind = EXCLUDED.source_kind,
           source_url = EXCLUDED.source_url,
           source_retrieved_on = EXCLUDED.source_retrieved_on,
           notes = EXCLUDED.notes,
           updated_at = now()`,
        [
          source.service_branch,
          row.name,
          row.city,
          row.state,
          sourceUrl,
          source.generated_date,
          `Source scope: ${source.scope}`,
        ]
      );
    }
  }

  console.log(`${dryRun ? "Dry run" : "Import"} complete. ${source.count} row(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
