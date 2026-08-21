import { cookies } from "next/headers";
import {
  getActiveEmployers,
  getAllLocations,
  getAllStateInfo,
  getEmployerIndex,
  getMilitaryProximityIndex,
} from "@/lib/locations";
import { PROFILE_COOKIE_NAME, decodePreferences } from "@/lib/profile";
import { calculateBaselineScore } from "@/lib/scoring";
import { computeStateCounts } from "@/lib/filters";
import type { Location } from "@/lib/types";
import ExploreClient from "@/components/ExploreClient";

// Always read fresh from the database (parity with the Django view).
export const dynamic = "force-dynamic";

// Ported from locations/templates/locations/explore.html + views.explore.
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ state_filter?: string | string[] }>;
}) {
  const [
    rows,
    stateInfos,
    employers,
    employerIndex,
    militaryIndex,
    params,
    cookieStore,
  ] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    getActiveEmployers(),
    getEmployerIndex(),
    getMilitaryProximityIndex(),
    searchParams,
    cookies(),
  ]);

  // Saved dealbreakers from /profile. Decoded here so the grid is already
  // personalized on first paint rather than flashing the unfiltered list.
  const preferences = decodePreferences(
    cookieStore.get(PROFILE_COOKIE_NAME)?.value
  );
  const locations: Location[] = rows.map((r) => ({
    ...r,
    calculated_match_score: calculateBaselineScore(r),
  }));
  // Sort: best fit desc, then name asc (code-point order, matching Python).
  locations.sort((a, b) => {
    if (b.calculated_match_score !== a.calculated_match_score) {
      return b.calculated_match_score - a.calculated_match_score;
    }
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });

  const stateCounts = computeStateCounts(rows);

  // `?state_filter=PA` deep-links with that state selected. Only states we
  // actually have locations for are honored, so a junk value falls back to the
  // unfiltered grid rather than rendering an empty page.
  const requested = Array.isArray(params.state_filter)
    ? params.state_filter[0]
    : params.state_filter;
  const normalized = requested?.trim().toUpperCase();
  const initialStateFilter =
    normalized && normalized in stateCounts ? normalized : null;

  return (
    <ExploreClient
      initialLocations={locations}
      stateInfos={stateInfos}
      stateCounts={stateCounts}
      initialStateFilter={initialStateFilter}
      employers={employers}
      employerIndex={employerIndex}
      militaryIndex={militaryIndex}
      preferences={preferences}
    />
  );
}
