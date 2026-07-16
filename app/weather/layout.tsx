import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
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
      <PublicNav active="weather" />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
