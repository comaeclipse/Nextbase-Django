export const GEOGRAPHY_FIELDS = ["county", "latitude", "longitude", "boundary_geoid", "boundary_source"] as const;
export type GeographyFields = { county: string | null; latitude: number | null; longitude: number | null; boundary_geoid: string | null; boundary_source: string | null };
export interface GeographyPatch {
  slug: string; expected: GeographyFields; replacement: GeographyFields;
  expectedMetroSlugs: string[]; metroSlugs: string[]; sourceUrl: string; reason: string;
}
export interface SqlStatement { text: string; params: unknown[] }
export function validateGeographyPatches(input: unknown): GeographyPatch[] {
  if (!Array.isArray(input) || !input.length) throw new Error("A nonempty patch array is required");
  const slugs = new Set<string>();
  for (const patch of input) {
    if (!patch || typeof patch !== "object" || Object.keys(patch).some((k) => !["slug", "expected", "replacement", "expectedMetroSlugs", "metroSlugs", "sourceUrl", "reason"].includes(k))) throw new Error("Unknown patch field");
    if (typeof patch.slug !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(patch.slug) || slugs.has(patch.slug)) throw new Error("Invalid or duplicate patch slug");
    slugs.add(patch.slug);
    if (typeof patch.sourceUrl !== "string" || !/^https:\/\//.test(patch.sourceUrl) || typeof patch.reason !== "string" || !patch.reason.trim()) throw new Error("Source URL and reason required");
    for (const field of ["expected", "replacement"] as const) {
      const geo = patch[field];
      if (!geo || Object.keys(geo).length !== GEOGRAPHY_FIELDS.length || GEOGRAPHY_FIELDS.some((key) => !(key in geo))) throw new Error("Patch must specify only the five geography fields");
      for (const key of ["county", "boundary_geoid", "boundary_source"] as const) if (geo[key] !== null && typeof geo[key] !== "string") throw new Error(`Invalid ${key}`);
      for (const key of ["latitude", "longitude"] as const) if (geo[key] !== null && (typeof geo[key] !== "number" || !Number.isFinite(geo[key]) || Math.abs(geo[key]) > (key === "latitude" ? 90 : 180))) throw new Error(`Invalid ${key}`);
      if ((geo.latitude === null) !== (geo.longitude === null)) throw new Error("Both coordinates must be set or null");
    }
    for (const field of ["expectedMetroSlugs", "metroSlugs"] as const) {
      if (!Array.isArray(patch[field]) || patch[field].length > 1 || patch[field].some((s: unknown) => typeof s !== "string" || !/^cbsa-\d{5}$/.test(s))) throw new Error("Expected zero or one metro slug");
    }
    if (patch.replacement.latitude !== null && !patch.replacement.boundary_source) throw new Error("Resolved geography requires provenance");
  }
  return input as GeographyPatch[];
}
export const GEO_JSON_SQL = `jsonb_build_object(${GEOGRAPHY_FIELDS.map((key) => `'${key}', l.${key}`).join(", ")})`;
export const METROS_JSON_SQL = `COALESCE((SELECT jsonb_agg(p.slug ORDER BY p.slug) FROM geo_relationships r
  JOIN locations_location p ON p.id = r.parent_geo_id WHERE r.child_geo_id = l.id
  AND r.relationship_type = 'metro_membership' AND r.valid_to IS NULL), '[]'::jsonb)`;

/** Assertions execute inside the transaction; failure aborts every update. */
export function geographyPatchStatements(patches: GeographyPatch[]): SqlStatement[] {
  validateGeographyPatches(patches);
  const statements: SqlStatement[] = [{ text: "SELECT id FROM locations_location WHERE slug = ANY($1::text[]) ORDER BY id FOR UPDATE", params: [patches.map((p) => p.slug)] }];
  for (const p of patches) {
    statements.push({ text: `SELECT 1 / CASE WHEN count(*) = 1 AND bool_and(NOT l.is_candidate AND (
      (${GEO_JSON_SQL} = $2::jsonb AND ${METROS_JSON_SQL} = $3::jsonb) OR
      (${GEO_JSON_SQL} = $4::jsonb AND ${METROS_JSON_SQL} = $5::jsonb))) THEN 1 ELSE 0 END AS snapshot_matches
      FROM locations_location l WHERE l.slug = $1`,
      params: [p.slug, JSON.stringify(p.expected), JSON.stringify(p.expectedMetroSlugs), JSON.stringify(p.replacement), JSON.stringify(p.metroSlugs)] });
    statements.push({ text: "SELECT 1 / CASE WHEN count(*) = cardinality($1::text[]) THEN 1 ELSE 0 END AS metros_exist FROM locations_location WHERE slug = ANY($1::text[]) AND geo_type = 'metro'", params: [p.metroSlugs] });
  }
  for (const p of patches) {
    statements.push({ text: `UPDATE locations_location l SET ${GEOGRAPHY_FIELDS.map((key, i) => `${key} = $${i + 2}`).join(", ")}, updated_at = now()
      WHERE l.slug = $1 AND ${GEO_JSON_SQL} IS DISTINCT FROM $7::jsonb RETURNING id`,
      params: [p.slug, ...GEOGRAPHY_FIELDS.map((key) => p.replacement[key]), JSON.stringify(p.replacement)] });
    statements.push({ text: `UPDATE geo_relationships r SET valid_to = CURRENT_DATE
      WHERE child_geo_id = (SELECT id FROM locations_location WHERE slug = $1)
      AND relationship_type = 'metro_membership' AND valid_to IS NULL
      AND parent_geo_id NOT IN (SELECT id FROM locations_location WHERE slug = ANY($2::text[]))`, params: [p.slug, p.metroSlugs] });
    for (const metro of p.metroSlugs) statements.push({ text: `INSERT INTO geo_relationships (parent_geo_id, child_geo_id, relationship_type, source, source_url)
      SELECT p.id, c.id, 'metro_membership', $3, $4 FROM locations_location p CROSS JOIN locations_location c
      WHERE p.slug = $1 AND c.slug = $2 AND NOT EXISTS (SELECT 1 FROM geo_relationships r
        WHERE r.parent_geo_id = p.id AND r.child_geo_id = c.id AND r.relationship_type = 'metro_membership' AND r.valid_to IS NULL)
      ON CONFLICT (parent_geo_id, child_geo_id, relationship_type, valid_from)
      DO UPDATE SET valid_to = NULL, source = EXCLUDED.source, source_url = EXCLUDED.source_url`, params: [metro, p.slug, p.reason, p.sourceUrl] });
  }
  return statements;
}
