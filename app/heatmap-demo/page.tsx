import { WeeklyTrafficHeatmap } from "@/components/ui/heatmap-table"

export default function HeatmapDemoPage() {
  return (
    <div className="space-y-8">
      <header className="max-w-2xl space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Component demo</p>
        <h1 className="text-3xl font-bold tracking-tight">Weekly traffic heatmap</h1>
        <p className="text-muted-foreground">
          A reusable table that makes hourly patterns immediately scannable. Hover or tab to a cell for its exact value.
        </p>
      </header>
      <WeeklyTrafficHeatmap />
    </div>
  )
}
