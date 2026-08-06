import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Gun Freedom Map - VetRetire",
  description: "A provisional 50-state Gun Freedom Index, current through July 28, 2026.",
};

export default function GunFreedomLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground"><PublicNav active="gun-freedom" /><main className="mx-auto max-w-6xl px-4 py-8">{children}</main></div>;
}
