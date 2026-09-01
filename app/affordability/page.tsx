import AffordabilityExplorer from "@/components/affordability/AffordabilityExplorer";
import { getAllLocations } from "@/lib/locations";

export const dynamic = "force-dynamic";

export default async function AffordabilityPage() {
  const locations = await getAllLocations();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Affordability Quick Check
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Given what you bring home each month, is a place realistically in
          your price range? Enter one after-tax number and every city is ranked
          against the same standardized 65+ cost baseline — a first filter, not
          a full budget. Open any city to fine-tune the details.
        </p>
      </header>
      <AffordabilityExplorer locations={locations} />
    </div>
  );
}
