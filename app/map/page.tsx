import type { Metadata } from "next";
import LocationsMapExperience from "@/components/LocationsMapExperience";
import PublicNav from "@/components/PublicNav";
import coordinates from "@/data/location-map-coordinates.json";
import { getAllLocations } from "@/lib/locations";
import "../styles/map.css";

export const metadata: Metadata = {
  title: "Retirement Location Map - VetRetire",
  description: "Explore VetRetire locations on an interactive United States map.",
};

export const dynamic = "force-dynamic";

type Coordinate = (typeof coordinates.coordinates)[number];

function coordinateKey(name: string, state: string) {
  return `${name.trim().toLowerCase()}|${state.trim().toUpperCase()}`;
}

export default async function MapPage() {
  const rows = await getAllLocations();
  const coordinatesByLocation = new Map<string, Coordinate>(
    coordinates.coordinates.map((point) => [coordinateKey(point.name, point.state), point])
  );

  const locations = rows.flatMap((location) => {
    const point = coordinatesByLocation.get(coordinateKey(location.name, location.state));
    if (!point) return [];
    return [
      {
        id: location.id,
        name: location.name,
        state: location.state,
        latitude: point.latitude,
        longitude: point.longitude,
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
