import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Gas Prices Map — VetRetire",
  description:
    "An interactive state-level map of average regular gas prices, based on AAA, EIA, and GasBuddy state averages.",
};

export default function GasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="gas" />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
