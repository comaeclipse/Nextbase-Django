import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getAllLocations, getAllStateInfo } from "@/lib/locations";
import { QUIZ2_COOKIE_NAME, decodeQuiz2Profile } from "@/lib/quiz2";
import Quiz2Client from "@/components/quiz2/Quiz2Client";

export const metadata: Metadata = {
  title: "Personalize your Fit - VetRetire",
};

// Always read fresh from the database, matching /quiz and /explore.
export const dynamic = "force-dynamic";

export default async function Quiz2Page() {
  const [locations, stateInfos, cookieStore] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    cookies(),
  ]);

  // Decoded on the server so the sliders' first paint already reflects the saved
  // profile — never read the cookie in a useEffect, that hydrates wrong.
  const initialProfile = decodeQuiz2Profile(
    cookieStore.get(QUIZ2_COOKIE_NAME)?.value
  );

  return (
    <Quiz2Client
      locations={locations}
      stateInfos={stateInfos}
      initialProfile={initialProfile}
    />
  );
}
