"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  COMFORT_COST_SHARE,
  estimateMonthlyCost,
  incomeTargets,
  quickCheck,
  type CostEstimate,
  type Household,
  type IncomeTargets,
  type QuickCheck,
  type QuickVerdict,
  type Tenure,
} from "@/lib/affordability";
import { resolveCostConstants } from "@/lib/cost-constants";
import {
  AFFORDABILITY_DISCLAIMER,
  HOUSEHOLD_OPTIONS,
  TENURE_OPTIONS,
  affordabilityVintage,
  formatUsd,
  parseMonthlyAmount,
  quickVerdictCopy,
  quickVerdictLabel,
  wildestDreamsLine,
} from "@/lib/affordability-scenario";
import type { LocationRow } from "@/lib/types";

/**
 * Standalone /affordability quick check (issue #108, Phase 4).
 *
 * One after-tax number ranks every candidate city at the SAME pinned baseline
 * the city card's quick tab and /explore use — the modest basket with Medicare
 * plus supplement — so a city reads identically on all three surfaces. The
 * numbers and verdict copy come entirely from lib/affordability + the scenario
 * copy helpers; this component only lays them out. The detailed income-mix
 * model deliberately stays on the city card (linked per row), keeping this page
 * a fast first filter rather than a second calculator.
 */

const CUSHION_TARGET_PCT = Math.round((1 - COMFORT_COST_SHARE) * 100);

/** Verdict → emoji + theme-aware badge classes, five bands per the spec. */
const VERDICT_STYLE: Record<QuickVerdict, { emoji: string; badge: string }> = {
  comfortable: {
    emoji: "🟢",
    badge:
      "bg-green-500/10 text-green-700 dark:text-green-400 ring-green-600/20",
  },
  in_the_ballpark: {
    emoji: "🟡",
    badge:
      "bg-amber-400/15 text-amber-700 dark:text-amber-300 ring-amber-600/20",
  },
  very_tight: {
    emoji: "🟠",
    badge:
      "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-600/20",
  },
  probably_too_expensive: {
    emoji: "🟠",
    badge:
      "bg-orange-600/15 text-orange-800 dark:text-orange-300 ring-orange-700/20",
  },
  way_out_of_range: {
    emoji: "🔴",
    badge: "bg-red-500/10 text-red-700 dark:text-red-400 ring-red-600/20",
  },
};

/** Best-first display order for the five verdicts (used to build summaries). */
const VERDICT_ORDER: QuickVerdict[] = [
  "comfortable",
  "in_the_ballpark",
  "very_tight",
  "probably_too_expensive",
  "way_out_of_range",
];

type Priced = {
  location: LocationRow;
  estimate: CostEstimate | null;
  targets: IncomeTargets | null;
  check: QuickCheck | null;
};

function VerdictBadge({ verdict }: { verdict: QuickVerdict }) {
  const style = VERDICT_STYLE[verdict];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}
    >
      <span aria-hidden="true">{style.emoji}</span>
      {quickVerdictLabel(verdict)}
    </span>
  );
}

export default function AffordabilityExplorer({
  locations,
}: {
  locations: LocationRow[];
}) {
  const [income, setIncome] = useState("");
  const [household, setHousehold] = useState<Household>("single");
  const [tenure, setTenure] = useState<Tenure>("rent");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const incomeParsed = parseMonthlyAmount(income);
  const hasIncome = incomeParsed > 0;

  // Price every city once for the current household + tenure, then attach a
  // quick-check verdict when a take-home number is present. All pure functions
  // over the resolved cost constants — no DB, no tax model (quick mode takes a
  // number that is already after-tax).
  const priced = useMemo<Priced[]>(() => {
    const cost = resolveCostConstants();
    if (!cost.ok) {
      return locations.map((location) => ({
        location,
        estimate: null,
        targets: null,
        check: null,
      }));
    }
    return locations.map((location) => {
      const estimate = estimateMonthlyCost(location, tenure, cost.constants, {
        spendingProfile: "modest",
        healthCoverage: "medicare_supplement",
        household,
      });
      return {
        location,
        estimate,
        targets: incomeTargets(estimate),
        check: hasIncome ? quickCheck(estimate, incomeParsed) : null,
      };
    });
  }, [locations, tenure, household, hasIncome, incomeParsed]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q
      ? priced.filter(
          (row) =>
            row.location.name.toLowerCase().includes(q) ||
            row.location.state.toLowerCase().includes(q)
        )
      : priced;
    // Sorting: with a take-home number, best coverage first (unpriceable
    // last). Without one, cheapest comfortable target first — "which cities
    // take the least take-home to live comfortably?".
    return [...rows].sort((a, b) => {
      if (hasIncome) {
        const av = a.check?.coverage ?? -Infinity;
        const bv = b.check?.coverage ?? -Infinity;
        return bv - av;
      }
      const at = a.targets?.comfortable ?? Infinity;
      const bt = b.targets?.comfortable ?? Infinity;
      return at - bt;
    });
  }, [priced, search, hasIncome]);

  // Verdict tally for the summary strip, only meaningful once income is set.
  const tally = useMemo(() => {
    const counts = new Map<QuickVerdict, number>();
    for (const row of filtered) {
      if (row.check) {
        counts.set(row.check.verdict, (counts.get(row.check.verdict) ?? 0) + 1);
      }
    }
    return counts;
  }, [filtered]);

  const pricedCount = filtered.filter((r) => r.check).length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="grid gap-1">
            <Label htmlFor="aff-income" className="text-xs">
              Monthly take-home income
            </Label>
            <Input
              id="aff-income"
              inputMode="decimal"
              placeholder="e.g. 3,000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              aria-describedby="aff-income-hint"
            />
            <p id="aff-income-hint" className="text-[11px] text-muted-foreground">
              After taxes — any mix of wages, retired pay, VA disability, or
              Social Security counts the same here.
            </p>
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Household
            </span>
            <ToggleGroup
              value={[household]}
              onValueChange={(values: string[]) =>
                setHousehold((values[0] as Household) ?? "single")
              }
              variant="outline"
              spacing={0}
              aria-label="Household"
              className="grid grid-cols-2"
            >
              {HOUSEHOLD_OPTIONS.map((option) => (
                <ToggleGroupItem key={option.id} value={option.id}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Housing
            </span>
            <ToggleGroup
              value={[tenure]}
              onValueChange={(values: string[]) =>
                setTenure((values[0] as Tenure) ?? "rent")
              }
              variant="outline"
              spacing={0}
              aria-label="Housing tenure"
              className="grid grid-cols-3"
            >
              {TENURE_OPTIONS.map((option) => (
                <ToggleGroupItem key={option.id} value={option.id} className="px-2">
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
          Quick check uses one standardized baseline — a modest budget and
          Medicare with supplement. Open a city to fine-tune spending, coverage,
          cushion, or your exact income mix.
        </p>
      </section>

      {/* Summary strip */}
      {hasIncome ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            Across {pricedCount} priced {pricedCount === 1 ? "city" : "cities"}:
          </span>
          {VERDICT_ORDER.filter((v) => (tally.get(v) ?? 0) > 0).map((v) => (
            <span key={v} className="inline-flex items-center gap-1">
              <VerdictBadge verdict={v} />
              <span className="tabular-nums text-muted-foreground">
                {tally.get(v)}
              </span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Enter a take-home number above to see where each city lands. Until
          then, cities are ranked by the take-home income it takes to live
          comfortably here — cheapest first.
        </p>
      )}

      {/* Search */}
      <div className="grid gap-1">
        <Label htmlFor="aff-search" className="sr-only">
          Filter cities
        </Label>
        <Input
          id="aff-search"
          placeholder="Filter by city or state…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Results */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">City</th>
              <th className="px-3 py-2 text-right font-medium">
                Est. monthly cost
              </th>
              {hasIncome ? (
                <>
                  <th className="px-3 py-2 font-medium">Verdict</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Remaining / short
                  </th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2 text-right font-medium">
                    Break-even take-home
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Comfortable take-home
                  </th>
                </>
              )}
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const priceable = row.estimate?.monthlyCost != null;
              const isOpen = expandedId === row.location.id;
              return (
                <FragmentRow
                  key={row.location.id}
                  row={row}
                  hasIncome={hasIncome}
                  priceable={priceable}
                  isOpen={isOpen}
                  onToggle={() =>
                    setExpandedId(isOpen ? null : row.location.id)
                  }
                />
              );
            })}
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  No cities match “{search}”.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] leading-snug text-muted-foreground">
        {AFFORDABILITY_DISCLAIMER} {affordabilityVintage()}
      </p>
    </div>
  );
}

function FragmentRow({
  row,
  hasIncome,
  priceable,
  isOpen,
  onToggle,
}: {
  row: Priced;
  hasIncome: boolean;
  priceable: boolean;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { location, estimate, targets, check } = row;
  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/30">
        <td className="px-3 py-2">
          <div className="font-medium">{location.name}</div>
          <div className="text-xs text-muted-foreground">{location.state}</div>
        </td>
        <td className="px-3 py-2 text-right tabular-nums">
          {priceable ? `${formatUsd(estimate?.monthlyCost)}/mo` : "—"}
        </td>
        {hasIncome ? (
          <>
            <td className="px-3 py-2">
              {check ? (
                <VerdictBadge verdict={check.verdict} />
              ) : (
                <span className="text-xs text-muted-foreground">
                  Not enough data
                </span>
              )}
            </td>
            <td
              className={`px-3 py-2 text-right tabular-nums ${
                check && check.remaining < 0
                  ? "text-red-700 dark:text-red-400"
                  : ""
              }`}
            >
              {check
                ? `${check.remaining >= 0 ? "+" : "−"}${formatUsd(
                    Math.abs(check.remaining)
                  )}/mo`
                : "—"}
            </td>
          </>
        ) : (
          <>
            <td className="px-3 py-2 text-right tabular-nums">
              {targets ? `${formatUsd(targets.breakEven)}/mo` : "—"}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {targets ? `${formatUsd(targets.comfortable)}/mo` : "—"}
            </td>
          </>
        )}
        <td className="px-3 py-2 text-right">
          {priceable ? (
            <button
              type="button"
              onClick={onToggle}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              aria-expanded={isOpen}
            >
              {isOpen ? "Hide" : "Details"}
            </button>
          ) : null}
        </td>
      </tr>
      {isOpen && priceable ? (
        <tr className="border-b bg-muted/20 last:border-0">
          <td colSpan={5} className="px-3 py-4">
            <DetailPanel row={row} hasIncome={hasIncome} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function DetailPanel({ row, hasIncome }: { row: Priced; hasIncome: boolean }) {
  const { location, estimate, targets, check } = row;

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="space-y-2">
        {hasIncome && check ? (
          <>
            <p className="text-sm">{quickVerdictCopy(check.verdict)}</p>
            {wildestDreamsLine(check) ? (
              <p className="text-sm italic text-muted-foreground">
                {wildestDreamsLine(check)}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {check.verdict === "comfortable"
                ? `You're at or past our comfortable benchmark for ${location.name}.`
                : check.remaining >= 0
                  ? `You're about ${formatUsd(check.toComfortable)}/month away from our comfortable range.`
                  : `Estimated costs here are about ${formatUsd(-check.remaining)}/month higher than your current take-home.`}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {formatUsd(targets?.breakEven)}/mo take-home covers estimated costs
            here; {formatUsd(targets?.comfortable)}/mo clears them with the{" "}
            {CUSHION_TARGET_PCT}% comfort cushion.
          </p>
        )}

        {estimate && estimate.approximations.length > 0 ? (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Approximated</span> —
            a national stand-in was used for:{" "}
            {estimate.approximations.join("; ")}.
          </div>
        ) : null}
        {estimate && estimate.missingContext.length > 0 ? (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Not modeled</span> —
            these do not change the verdict: {estimate.missingContext.join("; ")}
            .
          </div>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:min-w-[16rem]">
        <dt className="text-muted-foreground">Estimated costs</dt>
        <dd className="text-right tabular-nums">
          {formatUsd(estimate?.monthlyCost)}/mo
        </dd>
        <dt className="text-muted-foreground">Comfortable target</dt>
        <dd className="text-right tabular-nums">
          {formatUsd(targets?.comfortable)}/mo
        </dd>
        {hasIncome && check ? (
          <>
            <dt className="text-muted-foreground">
              {check.remaining >= 0 ? "Money remaining" : "Estimated shortfall"}
            </dt>
            <dd className="text-right tabular-nums">
              {formatUsd(Math.abs(check.remaining))}/mo
            </dd>
            {check.remaining >= 0 ? (
              <>
                <dt className="text-muted-foreground">Estimated cushion</dt>
                <dd className="text-right tabular-nums">
                  {Math.round(check.cushion * 100)}%{" "}
                  <span className="text-muted-foreground">
                    (target {CUSHION_TARGET_PCT}%)
                  </span>
                </dd>
              </>
            ) : null}
          </>
        ) : null}
        <dd className="col-span-2 pt-1 text-right">
          <Link
            href={`/city/${location.id}`}
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            Fine-tune on the city page →
          </Link>
        </dd>
      </dl>
    </div>
  );
}
