import type { Metadata } from "next";
import Link from "next/link";
import {
  getActiveEmployers,
  getAllLocations,
  getAllStateInfo,
  getEmployerIndex,
} from "@/lib/locations";
import { calculateBaselineScore } from "@/lib/scoring";
import { computeStateCounts } from "@/lib/filters";
import type { Location } from "@/lib/types";
import ExploreClient from "@/components/ExploreClient";
import "../styles/explore.css";

export const metadata: Metadata = {
  title: "Explore Retirement Locations - VetRetire",
};

// Always read fresh from the database (parity with the Django view).
export const dynamic = "force-dynamic";

// Ported from locations/templates/locations/explore.html + views.explore.
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ state_filter?: string | string[] }>;
}) {
  const [rows, stateInfos, employers, employerIndex, params] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    getActiveEmployers(),
    getEmployerIndex(),
    searchParams,
  ]);
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

  // `?state_filter=PA` deep-links to the map with that state selected. Only
  // states we actually have locations for are honored, so a junk value falls
  // back to the unfiltered grid rather than rendering an empty page.
  const requested = Array.isArray(params.state_filter)
    ? params.state_filter[0]
    : params.state_filter;
  const normalized = requested?.trim().toUpperCase();
  const initialStateFilter =
    normalized && normalized in stateCounts ? normalized : null;

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">VetRetire</div>
          <ul className="nav-links">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/explore" style={{ color: "#2563eb" }}>
                Explore
              </Link>
            </li>
            <li>
              <a href="#">Saved</a>
            </li>
            <li>
              <a href="#">Profile</a>
            </li>
          </ul>
        </div>
      </nav>

      <ExploreClient
        initialLocations={locations}
        stateInfos={stateInfos}
        stateCounts={stateCounts}
        initialStateFilter={initialStateFilter}
        employers={employers}
        employerIndex={employerIndex}
      />
    </>
  );
}
