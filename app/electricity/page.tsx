import ElectricityClient from "@/components/electricity/ElectricityClient";

export default function ElectricityPage() {
  return <div className="space-y-6"><header className="space-y-1"><h1 className="text-2xl font-bold tracking-tight">Electricity Cost Map</h1><p className="max-w-2xl text-sm text-muted-foreground">Compare 2026 year-to-date residential electricity prices across all 50 states.</p></header><ElectricityClient /></div>;
}
