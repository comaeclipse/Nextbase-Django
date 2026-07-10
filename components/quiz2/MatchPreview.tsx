"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { Location } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/** Live top-N panel. Re-renders on every slider tick, so it stays lightweight. */
export default function MatchPreview({
  matches,
  totalResults,
  activeFilters,
}: {
  matches: Location[];
  totalResults: number;
  activeFilters: string[];
}) {
  return (
    <Card className="shadow-lg shadow-slate-900/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          Your top matches
        </CardTitle>
        <CardDescription aria-live="polite">
          {totalResults === 0
            ? "No locations clear your filters."
            : `${totalResults} location${totalResults === 1 ? "" : "s"} match — showing the best ${matches.length}.`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {activeFilters.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {activeFilters.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
            <Separator />
          </>
        )}

        {matches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loosen a deal-breaker or widen your climate picks to see results.
          </p>
        ) : (
          <ol className="quiz2-card-scroll flex list-none flex-col gap-2 p-0">
            {matches.map((loc, index) => (
              <li key={loc.id}>
                <Link
                  href={`/city/${loc.id}`}
                  prefetch={false}
                  className="group flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-muted/50"
                >
                  <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg"
                    style={{ background: loc.gradient }}
                    aria-hidden="true"
                  >
                    {loc.emoji}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{loc.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {loc.state} · {loc.avg_home_value_display || "—"} ·{" "}
                      {loc.cost_of_living} cost
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                    {loc.calculated_match_score}%
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        <Link
          href="/explore"
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Browse every location
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
