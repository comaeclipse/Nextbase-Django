import type { PaceGeography, PacePlaceCentroid } from "./types";

const GEOCODER_ADDRESS =
  "https://geocoding.geo.census.gov/geocoder/geographies/address";
const GEOCODER_COORDS =
  "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";

interface CensusGeographies {
  "Census Tracts"?: Array<{ GEOID?: string; BASENAME?: string }>;
  "Incorporated Places"?: Array<{
    GEOID?: string;
    NAME?: string;
    BASENAME?: string;
  }>;
  "Census Designated Places"?: Array<{
    GEOID?: string;
    NAME?: string;
    BASENAME?: string;
  }>;
  "Metropolitan Statistical Areas/Micropolitan Statistical Areas"?: Array<{
    GEOID?: string;
    NAME?: string;
  }>;
}

interface CensusAddressMatch {
  matchedAddress?: string;
  geographies?: CensusGeographies;
}

interface CensusResponse {
  result?: {
    addressMatches?: CensusAddressMatch[];
    geographies?: CensusGeographies;
  };
}

async function fetchJson(url: string): Promise<CensusResponse | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as CensusResponse;
}

function geographiesFrom(
  body: CensusResponse | null
): { match: CensusAddressMatch | null; geographies: CensusGeographies | null } {
  if (!body?.result) return { match: null, geographies: null };
  const match = body.result.addressMatches?.[0] ?? null;
  const geographies = match?.geographies ?? body.result.geographies ?? null;
  return { match, geographies };
}

function toPace(
  geographies: CensusGeographies,
  matchedName: string | null
): PaceGeography {
  const cbsaList =
    geographies["Metropolitan Statistical Areas/Micropolitan Statistical Areas"] ??
    [];
  const cbsaGeoid = cbsaList[0]?.GEOID ? String(cbsaList[0].GEOID) : null;

  const place =
    geographies["Incorporated Places"]?.[0] ??
    geographies["Census Designated Places"]?.[0] ??
    null;
  const placeGeoid = place?.GEOID ? String(place.GEOID) : null;

  const tractGeoids = (geographies["Census Tracts"] ?? [])
    .map((t) => (t.GEOID ? String(t.GEOID) : null))
    .filter((x): x is string => !!x);

  return {
    scope: cbsaGeoid ? "cbsa" : "place",
    cbsaGeoid,
    placeGeoid,
    tractGeoids,
    censusVintage: "Current_Current",
    matchedName,
  };
}

function usable(geographies: CensusGeographies | null): boolean {
  if (!geographies) return false;
  return !!(
    geographies["Census Tracts"]?.length ||
    geographies["Incorporated Places"]?.length ||
    geographies["Census Designated Places"]?.length
  );
}

const STREET_GUESSES = [
  "1 Main St",
  "100 Main Street",
  "1 Market St",
  "City Hall",
];

export function placeCentroidKey(name: string, state: string): string {
  return `${name.trim().toLowerCase()}|${state.trim().toUpperCase()}`;
}

/**
 * Resolve a curated city/state to Census tract / place / CBSA.
 * Tries common street patterns, then the place gazetteer centroid + coordinates API.
 */
export async function resolvePaceGeography(
  name: string,
  state: string,
  centroids?: Record<string, PacePlaceCentroid> | null
): Promise<PaceGeography | null> {
  const common = {
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json",
  };

  // Prefer the Census place gazetteer centroid — street guesses like "1 Main St"
  // can match the wrong city when several share a name pattern.
  const centroid = centroids?.[placeCentroidKey(name, state)];
  if (centroid) {
    const params = new URLSearchParams({
      ...common,
      x: String(centroid.lon),
      y: String(centroid.lat),
    });
    const body = await fetchJson(`${GEOCODER_COORDS}?${params.toString()}`);
    const { geographies } = geographiesFrom(body);
    if (usable(geographies)) {
      const pace = toPace(geographies!, `${centroid.name}, ${centroid.state}`);
      pace.placeGeoid = centroid.geoid;
      return pace;
    }
  }

  for (const street of STREET_GUESSES) {
    const params = new URLSearchParams({
      ...common,
      street,
      city: name,
      state,
    });
    const body = await fetchJson(`${GEOCODER_ADDRESS}?${params.toString()}`);
    const { match, geographies } = geographiesFrom(body);
    if (usable(geographies)) {
      return toPace(
        geographies!,
        match?.matchedAddress ?? `${name}, ${state}`
      );
    }
  }

  return null;
}

/**
 * Enrich geography with a CBSA code looked up from the derived tract index
 * when the geocoder omitted the MSA layer (common).
 */
export function applyCbsaFromTract(
  geography: PaceGeography,
  tractCbsa: string | null | undefined
): PaceGeography {
  if (geography.cbsaGeoid || !tractCbsa) return geography;
  const cbsaGeoid = tractCbsa.replace(/\D/g, "").padStart(5, "0").slice(-5);
  return {
    ...geography,
    cbsaGeoid,
    scope: "cbsa",
  };
}
