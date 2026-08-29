/*
 * Verifies career-transition coverage and source hygiene.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/verify-career-transition.ts [--csv]
 */
import { getCareerTransitionCatalog, loadCareerTransitionCsvCatalog } from "../lib/career-transition";

async function main() {
  const catalog = process.argv.includes("--csv")
    ? loadCareerTransitionCsvCatalog()
    : await getCareerTransitionCatalog();

  const specialtiesByBranch: Record<string, number> = {};
  const specialtiesWithoutRoles: string[] = [];
  const specialtiesWithoutEmployers: string[] = [];

  for (const match of catalog.matches) {
    specialtiesByBranch[match.specialty.branch] =
      (specialtiesByBranch[match.specialty.branch] ?? 0) + 1;
    if (match.roles.length === 0) {
      specialtiesWithoutRoles.push(`${match.specialty.branch}:${match.specialty.code}`);
    }
    if (match.employers.length === 0) {
      specialtiesWithoutEmployers.push(`${match.specialty.branch}:${match.specialty.code}`);
    }
  }

  const employerTypeMix = catalog.employers.reduce<Record<string, number>>((acc, employer) => {
    acc[employer.employer_type] = (acc[employer.employer_type] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    JSON.stringify(
      {
        source: catalog.source,
        specialties: catalog.specialties.length,
        roles: catalog.roles.length,
        employers: catalog.employers.length,
        branches: specialtiesByBranch,
        employerTypeMix,
        specialtiesWithoutRoles,
        specialtiesWithoutEmployers,
      },
      null,
      2
    )
  );

  if (specialtiesWithoutRoles.length || specialtiesWithoutEmployers.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
