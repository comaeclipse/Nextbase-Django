import type { Metadata } from "next";
import PublicNav from "@/components/PublicNav";
import "../styles/shadcn.css";

export const metadata: Metadata = {
  title: "Defense Jobs — VetRetire",
  description:
    "Defense-industry job openings by broad sector and employer, mapped across the US.",
};

export default function DefenseJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav active="defense-jobs" />
      {/* 1312 = 1280 content column + the 16px px-4 gutters on each side, so the
          inner `.space-y-6` measures exactly 1280px wide on desktop. */}
      <main className="mx-auto max-w-[1312px] px-4 py-8">{children}</main>
    </div>
  );
}
