import CrittersClient from "@/components/critters/CrittersClient";

/*
 * /critters — per-critter density choropleth.
 *
 * Datasets live in lib/critters.ts (CRITTER_DATASETS); the combobox on the page
 * switches between them. Mosquito is real, sourced data; add more critters by
 * pushing datasets onto that registry.
 */
export default function CrittersPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Critter Density Map</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Pick a critter and see how heavily it presses on each state. Hover a
          state for its index, rank, and risk band; click to pin it.
        </p>
      </header>
      <CrittersClient />
    </div>
  );
}
