import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../../../styles/shadcn.css";

export const metadata: Metadata = {
  title: "City Climate Dashboard — VetRetire",
  description: "Detailed city climate, weather, and moisture normals.",
};

export default function CityClimateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      <PublicNav active="weather" />
      <main className="mx-auto max-w-[1400px] space-y-3 p-3 sm:p-4">
        {children}
      </main>
    </div>
  );
}
