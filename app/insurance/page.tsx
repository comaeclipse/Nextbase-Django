import InsuranceClient from "@/components/insurance/InsuranceClient";

export default function InsurancePage() {
  return <div className="space-y-6"><header className="space-y-1"><h1 className="text-2xl font-bold tracking-tight">Insurance Cost Map</h1><p className="max-w-2xl text-sm text-muted-foreground">Compare standardized 2026 homeowners and car-insurance benchmarks by state. Hover a state for its cost index and click to pin its annual and monthly estimate.</p></header><InsuranceClient /></div>;
}
