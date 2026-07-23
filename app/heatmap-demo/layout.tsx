import type { Metadata } from "next"

import PublicNav from "@/components/PublicNav"

import "../styles/shadcn.css"

export const metadata: Metadata = {
  title: "Heatmap Table Demo - VetRetire",
  description: "An interactive heatmap-table component demo.",
}

export default function HeatmapDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  )
}
