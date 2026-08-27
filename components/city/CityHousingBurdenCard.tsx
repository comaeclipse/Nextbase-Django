"use client";

/*
 * "What income buys a home here?" — the issue-#170 Phase C surface for the
 * housing-burden metric family. Gross-income, housing-only (the HUD 30%
 * rule): the natural frame for someone weighing a JOB in this city, which is
 * a different question from the retiree card's after-tax whole-cost picture
 * above it. Entry vs typical is the headline: the 25th-percentile home and
 * the ZHVI-typical home usually need very different salaries.
 */
import { useMemo, useState } from "react";
import type { Location } from "@/lib/types";
import { resolveCostConstants } from "@/lib/cost-constants";
import {
  burdenBand,
  burdenBandLabel,
  cityHousingBurden,
  requiredIncomeGross,
  type BurdenBand,
  type HomeBurden,
} from "@/lib/housing-burden";
import {
  AFFORDABILITY_DISCLAIMER,
  formatUsd,
  parseMonthlyAmount,
} from "@/lib/affordability-scenario";

function bandBadgeClass(band: BurdenBand): "good" | "warn" | "bad" {
  if (band === "very_affordable" || band === "affordable") return "good";
  if (band === "stretched") return "warn";
  return "bad";
}

function HomeRow({
  label,
  home,
  salaryAnnual,
}: {
  label: string;
  home: HomeBurden | null;
  salaryAnnual: number | undefined;
}) {
  if (!home) {
    return (
      <tr>
        <th scope="row">{label}</th>
        <td colSpan={salaryAnnual ? 4 : 3}>Not enough data</td>
      </tr>
    );
  }
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{formatUsd(home.homePrice)}</td>
      <td>{home.piti.total === null ? "—" : `${formatUsd(home.piti.total)}/mo`}</td>
      <td>
        {home.requiredIncome === null ? (
          "—"
        ) : (
          <strong>{formatUsd(home.requiredIncome)}/yr</strong>
        )}
      </td>
      {salaryAnnual ? (
        <td>
          {home.band !== null && home.burden !== null ? (
            <span className={`badge ${bandBadgeClass(home.band)}`}>
              {burdenBandLabel(home.band)} · {Math.round(home.burden * 100)}%
            </span>
          ) : (
            "—"
          )}
        </td>
      ) : null}
    </tr>
  );
}

export default function CityHousingBurdenCard({ location }: { location: Location }) {
  const [salary, setSalary] = useState("");
  const salaryParsed = parseMonthlyAmount(salary);
  const salaryAnnual = salaryParsed > 0 ? salaryParsed : undefined;

  const burden = useMemo(() => {
    const constants = resolveCostConstants();
    if (!constants.ok) return null;
    return cityHousingBurden(location, constants.constants, { salaryAnnual });
  }, [location, salaryAnnual]);

  const rents: [string, number][] = (
    [
      ["2-bedroom", location.median_rent_2br],
      ["3-bedroom", location.median_rent_3br],
    ] as [string, number | null | undefined][]
  ).filter((r): r is [string, number] => typeof r[1] === "number");

  // Nothing priceable at all: render nothing rather than an empty shell.
  if (!burden || (!burden.entry && !burden.median && rents.length === 0)) {
    return null;
  }

  const approximations = [
    ...new Set([
      ...(burden.entry?.piti.approximations ?? []),
      ...(burden.median?.piti.approximations ?? []),
    ]),
  ];

  return (
    <section className="card aff-card" aria-labelledby="hb-title">
      <div className="card-head">
        <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
        </svg>
        <h2 id="hb-title">What income buys a home here?</h2>
      </div>
      <div className="card-body">
        <p className="lede">
          Gross salary needed to keep housing at 30% of income — the lens for
          weighing a job offer in {location.name}. The entry-level home is the
          25th percentile of the local market, so one fixer-upper can never
          make it look cheap.
        </p>

        <table className="aff-targets">
          <thead>
            <tr>
              <th scope="col">Home</th>
              <th scope="col">Price</th>
              <th scope="col">Est. PITI</th>
              <th scope="col">Income needed</th>
              {salaryAnnual ? <th scope="col">At your salary</th> : null}
            </tr>
          </thead>
          <tbody>
            <HomeRow
              label="Entry-level (25th pct)"
              home={burden.entry}
              salaryAnnual={salaryAnnual}
            />
            <HomeRow label="Typical" home={burden.median} salaryAnnual={salaryAnnual} />
          </tbody>
        </table>

        {rents.length > 0 ? (
          <p className="aff-targets-note">
            Renting instead:{" "}
            {rents
              .map(([label, rent]) => {
                const needed = requiredIncomeGross(rent);
                const atSalary =
                  salaryAnnual !== undefined ? burdenBand(rent, salaryAnnual) : null;
                return (
                  `${label} median ${formatUsd(rent)}/mo` +
                  (needed !== null ? ` (needs about ${formatUsd(needed)}/yr` : "(") +
                  (atSalary !== null
                    ? `; ${burdenBandLabel(atSalary).toLowerCase()} at your salary)`
                    : ")")
                );
              })
              .join(" · ")}
            . Gross rent includes utilities.
          </p>
        ) : null}

        <div className="aff-fields">
          <label className="aff-field" htmlFor="hb-salary">
            <span>Gross annual salary (optional)</span>
            <input
              id="hb-salary"
              inputMode="decimal"
              placeholder="0"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
            <small>
              Job offers are quoted before tax — enter one to see the housing
              burden it carries here.
            </small>
          </label>
        </div>

        {approximations.length > 0 ? (
          <div className="aff-notes">
            <p>
              <strong>Approximated</strong> — these pieces used a national
              stand-in instead of local data:
            </p>
            <ul>
              {approximations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="aff-notes">
          <p>
            <strong>Not in PITI</strong> — these do not change the figures
            above:
          </p>
          <ul>
            {burden.notPriced.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <p className="aff-disclaimer">
          {AFFORDABILITY_DISCLAIMER} Sources: ACS 2024 5-year (B25076 entry
          value, B25031 bedroom rents); Freddie Mac 30-year rate; the 30% rule
          is the HUD affordability convention. For the after-tax whole-cost
          picture, use the retiree affordability card above.
        </p>
      </div>
    </section>
  );
}
