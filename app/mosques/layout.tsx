import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

/*
 * Scoped shadcn/Tailwind layout for /mosques, mirroring /critters + /weather:
 * shadcn.css is imported only here, never globally, so Tailwind's Preflight
 * reset never leaks into the pixel-parity public pages.
 */
export const metadata: Metadata = {
  title: "Mosque Map — VetRetire",
  description: "Find a mosque near your next retirement city, sourced from OpenStreetMap.",
};

export default function MosquesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="mosques" />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
