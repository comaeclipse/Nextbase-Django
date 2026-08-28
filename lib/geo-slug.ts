/*
 * The one place a geography slug is computed in TypeScript.
 *
 * This must stay byte-identical to SLUG_EXPR in
 * scripts/migrate-geo-hierarchy.ts, which backfilled every existing row:
 *
 *   lower(state) || '-' ||
 *   regexp_replace(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
 *                  '(^-|-$)', '', 'g')
 *
 * A drift between the two would let the importer miss an existing row and
 * insert a duplicate under a near-identical slug, which the UNIQUE constraint
 * would then reject with a confusing error rather than an explanation.
 * geoSlugMatchesSqlExpression() in the test suite pins them together.
 */

/** lower-kebab, punctuation collapsed, no leading or trailing separator. */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * A place's stable external key.
 *
 * A top-level place is "<state>-<name>" (ca-los-angeles). A contained place is
 * "<parent slug>-<name>" (ca-los-angeles-canoga-park), because "<state>-<name>"
 * is not unique below city level -- "Downtown, CA" exists many times over, and
 * a slug that collides is a silent overwrite waiting to happen.
 */
export function geoSlug(
  name: string,
  state: string,
  parentSlug?: string | null
): string {
  const tail = slugifyName(name);
  return parentSlug ? `${parentSlug}-${tail}` : `${state.toLowerCase()}-${tail}`;
}
