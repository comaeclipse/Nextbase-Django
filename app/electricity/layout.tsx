import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = { title: "Electricity Cost Map — VetRetire", description: "Compare 2026 year-to-date residential electricity prices across the 50 states." };

export default function ElectricityLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground"><PublicNav active="electricity" /><main className="mx-auto max-w-6xl px-4 py-8">{children}</main></div>;
}
