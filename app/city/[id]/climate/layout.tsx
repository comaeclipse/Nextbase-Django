import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../../../styles/shadcn.css";

export const metadata: Metadata = {
  title: "City Climate Dashboard — VetRetire",
  description: "Detailed city climate, weather, moisture, and air-quality data.",
};

export default function CityClimateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="weather" />
      <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
