import AirQualityClient from "@/components/air-quality/AirQualityClient";
import { STATE_AIR_QUALITY_DATASET } from "@/lib/state-air-quality";

export default function AirQualityPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Air Quality & Smoke Map</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Compare annual AQI burden with the historical recurrence and intensity
          of wildfire smoke. Hover a state for its data and click to pin it.
        </p>
      </header>
      <AirQualityClient dataset={STATE_AIR_QUALITY_DATASET} />
    </div>
  );
}
