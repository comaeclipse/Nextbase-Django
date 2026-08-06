import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Air Quality & Smoke Map - VetRetire",
  description:
    "State-level annual AQI burden and historical wildfire-smoke exposure summaries.",
};

export default function AirQualityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="air-quality" />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
