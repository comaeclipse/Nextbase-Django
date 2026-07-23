"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type HeatmapRow = {
  label: string
  values: number[]
}

export type HeatmapTableProps = React.ComponentProps<"section"> & {
  /** Labels rendered across the top of the heatmap. */
  columns: string[]
  /** Each row must provide one value for every column. */
  data: HeatmapRow[]
  description?: string
  title?: string
  valueLabel?: string
}

function formatValue(value: number) {
  return new Intl.NumberFormat().format(value)
}

function HeatmapTable({
  className,
  columns,
  data,
  description = "Hover over cells to see detailed information",
  title = "Weekly Traffic Pattern",
  valueLabel = "visitors",
  ...props
}: HeatmapTableProps) {
  const [hoveredCell, setHoveredCell] = React.useState<{
    column: string
    row: string
    value: number
  } | null>(null)

  const values = data.flatMap((row) => row.values)
  const max = Math.max(...values, 0)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const columnTotals = columns.map((_, index) =>
    data.reduce((sum, row) => sum + (row.values[index] ?? 0), 0)
  )
  const grandTotal = columnTotals.reduce((sum, value) => sum + value, 0)

  return (
    <section
      className={cn("w-full rounded-xl border bg-card p-5 text-card-foreground shadow-sm", className)}
      {...props}
    >
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground" aria-label={`Heatmap scale: ${min} to ${max}`}>
          <span>{formatValue(min)}</span>
          <div className="flex h-3 overflow-hidden rounded-sm" aria-hidden="true">
            {[16, 32, 48, 64, 80, 100].map((lightness) => (
              <span
                className="h-3 w-5"
                key={lightness}
                style={{ backgroundColor: `hsl(217 91% ${100 - lightness * 0.48}%)` }}
              />
            ))}
          </div>
          <span>{formatValue(max)}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] border-separate border-spacing-0 text-center text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th scope="col" className="px-2 pb-3 text-left font-medium">Time</th>
              {columns.map((column) => (
                <th className="px-1 pb-3 font-medium" key={column} scope="col">{column}</th>
              ))}
              <th className="px-2 pb-3 font-medium" scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const total = row.values.reduce((sum, value) => sum + value, 0)

              return (
                <tr key={row.label}>
                  <th className="whitespace-nowrap px-2 py-2 text-left font-medium text-muted-foreground" scope="row">{row.label}</th>
                  {columns.map((column, index) => {
                    const value = row.values[index] ?? 0
                    const intensity = (value - min) / range
                    const backgroundColor = `hsl(217 91% ${96 - intensity * 48}%)`
                    const darkCell = intensity > 0.56

                    return (
                      <td className="p-0.5" key={column}>
                        <button
                          aria-label={`${row.label}, ${column}: ${formatValue(value)} ${valueLabel}`}
                          className={cn(
                            "block w-full rounded-sm px-2 py-2 font-mono text-xs tabular-nums transition-transform hover:scale-105 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            darkCell ? "text-white" : "text-slate-800"
                          )}
                          onBlur={() => setHoveredCell(null)}
                          onFocus={() => setHoveredCell({ row: row.label, column, value })}
                          onMouseEnter={() => setHoveredCell({ row: row.label, column, value })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={{ backgroundColor }}
                          type="button"
                        >
                          {formatValue(value)}
                        </button>
                      </td>
                    )
                  })}
                  <td className="px-2 py-2 font-mono text-xs font-semibold tabular-nums">{formatValue(total)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-muted/40">
            <tr>
              <th className="rounded-l-md px-2 py-2 text-left font-semibold" scope="row">Total</th>
              {columnTotals.map((total, index) => (
                <td className="px-1 py-2 font-mono text-xs font-semibold tabular-nums" key={columns[index]}>{formatValue(total)}</td>
              ))}
              <td className="rounded-r-md px-2 py-2 font-mono text-xs font-semibold tabular-nums">{formatValue(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p aria-live="polite" className="mt-5 min-h-5 text-xs text-muted-foreground">
        {hoveredCell
          ? `${hoveredCell.row}, ${hoveredCell.column}: ${formatValue(hoveredCell.value)} ${valueLabel}`
          : "Hover or focus a cell to see detailed information"}
      </p>
    </section>
  )
}

const weeklyTrafficColumns = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const weeklyTrafficData: HeatmapRow[] = [
  { label: "12 AM", values: [2, 1, 3, 2, 1, 8, 12] },
  { label: "3 AM", values: [1, 0, 1, 1, 0, 4, 6] },
  { label: "6 AM", values: [15, 18, 14, 16, 12, 8, 5] },
  { label: "9 AM", values: [45, 52, 48, 55, 42, 25, 18] },
  { label: "12 PM", values: [62, 58, 65, 60, 55, 42, 35] },
  { label: "3 PM", values: [58, 55, 52, 58, 48, 38, 32] },
  { label: "6 PM", values: [35, 32, 38, 34, 28, 45, 48] },
  { label: "9 PM", values: [22, 18, 24, 20, 15, 52, 55] },
]

function WeeklyTrafficHeatmap(props: Omit<HeatmapTableProps, "columns" | "data">) {
  return <HeatmapTable columns={weeklyTrafficColumns} data={weeklyTrafficData} {...props} />
}

export { HeatmapTable, WeeklyTrafficHeatmap, weeklyTrafficColumns, weeklyTrafficData }
