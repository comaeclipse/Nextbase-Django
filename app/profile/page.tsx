import { cookies } from "next/headers";
import { getAllLocations, getAllStateInfo } from "@/lib/locations";
import { PROFILE_COOKIE_NAME, decodePreferences } from "@/lib/profile";
import { getCareerTransitionCatalog } from "@/lib/career-transition";
import { listingsForSpecialty, type SpecialtyListings } from "@/lib/career-listings-bridge";
import { toProfilePickerCatalog } from "@/lib/career-transition-shared";
import ProfileClient from "@/components/profile/ProfileClient";

// The live impact strip counts real rows, so read fresh like /explore does.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [locations, stateInfos, cookieStore, catalog] = await Promise.all([
    getAllLocations(),
    getAllStateInfo(),
    cookies(),
    getCareerTransitionCatalog(),
  ]);

  // Decoded on the server so the form's first paint already reflects the saved
  // profile — never read the cookie in a useEffect, that hydrates wrong.
  const initialPreferences = decodePreferences(
    cookieStore.get(PROFILE_COOKIE_NAME)?.value
  );

  // The job-listing teaser reflects the SAVED profile only, never an
  // in-progress client edit (there is none server-side). "Not set" and "not
  // in the catalog" both resolve to no teaser — the bridge's own honest
  // no_hits/unmapped status still renders for a saved, catalogued specialty
  // with no live openings.
  const savedMatch =
    initialPreferences?.militaryBranch && initialPreferences.militarySpecialtyCode
      ? (catalog.matches.find(
          (m) =>
            m.specialty.branch === initialPreferences.militaryBranch &&
            m.specialty.code === initialPreferences.militarySpecialtyCode
        ) ?? null)
      : null;

  // The teaser is decorative, not core to the page — a transient DB error
  // here must never fail the whole /profile load for a visitor who saved a
  // specialty (getCareerTransitionCatalog softens its own errors the same way).
  let initialListingsTeaser: SpecialtyListings | null = null;
  if (savedMatch) {
    try {
      const result = await listingsForSpecialty(savedMatch);
      initialListingsTeaser = { ...result, listings: result.listings.slice(0, 3) };
    } catch (err) {
      console.error("Failed to load job-listing teaser for /profile:", err);
    }
  }

  return (
    <ProfileClient
      locations={locations}
      stateInfos={stateInfos}
      initialPreferences={initialPreferences}
      pickerCatalog={toProfilePickerCatalog(catalog)}
      initialListingsTeaser={initialListingsTeaser}
    />
  );
}
