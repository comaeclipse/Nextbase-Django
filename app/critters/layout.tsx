import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

/*
 * Scoped shadcn/Tailwind layout for /critters, mirroring the /weather + /quiz
 * pattern: shadcn.css is imported only here, never globally, so Tailwind's
 * Preflight reset never leaks into the pixel-parity public pages.
 */
export const metadata: Metadata = {
  title: "Critter Density Map — VetRetire",
  description:
    "An interactive choropleth of nuisance-critter density across the United States.",
};

export default function CrittersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="critters" />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
