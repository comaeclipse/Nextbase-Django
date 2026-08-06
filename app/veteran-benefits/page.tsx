import VeteranBenefitsClient from "@/components/veteran-benefits/VeteranBenefitsClient";
import { VETERAN_BENEFITS_DATA } from "@/lib/state-veteran-benefits";

export default function VeteranBenefitsPage() {
  return <div className="space-y-6"><header className="space-y-2"><BadgeLine /><h1 className="text-3xl font-bold tracking-tight text-blue-950">Best states for veteran benefits</h1><p className="max-w-3xl text-sm leading-6 text-muted-foreground">Compare the supplied definitive 2026 state-benefits ranking. Texas leads the overall model, while the best fit changes with disability rating, retirement, and dependent education needs.</p></header><VeteranBenefitsClient data={VETERAN_BENEFITS_DATA} /></div>;
}

function BadgeLine() { return <p className="text-xs font-semibold tracking-[0.14em] text-blue-700 uppercase">2026 state benefits index</p>; }
