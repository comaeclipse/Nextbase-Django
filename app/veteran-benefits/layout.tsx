import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = { title: "Veteran Benefits by State | VetRetire", description: "Compare the supplied 2026 ranking of state-created veteran benefits." };

export default function VeteranBenefitsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground"><PublicNav active="veteran-benefits" /><main className="mx-auto max-w-6xl px-4 py-8">{children}</main></div>;
}
