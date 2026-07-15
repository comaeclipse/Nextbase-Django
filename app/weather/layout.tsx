import type { Metadata } from "next";
import Link from "next/link";
import "../styles/shadcn.css";

/*
 * Scoped shadcn/Tailwind layout for the /weather demo, mirroring the quiz
 * pattern: shadcn.css is imported only here, never globally, so Tailwind's
 * Preflight reset never reaches the pixel-parity public pages.
 */
export const metadata: Metadata = {
  title: "Weather — VetRetire",
  description:
    "Explore each retirement location's climate — temperature, precipitation, sunshine, and humidity — plus its overall weather vibe.",
};

export default function WeatherLayout({
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
              <Link href="/weather" aria-current="page" className="text-foreground">
                Weather
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
