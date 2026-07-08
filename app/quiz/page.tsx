import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAllLocations, getAllStateInfo } from "@/lib/locations";
import { calculateBaselineScore } from "@/lib/scoring";
import { QUIZ_COOKIE_NAME, decodeQuizProfile } from "@/lib/quiz";
import type { Location } from "@/lib/types";
import QuizClient from "@/components/quiz/QuizClient";

export const metadata: Metadata = {
  title: "Take the Quiz - VetRetire",
};

// Always read fresh from the database, matching /explore's data freshness.
export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const [rows, stateInfos, cookieStore] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    cookies(),
  ]);
  const locations: Location[] = rows.map((r) => ({
    ...r,
    calculated_match_score: calculateBaselineScore(r),
  }));

  const initialProfile = decodeQuizProfile(
    cookieStore.get(QUIZ_COOKIE_NAME)?.value
  );

  return (
    <QuizClient
      initialLocations={locations}
      stateInfos={stateInfos}
      initialProfile={initialProfile}
    />
  );
}
