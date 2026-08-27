/** Invalidated source rows remain in the audit trail but cannot be replayed. */
export function isUnresolvedGeographyRow(row: Record<string, string | undefined>): boolean {
  const status = row.GeoResolutionStatus?.trim();
  if (!status || status === "resolved") return false;
  if (status !== "unresolved") throw new Error(`Unknown GeoResolutionStatus: ${status}`);
  if (row.IsCandidate !== "No" || !row.GeoResolutionNote?.trim()) throw new Error("Unresolved geography requires IsCandidate=No and GeoResolutionNote");
  if (["County", "Latitude", "Longitude", "BoundaryGeoid", "BoundarySource"].some((field) => row[field]?.trim())) throw new Error("Unresolved geography must not carry rejected geographic values");
  return true;
}

export function isUnresolvedMetroRow(row: Record<string, string | undefined>): boolean {
  if (row.GeoResolutionStatus === "unresolved") {
    if (row.CbsaGeoid?.trim() || !row.GeoResolutionNote?.trim()) throw new Error("Unresolved metro mapping must be blank and explained");
    return true;
  }
  if (row.GeoResolutionStatus && row.GeoResolutionStatus !== "resolved") throw new Error("Unknown metro resolution status");
  if (!/^\d{5}$/.test(row.CbsaGeoid ?? "")) throw new Error("Resolved metro mapping requires a five-digit CBSA");
  return false;
}
