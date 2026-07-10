import type { Metadata } from "next";
import { getAllLocations, getAllStateInfo } from "@/lib/locations";
import Quiz2Client from "@/components/quiz2/Quiz2Client";

export const metadata: Metadata = {
  title: "Profile Studio (Demo) - VetRetire",
};

// Always read fresh from the database, matching /quiz and /explore.
export const dynamic = "force-dynamic";

export default async function Quiz2Page() {
  const [locations, stateInfos] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
  ]);

  return <Quiz2Client locations={locations} stateInfos={stateInfos} />;
}
