import AirQualityClient from "@/components/air-quality/AirQualityClient";
import { STATE_AIR_QUALITY_DATASET } from "@/lib/state-air-quality";

export default function AirQualityPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Air Quality Map</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Compare state-level AQI burden from EPA annual county summaries. Hover
          a state for its index, rank, and supporting AQI metrics; click to pin it.
        </p>
      </header>
      <AirQualityClient dataset={STATE_AIR_QUALITY_DATASET} />
    </div>
  );
}
