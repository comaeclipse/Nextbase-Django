import GunFreedomClient from "@/components/gun-freedom/GunFreedomClient";
import { STATE_GUN_FREEDOM_DATASET } from "@/lib/state-gun-freedom";

export default function GunFreedomPage() {
  return <div className="space-y-6"><header className="space-y-1"><h1 className="text-2xl font-bold tracking-tight">Gun Freedom Map</h1><p className="max-w-3xl text-sm text-muted-foreground">Compare the provisional state Gun Freedom Index. Hover for a score and rank, or click a state for its policy summary and legal-status flag.</p></header><GunFreedomClient dataset={STATE_GUN_FREEDOM_DATASET} /></div>;
}
