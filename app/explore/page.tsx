import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { getAllLocations, getAllStateInfo } from "@/lib/locations";
import { calculateBaselineScore } from "@/lib/scoring";
import { computeStateCounts } from "@/lib/filters";
import { QUIZ_COOKIE_NAME, decodeQuizProfile } from "@/lib/quiz";
import type { Location } from "@/lib/types";
import ExploreClient from "@/components/ExploreClient";
import "../styles/explore.css";

export const metadata: Metadata = {
  title: "Explore Retirement Locations - VetRetire",
};

// Always read fresh from the database (parity with the Django view).
export const dynamic = "force-dynamic";

// Ported from locations/templates/locations/explore.html + views.explore.
export default async function ExplorePage() {
  const [rows, stateInfos, cookieStore] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    cookies(),
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
  // A quiz profile (if any) pre-fills filters + reranks by personalized
  // weights client-side — see components/ExploreClient.tsx.
  const initialProfile = decodeQuizProfile(
    cookieStore.get(QUIZ_COOKIE_NAME)?.value
  );

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
              <Link href="/quiz">Take the Quiz</Link>
            </li>
          </ul>
        </div>
      </nav>

      <ExploreClient
        initialLocations={locations}
        stateInfos={stateInfos}
        stateCounts={stateCounts}
        initialProfile={initialProfile}
      />
    </>
  );
}
