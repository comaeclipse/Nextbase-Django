import MosquesMap, { type MappedMosque } from "@/components/mosques/MosquesMap";
import { getAllMosques } from "@/lib/mosques";

export const dynamic = "force-dynamic";

/*
 * /mosques — standalone national map of US mosques, sourced from OpenStreetMap
 * (see SCHEMA.md "Mosques"). Independent of locations_location: not tied to a
 * curated retirement city, not a Fit-score factor.
 */
export default async function MosquesPage() {
  const rows = await getAllMosques();

  const mosques: MappedMosque[] = rows.flatMap((row) => {
    if (row.latitude == null || row.longitude == null) return [];
    return [
      {
        id: row.id,
        name: row.name,
        address: row.address,
        city: row.city,
        state: row.state,
        latitude: row.latitude,
        longitude: row.longitude,
        phone: row.phone,
        website: row.website,
        sourceUrl: row.source_url,
      },
    ];
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Mosque Map</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Find a mosque near where you&apos;re considering retiring. Click a marker for
          details, or a cluster to zoom in.
        </p>
      </header>
      <MosquesMap mosques={mosques} />
    </div>
  );
}
