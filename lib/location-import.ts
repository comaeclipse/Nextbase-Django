export interface ImportParent {
  id: number; name: string; state: string; geo_type: string; relationship: string;
}

/** The CSV importer may refresh a geography, not change its kind or approve it. */
export function assertLocationImportTransition(
  data: Record<string, unknown>,
  existing?: { geo_type: string; is_candidate: boolean },
): void {
  if (data.geo_type !== undefined && data.geo_type !== "city" && data.is_candidate !== false) {
    throw new Error("Non-city CSV imports must explicitly remain non-candidates");
  }
  if (!existing) return;
  if (data.geo_type !== existing.geo_type) throw new Error("CSV import cannot change an existing geography type");
  if (existing.geo_type !== "city" && existing.is_candidate !== data.is_candidate) {
    throw new Error("CSV import cannot promote or demote an existing non-city candidate");
  }
}

/** One statement makes the child, employer INSERT trigger, and edge atomic. */
export function buildLocationUpsert(data: Record<string, unknown>, parent: ImportParent | null, source: string) {
  assertLocationImportTransition(data);
  const values: Record<string, unknown> = { ...data, ...(parent ? { parent_geo_id: parent.id } : {}) };
  const columns = Object.keys(values);
  if (columns.some((column) => !/^[a-z_][a-z0-9_]*$/.test(column))) throw new Error("Invalid import column");
  const params: unknown[] = columns.map((column) => column === "tags" ? JSON.stringify(values[column]) : values[column]);
  const slots = columns.map((column, i) => `$${i + 1}${column === "tags" ? "::jsonb" : ""}`);
  const add = (value: unknown) => { params.push(value); return `$${params.length}`; };
  const parentId = parent ? add(parent.id) : null;
  const parentType = parent ? add(parent.geo_type) : null;
  const relationship = parent ? add(parent.relationship) : null;
  const sourceSlot = parent ? add(source) : null;
  const parentName = parent ? add(parent.name) : null;
  const parentState = parent ? add(parent.state) : null;
  return {
    params,
    text: `WITH saved AS (
      INSERT INTO locations_location (${columns.join(", ")}, created_at, updated_at)
      SELECT ${slots.join(", ")}, now(), now()
      ${parent ? `FROM locations_location parent WHERE parent.id = ${parentId} AND parent.geo_type = ${parentType} AND parent.name = ${parentName} AND parent.state = ${parentState}` : ""}
      ON CONFLICT (slug) DO UPDATE SET ${columns.map((c) => `${c} = EXCLUDED.${c}`).join(", ")}, updated_at = now()
      ${data.geo_type !== undefined ? `WHERE locations_location.geo_type = EXCLUDED.geo_type
        AND (locations_location.geo_type = 'city' OR locations_location.is_candidate = EXCLUDED.is_candidate)` : ""}
      RETURNING id, (xmax = 0) AS created
    )${parent ? `, edge AS (
      INSERT INTO geo_relationships (parent_geo_id, child_geo_id, relationship_type, source)
      SELECT ${parentId}, id, ${relationship}, ${sourceSlot} FROM saved
      ON CONFLICT (parent_geo_id, child_geo_id, relationship_type, valid_from)
      DO UPDATE SET source = EXCLUDED.source, valid_to = NULL
      RETURNING id
    )` : ""}
    SELECT id, created FROM saved`,
  };
}
