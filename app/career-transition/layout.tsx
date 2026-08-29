import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Career Transition - VetRetire",
  description:
    "Match enlisted military specialties to civilian roles, credentials, employers, and location signals.",
};

export default function CareerTransitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="career-transition" />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
