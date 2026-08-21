import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
// Scoped shadcn/Tailwind opt-in. Imported here and never from the root layout,
// so Preflight's reset can't reach the pixel-parity pages (/, /map, /city/[id]).
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Your Profile — VetRetire",
  description:
    "Save the state-level dealbreakers that rule a place out, and we'll apply them everywhere you search.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      <PublicNav active="profile" />
      {children}
    </div>
  );
}
