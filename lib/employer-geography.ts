/** Identity evidence is separate from proximity and containment. */
const NOISE = new Set([
  "city", "town", "township", "charter", "village", "borough", "county", "subdivision",
  "the", "of", "and", "base", "station", "afb", "sfb", "fort", "ft", "saint",
  "st", "air", "force", "joint", "naval", "marine", "corps", "army", "camp",
]);
function normalized(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").replace(/['’ʻʼ]/g, "").toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
export function nameTokens(value: string): string[] {
  return normalized(value).split(" ").filter((token) => token && !NOISE.has(token));
}
/** Admission of elaborations, NOT an exact-identity test. */
export function nameAgrees(requested: string, returned: string | null): boolean {
  if (!returned) return false;
  const wanted = nameTokens(requested);
  const actual = nameTokens(returned);
  // An elaboration may add a suffix, but "New Bedford" is not "Bedford".
  return wanted.length > 0 && wanted.every((token, index) => actual[index] === token);
}
export function exactPlaceName(requested: string, returned: string): boolean {
  const canonical = (s: string) => normalized(s)
    .replace(/ (?:charter township|county subdivision|township|city|town|village|borough|cdp)$/, "");
  return canonical(requested) === canonical(returned);
}
export interface InstallationPoint {
  command_name: string; state: string; latitude: number; longitude: number;
}
/** No all-state/shared-token fallback. Require exact distinctive identity. */
export function findInstallation<T extends InstallationPoint>(city: string, state: string, installations: T[]): T | null {
  if (!/\b(fort|ft|afb|sfb|afs|nas|mcas|mcb|base|station|camp)\b/i.test(city)) return null;
  const key = (name: string) => nameTokens(name).sort().join(" ");
  const wanted = key(city);
  if (!wanted) return null;
  const matches = installations.filter((i) => {
    const states: string[] = i.state.toUpperCase().match(/\b[A-Z]{2}\b/g) ?? [];
    return states.includes(state.trim().toUpperCase()) && key(i.command_name) === wanted;
  });
  return matches.length === 1 ? matches[0] : null;
}
export type PlaceLookup =
  | { status: "ok"; name: string; geoid: string | null; sourceUrl: string }
  | { status: "unavailable"; reason: string; sourceUrl: string };
export interface GeographyAuditRow {
  id: number; slug: string; name: string; state: string; latitude: number; longitude: number;
}
export interface GeographyPoint { name: string; state: string; lat: number; lon: number }
export interface GeographyFinding {
  row: GeographyAuditRow; crossStateSuspect: boolean; lookup: PlaceLookup;
  status: "agrees" | "review" | "unavailable"; exactNamesakeMiles: number | null;
}
export function milesBetween(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = (d: number) => d * Math.PI / 180;
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLon - aLon) / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function assessGeography(row: GeographyAuditRow, lookup: PlaceLookup, points: GeographyPoint[]): GeographyFinding {
  const distances = points.map((point) => ({ point, miles: milesBetween(row.latitude, row.longitude, point.lat, point.lon) }));
  const same = distances.filter(({ point }) => point.state.toUpperCase() === row.state.toUpperCase());
  const nearest = distances.reduce<(typeof distances)[number] | null>((best, next) => !best || next.miles < best.miles ? next : best, null);
  const crossStateSuspect = !!nearest && nearest.point.state.toUpperCase() !== row.state.toUpperCase() && Math.min(...same.map((p) => p.miles)) > 25;
  const exact = same.filter(({ point }) => exactPlaceName(row.name, point.name));
  return {
    row, lookup, crossStateSuspect,
    status: lookup.status === "unavailable" ? "unavailable" : crossStateSuspect || !nameAgrees(row.name, lookup.name) ? "review" : "agrees",
    exactNamesakeMiles: exact.length ? Math.min(...exact.map((p) => p.miles)) : null,
  };
}
export function formatGeographyAudit(findings: GeographyFinding[], snapshot: string): string {
  const unchecked = findings.filter((f) => f.status === "unavailable").length;
  return [
    `Geography audit ${snapshot}: ${findings.length} rows, ${findings.length - unchecked} checked, ${unchecked} unchecked`,
    `Cross-state suspects: ${findings.filter((f) => f.crossStateSuspect).length}; name/geography review: ${findings.filter((f) => f.status === "review").length}`,
    "Report only. No geography is cleared automatically; apply a sourced, reviewed patch.",
    ...findings.filter((f) => f.status !== "agrees" || f.crossStateSuspect).map((f) => {
      const evidence = f.lookup.status === "ok"
        ? `returned ${f.lookup.name} (${f.lookup.geoid ?? "no GEOID"}); exact same-state namesake: ${f.exactNamesakeMiles === null ? "unavailable" : `${f.exactNamesakeMiles.toFixed(1)} mi`}`
        : f.lookup.reason;
      return `[${f.status}${f.crossStateSuspect ? "; cross-state suspect" : ""}] ${f.row.slug} (#${f.row.id}): ${evidence}\n  ${f.lookup.sourceUrl}`;
    }),
    unchecked ? "INCOMPLETE: unchecked rows are not clean results." : "Lookup coverage complete; review findings still require adjudication.",
  ].join("\n");
}
export async function lookupCensusPlace(lat: number, lon: number, fetcher = fetch): Promise<PlaceLookup> {
  const q = new URLSearchParams({ benchmark: "Public_AR_Current", vintage: "Current_Current", format: "json", x: String(lon), y: String(lat) });
  const sourceUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${q}`;
  let reason = "No response";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher(sourceUrl, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        reason = `Census HTTP ${response.status}`;
        if (response.status < 500 && response.status !== 429) break;
        continue;
      }
      const body = await response.json() as { result?: { geographies?: Record<string, { NAME?: string; BASENAME?: string; GEOID?: string }[]> } };
      const g = body.result?.geographies;
      const layer = g?.["Incorporated Places"]?.[0] ?? g?.["Census Designated Places"]?.[0] ?? g?.["County Subdivisions"]?.[0];
      const name = layer?.BASENAME ?? layer?.NAME;
      if (name) return { status: "ok", name, geoid: layer?.GEOID ?? null, sourceUrl };
      return { status: "unavailable", reason: "No named Census place or subdivision returned", sourceUrl };
    } catch (error) { reason = error instanceof Error ? error.message : String(error); }
  }
  return { status: "unavailable", reason, sourceUrl };
}
