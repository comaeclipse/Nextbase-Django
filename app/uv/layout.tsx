import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "UV Exposure Map — VetRetire",
  description:
    "An interactive state-level map of UV exposure based on NASA, EPA, and NOAA climatology.",
};

export default function UvLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="uv" />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
