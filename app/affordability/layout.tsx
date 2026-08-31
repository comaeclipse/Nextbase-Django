import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Affordability Quick Check — VetRetire",
  description:
    "Enter one after-tax number and see where each retirement city lands — from comfortable to way out of range — at a standardized 65+ cost baseline.",
};

export default function AffordabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="affordability" />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
