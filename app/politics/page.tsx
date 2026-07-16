import PoliticsClient from "@/components/politics/PoliticsClient";
import { STATE_POLITICS_DATASET } from "@/lib/state-politics-data";

export default function PoliticsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Political Lean Map</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Compare each state on a 2026 conservatism index built from partisan
          voting, state-government control, and ideology signals. Hover a state
          for its score, rank, and tier; click to pin it.
        </p>
      </header>
      <PoliticsClient dataset={STATE_POLITICS_DATASET} />
    </div>
  );
}
