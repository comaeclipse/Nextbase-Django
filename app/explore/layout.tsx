import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Explore Locations — VetRetire",
  description:
    "Filter retirement locations by climate, budget, lifestyle, geography, and veteran benefits.",
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      <PublicNav active="explore" />
      {children}
    </div>
  );
}
