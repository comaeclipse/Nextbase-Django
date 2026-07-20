import GasClient from "@/components/gas/GasClient";
import { getGasPrices } from "@/lib/gas-prices";

export const dynamic = "force-dynamic";

export default async function GasPage() {
  const dataset = await getGasPrices();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Gas Prices Map</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Compare average regular gas prices across the states. Hover a state
          for its per-gallon price, rank, and price band; click to pin it.
        </p>
      </header>
      <GasClient dataset={dataset} />
    </div>
  );
}
