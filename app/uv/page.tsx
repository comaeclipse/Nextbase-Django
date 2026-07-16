import UvClient from "@/components/uv/UvClient";
import { getStateWeatherIndex } from "@/lib/state-weather";

export const dynamic = "force-dynamic";

export default async function UvPage() {
  const dataset = await getStateWeatherIndex("uv");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">UV Exposure Map</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Compare state-level UV exposure from long-term satellite and climate
          climatology. Hover a state for its index, rank, and exposure band;
          click to pin it.
        </p>
      </header>
      <UvClient dataset={dataset} />
    </div>
  );
}
