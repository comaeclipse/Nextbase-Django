import type { Metadata } from "next";
import Link from "next/link";
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
      <nav className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            VetRetire
          </Link>
          <ul className="flex items-center gap-5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link href="/explore" className="hover:text-foreground">
                Explore
              </Link>
            </li>
            <li>
              <Link href="/critters" aria-current="page" className="text-foreground">
                Critters
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
