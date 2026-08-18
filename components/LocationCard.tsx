"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hospital } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Location } from "@/lib/types";
import type { LocationBudget, Tenure } from "@/lib/affordability";
import {
  bandLabel,
  formatUsd,
  healthCoverageLabel,
  profileLabel,
  tenureLabel,
} from "@/lib/affordability-scenario";

function bandClass(band: LocationBudget["band"]): string {
  if (band === "comfortable") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (band === "tight") return "border-amber-200 bg-amber-50 text-amber-800";
  if (band === "over") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-border bg-muted text-muted-foreground";
}

export default function LocationCard({
  location,
  budget = null,
  tenure = "own_outright",
}: {
  location: Location;
  budget?: LocationBudget | null;
  tenure?: Tenure;
}) {
  const router = useRouter();
  const href = `/city/${location.id}`;
  const missing = [
    ...new Set([
      ...(budget?.cost.missing ?? []),
      ...(budget?.income.missing ?? []),
    ]),
  ];
  const approximations = [
    ...new Set([
      ...(budget?.cost.approximations ?? []),
      ...(budget?.income.approximations ?? []),
    ]),
  ];
  const missingContext = budget?.cost.missingContext ?? [];

  return (
    <article
      onClick={() => router.push(href)}
      className="group cursor-pointer overflow-hidden rounded-2xl border bg-background shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="relative grid aspect-[16/10] place-items-center text-5xl"
        style={{ background: location.gradient ?? undefined }}
      >
        <span aria-hidden>{location.emoji}</span>
        {location.featured ? (
          <Badge className="absolute left-3 top-3 rounded-full">Featured</Badge>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{location.name}</h2>
            <p className="text-sm text-muted-foreground">{location.state}</p>
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 rounded-full font-medium"
          >
            {location.calculated_match_score ?? 0}% Fit
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {(
            [
              ["Avg. home price", location.avg_home_value_display || "—"],
              ["Climate", location.climate || "—"],
              ["Cost of living", location.cost_of_living],
              ["Population", location.population || "—"],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </dt>
              <dd className="truncate text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {budget ? (
          <div className="space-y-1.5 rounded-xl border bg-muted/30 p-3">
            <div className="flex items-start justify-between gap-2">
              <Badge
                variant="outline"
                className={`rounded-full font-medium ${bandClass(budget.band)}`}
              >
                {bandLabel(budget.band)}
              </Badge>
              {budget.headroom !== null ? (
                <p className="text-sm font-semibold">
                  {budget.headroom >= 0
                    ? `${formatUsd(budget.headroom)} left`
                    : `${formatUsd(Math.abs(budget.headroom))} over`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not priced</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Est. {formatUsd(budget.cost.monthlyCost)}/mo
              {budget.income
                ? ` · take-home ${formatUsd(budget.income.netMonthly)}`
                : ""}
              {` · ${profileLabel(budget.cost.spendingProfile)} · ${tenureLabel(tenure)}`}
              {budget.cost.healthCoverage === "va_primary"
                ? ` · ${healthCoverageLabel(budget.cost.healthCoverage)}`
                : ""}
            </p>
            {missing.length > 0 ? (
              <p className="text-[11px] text-amber-800">
                Missing: {missing.join("; ")}
              </p>
            ) : approximations.length > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Approximated: {approximations.join("; ")}
              </p>
            ) : missingContext.length > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Not modeled: {missingContext.join("; ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {location.tags && location.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {location.tags.map((tag, i) => (
              <Badge key={i} variant="outline" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Hospital className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              VA:{" "}
              {location.has_va
                ? "Yes"
                : location.distance_to_va
                  ? `Nearest is ${location.distance_to_va} away`
                  : "Distance unknown"}
            </span>
          </p>
          <Link
            href={href}
            prefetch={false}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Learn More →
          </Link>
        </div>
      </div>
    </article>
  );
}
