import { cookies } from "next/headers";
import { getAllLocations, getAllStateInfo } from "@/lib/locations";
import { PROFILE_COOKIE_NAME, decodePreferences } from "@/lib/profile";
import ProfileClient from "@/components/profile/ProfileClient";

// The live impact strip counts real rows, so read fresh like /explore does.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [locations, stateInfos, cookieStore] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    cookies(),
  ]);

  // Decoded on the server so the form's first paint already reflects the saved
  // profile — never read the cookie in a useEffect, that hydrates wrong.
  const initialPreferences = decodePreferences(
    cookieStore.get(PROFILE_COOKIE_NAME)?.value
  );

  return (
    <ProfileClient
      locations={locations}
      stateInfos={stateInfos}
      initialPreferences={initialPreferences}
    />
  );
}
