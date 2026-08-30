/*
 * Imports the curated career-transition CSV bundle into Neon.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/import-career-transition.ts data/career-transition [--dry-run]
 */
import { loadCareerTransitionCsvCatalog, normalizeSpecialtyKey } from "../lib/career-transition";
import { getSql } from "../lib/db";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

async function main() {
  const catalog = loadCareerTransitionCsvCatalog();
  console.log(
    `Importing career-transition bundle${dryRun ? " (dry run)" : ""}: ` +
      `${catalog.specialties.length} specialties, ${catalog.roles.length} roles, ` +
      `${catalog.employers.length} employers, ${catalog.skills.length} skills`
  );

  for (const specialty of catalog.specialties) {
    console.log(`  ${dryRun ? "=" : "+"} ${specialty.branch} ${specialty.code}: ${specialty.title}`);
  }

  if (dryRun) {
    console.log("Dry run complete. No rows written.");
    return;
  }

  const sql = getSql();

  for (const specialty of catalog.specialties) {
    await sql.query(
      `INSERT INTO military_specialties
         (branch, code_system, code, title, population, status, source_kind, source_url, source_retrieved_on)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (branch, code_system, code) DO UPDATE SET
         title = EXCLUDED.title,
         population = EXCLUDED.population,
         status = EXCLUDED.status,
         source_kind = EXCLUDED.source_kind,
         source_url = EXCLUDED.source_url,
         source_retrieved_on = EXCLUDED.source_retrieved_on,
         updated_at = now()`,
      [
        specialty.branch,
        specialty.code_system,
        specialty.code,
        specialty.title,
        specialty.population,
        specialty.status,
        specialty.source_kind,
        specialty.source_url,
        specialty.source_retrieved_on,
      ]
    );
  }

  for (const role of catalog.roles) {
    await sql.query(
      `INSERT INTO civilian_transition_roles
         (slug, title, role_family, onet_soc_code, summary, credential_notes,
          source_kind, source_url, source_retrieved_on)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         role_family = EXCLUDED.role_family,
         onet_soc_code = EXCLUDED.onet_soc_code,
         summary = EXCLUDED.summary,
         credential_notes = EXCLUDED.credential_notes,
         source_kind = EXCLUDED.source_kind,
         source_url = EXCLUDED.source_url,
         source_retrieved_on = EXCLUDED.source_retrieved_on,
         updated_at = now()`,
      [
        role.slug,
        role.title,
        role.role_family,
        role.onet_soc_code,
        role.summary,
        role.credential_notes,
        role.source_kind,
        role.source_url,
        role.source_retrieved_on,
      ]
    );
  }

  for (const employer of catalog.employers) {
    await sql.query(
      `INSERT INTO transition_employers
         (slug, display_name, parent_company, employer_type, defense_employer_slug,
          website_url, notes, skillbridge_status, skillbridge_participation_type,
          skillbridge_pathways, skillbridge_remote_available, skillbridge_nationwide,
          skillbridge_target_domains, skillbridge_duration_days_min,
          skillbridge_duration_days_max, skillbridge_mou_expiration,
          skillbridge_source_url, skillbridge_verified_at, skillbridge_notes,
          source_kind, source_url, source_retrieved_on)
       VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::text[], $11, $12,
          $13::text[], $14, $15, $16, $17, $18, $19, $20, $21, $22
       )
       ON CONFLICT (slug) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         parent_company = EXCLUDED.parent_company,
         employer_type = EXCLUDED.employer_type,
         defense_employer_slug = EXCLUDED.defense_employer_slug,
         website_url = EXCLUDED.website_url,
         notes = EXCLUDED.notes,
         skillbridge_status = EXCLUDED.skillbridge_status,
         skillbridge_participation_type = EXCLUDED.skillbridge_participation_type,
         skillbridge_pathways = EXCLUDED.skillbridge_pathways,
         skillbridge_remote_available = EXCLUDED.skillbridge_remote_available,
         skillbridge_nationwide = EXCLUDED.skillbridge_nationwide,
         skillbridge_target_domains = EXCLUDED.skillbridge_target_domains,
         skillbridge_duration_days_min = EXCLUDED.skillbridge_duration_days_min,
         skillbridge_duration_days_max = EXCLUDED.skillbridge_duration_days_max,
         skillbridge_mou_expiration = EXCLUDED.skillbridge_mou_expiration,
         skillbridge_source_url = EXCLUDED.skillbridge_source_url,
         skillbridge_verified_at = EXCLUDED.skillbridge_verified_at,
         skillbridge_notes = EXCLUDED.skillbridge_notes,
         source_kind = EXCLUDED.source_kind,
         source_url = EXCLUDED.source_url,
         source_retrieved_on = EXCLUDED.source_retrieved_on,
         updated_at = now()`,
      [
        employer.slug,
        employer.display_name,
        employer.parent_company,
        employer.employer_type,
        employer.defense_employer_slug,
        employer.website_url,
        employer.notes,
        employer.skillbridge_status,
        employer.skillbridge_participation_type,
        employer.skillbridge_pathways,
        employer.skillbridge_remote_available,
        employer.skillbridge_nationwide,
        employer.skillbridge_target_domains,
        employer.skillbridge_duration_days_min,
        employer.skillbridge_duration_days_max,
        employer.skillbridge_mou_expiration,
        employer.skillbridge_source_url,
        employer.skillbridge_verified_at,
        employer.skillbridge_notes,
        employer.source_kind,
        employer.source_url,
        employer.source_retrieved_on,
      ]
    );
  }

  for (const skill of catalog.skills) {
    await sql.query(
      `INSERT INTO transition_skills
         (slug, title, skill_kind, summary, listing_keywords,
          source_kind, source_url, source_retrieved_on)
       VALUES ($1, $2, $3, $4, $5::text[], $6, $7, $8)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         skill_kind = EXCLUDED.skill_kind,
         summary = EXCLUDED.summary,
         listing_keywords = EXCLUDED.listing_keywords,
         source_kind = EXCLUDED.source_kind,
         source_url = EXCLUDED.source_url,
         source_retrieved_on = EXCLUDED.source_retrieved_on,
         updated_at = now()`,
      [
        skill.slug,
        skill.title,
        skill.skill_kind,
        skill.summary,
        skill.listing_keywords,
        skill.source_kind,
        skill.source_url,
        skill.source_retrieved_on,
      ]
    );
  }

  const dbSpecialties = (await sql.query(
    `SELECT id, branch, code FROM military_specialties`
  )) as { id: string; branch: string; code: string }[];
  const specialtyIds = new Map(
    dbSpecialties.map((row) => [
      normalizeSpecialtyKey(row.branch as never, row.code),
      Number(row.id),
    ])
  );
  const dbRoles = (await sql.query(`SELECT id, slug FROM civilian_transition_roles`)) as {
    id: string;
    slug: string;
  }[];
  const roleIds = new Map(dbRoles.map((row) => [row.slug, Number(row.id)]));
  const dbEmployers = (await sql.query(`SELECT id, slug FROM transition_employers`)) as {
    id: string;
    slug: string;
  }[];
  const employerIds = new Map(dbEmployers.map((row) => [row.slug, Number(row.id)]));
  const dbSkills = (await sql.query(`SELECT id, slug FROM transition_skills`)) as {
    id: string;
    slug: string;
  }[];
  const skillIds = new Map(dbSkills.map((row) => [row.slug, Number(row.id)]));

  for (const specialtyMatch of catalog.matches) {
    const specialtyId = specialtyIds.get(
      normalizeSpecialtyKey(specialtyMatch.specialty.branch, specialtyMatch.specialty.code)
    );
    if (!specialtyId) throw new Error(`Missing inserted specialty ${specialtyMatch.specialty.code}`);

    for (const match of specialtyMatch.roles) {
      const roleId = roleIds.get(match.role.slug);
      if (!roleId) throw new Error(`Missing inserted role ${match.role.slug}`);
      await sql.query(
        `INSERT INTO specialty_role_matches
           (specialty_id, role_id, fit_score, directness, rationale,
            source_kind, source_url, source_retrieved_on)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (specialty_id, role_id) DO UPDATE SET
           fit_score = EXCLUDED.fit_score,
           directness = EXCLUDED.directness,
           rationale = EXCLUDED.rationale,
           source_kind = EXCLUDED.source_kind,
           source_url = EXCLUDED.source_url,
           source_retrieved_on = EXCLUDED.source_retrieved_on,
           updated_at = now()`,
        [
          specialtyId,
          roleId,
          match.fit_score,
          match.directness,
          match.rationale,
          match.source_kind,
          match.source_url,
          match.source_retrieved_on,
        ]
      );
    }

    for (const match of specialtyMatch.employers) {
      const employerId = employerIds.get(match.employer.slug);
      if (!employerId) throw new Error(`Missing inserted employer ${match.employer.slug}`);
      await sql.query(
        `INSERT INTO specialty_employer_matches
           (specialty_id, employer_id, fit_score, directness, platform_tags,
            requires_ap, values_ap, requires_clearance, values_clearance,
            requires_faa, requires_fcc, snapshot_date, rationale,
            source_kind, source_url, source_retrieved_on)
         VALUES ($1, $2, $3, $4, $5::text[], $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (specialty_id, employer_id) DO UPDATE SET
           fit_score = EXCLUDED.fit_score,
           directness = EXCLUDED.directness,
           platform_tags = EXCLUDED.platform_tags,
           requires_ap = EXCLUDED.requires_ap,
           values_ap = EXCLUDED.values_ap,
           requires_clearance = EXCLUDED.requires_clearance,
           values_clearance = EXCLUDED.values_clearance,
           requires_faa = EXCLUDED.requires_faa,
           requires_fcc = EXCLUDED.requires_fcc,
           snapshot_date = EXCLUDED.snapshot_date,
           rationale = EXCLUDED.rationale,
           source_kind = EXCLUDED.source_kind,
           source_url = EXCLUDED.source_url,
           source_retrieved_on = EXCLUDED.source_retrieved_on,
           updated_at = now()`,
        [
          specialtyId,
          employerId,
          match.fit_score,
          match.directness,
          match.platform_tags,
          match.requires_ap,
          match.values_ap,
          match.requires_clearance,
          match.values_clearance,
          match.requires_faa,
          match.requires_fcc,
          match.snapshot_date,
          match.rationale,
          match.source_kind,
          match.source_url,
          match.source_retrieved_on,
        ]
      );
    }

    for (const match of specialtyMatch.skills) {
      const skillId = skillIds.get(match.skill.slug);
      if (!skillId) throw new Error(`Missing inserted skill ${match.skill.slug}`);
      await sql.query(
        `INSERT INTO specialty_skill_matches
           (specialty_id, skill_id, fit_score, directness, rationale,
            source_kind, source_url, source_retrieved_on)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (specialty_id, skill_id) DO UPDATE SET
           fit_score = EXCLUDED.fit_score,
           directness = EXCLUDED.directness,
           rationale = EXCLUDED.rationale,
           source_kind = EXCLUDED.source_kind,
           source_url = EXCLUDED.source_url,
           source_retrieved_on = EXCLUDED.source_retrieved_on,
           updated_at = now()`,
        [
          specialtyId,
          skillId,
          match.fit_score,
          match.directness,
          match.rationale,
          match.source_kind,
          match.source_url,
          match.source_retrieved_on,
        ]
      );
    }
  }

  console.log("Import complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
