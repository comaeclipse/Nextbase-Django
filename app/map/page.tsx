import type { Metadata } from "next";
import LocationsMapExperience from "@/components/LocationsMapExperience";
import PublicNav from "@/components/PublicNav";
import { getAllLocations } from "@/lib/locations";
import "../styles/map.css";

export const metadata: Metadata = {
  title: "Retirement Location Map - VetRetire",
  description: "Explore VetRetire locations on an interactive United States map.",
};

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const rows = await getAllLocations();

  const locations = rows.flatMap((location) => {
    if (location.latitude == null || location.longitude == null) return [];
    return [
      {
        id: location.id,
        name: location.name,
        state: location.state,
        latitude: location.latitude,
        longitude: location.longitude,
        pace: location.pace_category,
        climate: location.climate,
        costOfLiving: location.cost_of_living,
        homeValue: location.avg_home_value_display,
        defenseHub: location.defense_hub,
      },
    ];
  });

  return (
    <>
      <PublicNav active="map" />

      <main className="map-page">
        <section className="map-hero">
          <p className="map-eyebrow">EXPLORE BY PLACE</p>
          <h1>See every retirement location at a glance.</h1>
          <p>
            Pick a marker to preview a city, then open its complete retirement guide.
          </p>
        </section>

        <section className="map-shell" aria-label="VetRetire location map">
          <LocationsMapExperience locations={locations} />
        </section>
      </main>
    </>
  );
}
