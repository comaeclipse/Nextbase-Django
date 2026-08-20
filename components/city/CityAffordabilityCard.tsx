"use client";

import { useMemo, useState } from "react";
import type { Location } from "@/lib/types";
import {
  COMFORT_COST_SHARE,
  assessBudget,
  estimateMonthlyCost,
  incomeTargets,
  type LocationBudget,
} from "@/lib/affordability";
import { resolveCostConstants } from "@/lib/cost-constants";
import { resolveTaxConstants } from "@/lib/tax-constants";
import {
  AFFORDABILITY_DISCLAIMER,
  DEFAULT_AFFORDABILITY_SCENARIO,
  HEALTH_COVERAGE_OPTIONS,
  INCOME_FIELDS,
  PROFILE_OPTIONS,
  TENURE_OPTIONS,
  affordabilityVintage,
  bandLabel,
  bandVerdict,
  formatUsd,
  profileLabel,
  scenarioIsActive,
  scenarioSources,
  tenureLabel,
  type AffordabilityScenario,
} from "@/lib/affordability-scenario";
import type { FilingStatus } from "@/lib/income";
import type { HealthCoverage, SpendingProfile, Tenure } from "@/lib/affordability";

function Field({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="aff-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <small>{hint}</small>
    </label>
  );
}

export default function CityAffordabilityCard({ location }: { location: Location }) {
  const [scenario, setScenario] = useState<AffordabilityScenario>(
    DEFAULT_AFFORDABILITY_SCENARIO
  );

  function set<K extends keyof AffordabilityScenario>(
    key: K,
    value: AffordabilityScenario[K]
  ) {
    setScenario((current) => ({ ...current, [key]: value }));
  }

  // The no-input answer: what take-home income each housing choice takes in
  // this city. Recomputed only when the spending/coverage toggles move — the
  // income fields don't affect it, which is the point.
  const glance = useMemo(() => {
    const cost = resolveCostConstants();
    if (!cost.ok) return null;
    return TENURE_OPTIONS.map((option) => ({
      tenure: option.id,
      label: option.label,
      targets: incomeTargets(
        estimateMonthlyCost(location, option.id, cost.constants, {
          spendingProfile: scenario.spendingProfile,
          healthCoverage: scenario.healthCoverage,
        })
      ),
    }));
  }, [location, scenario.spendingProfile, scenario.healthCoverage]);

  const budget: LocationBudget | null = useMemo(() => {
    if (!scenarioIsActive(scenario)) return null;
    const cost = resolveCostConstants();
    const tax = resolveTaxConstants();
    if (!cost.ok || !tax.ok) return null;
    return assessBudget(
      location,
      {
        sources: scenarioSources(scenario),
        filing: scenario.filing,
        age65Plus: scenario.age65Plus,
        spouse65Plus: scenario.spouse65Plus,
      },
      scenario.tenure,
      cost.constants,
      tax.constants,
      { spendingProfile: scenario.spendingProfile, healthCoverage: scenario.healthCoverage }
    );
  }, [location, scenario]);

  const cost = budget?.cost;
  const income = budget?.income;
  const missing = [
    ...new Set([...(cost?.missing ?? []), ...(income?.missing ?? [])]),
  ];
  const approximations = [
    ...new Set([
      ...(cost?.approximations ?? []),
      ...(income?.approximations ?? []),
    ]),
  ];
  const ownershipCaveat =
    scenario.tenure !== "rent"
      ? "Ownership uses this city's typical home value plus a 1% maintenance planning rule, not a downsized modest dwelling."
      : null;

  return (
    <section className="card aff-card" aria-labelledby="aff-title">
      <div className="card-head">
        <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
          <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
        </svg>
        <h2 id="aff-title">What would it cost me here?</h2>
      </div>
      <div className="card-body">
        <p className="lede">
          At a glance: the monthly take-home income it takes to live in {location.name}, at {profileLabel(scenario.spendingProfile).toLowerCase()} spending.
        </p>

        {glance ? (
          <>
            <table className="aff-targets">
              <thead>
                <tr>
                  <th scope="col">Housing</th>
                  <th scope="col">Covers the basics</th>
                  <th scope="col">Comfortable</th>
                </tr>
              </thead>
              <tbody>
                {glance.map((row) => (
                  <tr key={row.tenure}>
                    <th scope="row">{row.label}</th>
                    {row.targets ? (
                      <>
                        <td>{formatUsd(row.targets.breakEven)}/mo</td>
                        <td>
                          <strong>{formatUsd(row.targets.comfortable)}/mo</strong>
                        </td>
                      </>
                    ) : (
                      <td colSpan={2}>Not enough data</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="aff-targets-note">
              Both are after-tax amounts. &ldquo;Covers the basics&rdquo; just
              meets estimated costs; &ldquo;comfortable&rdquo; keeps at least{" "}
              {Math.round((1 - COMFORT_COST_SHARE) * 100)}% of income unspent
              as cushion. Ownership rows use this city&rsquo;s typical home
              value; buying assumes 20% down at current rates.
            </p>
          </>
        ) : null}

        <p className="lede">
          For a personal verdict, enter how your income breaks down — taxes are estimated for {location.state}.
        </p>

        <div className="aff-fields">
          {INCOME_FIELDS.map((field) => (
            <Field
              key={field.key}
              id={`city-aff-${field.key}`}
              label={`${field.label} / mo`}
              hint={field.hint}
              value={scenario[field.key]}
              onChange={(value) => set(field.key, value)}
            />
          ))}
        </div>

        <div className="aff-row-controls">
          <div>
            <span className="aff-legend">Household</span>
            <div className="aff-toggles" role="group" aria-label="Filing status">
              {(["single", "married"] as FilingStatus[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="aff-toggle"
                  aria-pressed={scenario.filing === id}
                  onClick={() => set("filing", id)}
                >
                  {id === "single" ? "Single" : "Married"}
                </button>
              ))}
            </div>
            <label className="aff-check">
              <input
                type="checkbox"
                checked={scenario.age65Plus}
                onChange={(e) => set("age65Plus", e.target.checked)}
              />
              Age 65+
            </label>
            {scenario.filing === "married" ? (
              <label className="aff-check">
                <input
                  type="checkbox"
                  checked={scenario.spouse65Plus}
                  onChange={(e) => set("spouse65Plus", e.target.checked)}
                />
                Spouse 65+
              </label>
            ) : null}
          </div>
          <div>
            <span className="aff-legend">Housing</span>
            <div className="aff-toggles" role="group" aria-label="Housing tenure">
              {TENURE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="aff-toggle"
                  aria-pressed={scenario.tenure === option.id}
                  onClick={() => set("tenure", option.id as Tenure)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="aff-legend">Spending</span>
            <div className="aff-toggles" role="group" aria-label="Spending profile">
              {PROFILE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="aff-toggle"
                  aria-pressed={scenario.spendingProfile === option.id}
                  onClick={() => set("spendingProfile", option.id as SpendingProfile)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="aff-legend">Health coverage</span>
            <div className="aff-toggles" role="group" aria-label="Health coverage">
              {HEALTH_COVERAGE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="aff-toggle"
                  aria-pressed={scenario.healthCoverage === option.id}
                  onClick={() => set("healthCoverage", option.id as HealthCoverage)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!budget ? (
          <p className="aff-empty">
            Add at least one income source above for a personal verdict on {location.name}.
          </p>
        ) : cost?.monthlyCost === null ? (
          <div className="aff-notes aff-missing">
            <p>
              <strong>Not enough data</strong> to price this city for{" "}
              {tenureLabel(scenario.tenure).toLowerCase()}.
            </p>
            <ul>
              {missing.map((item) => (
                <li key={item}>Missing: {item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <p className={`aff-verdict aff-verdict-${budget.band}`}>
              {bandVerdict(budget.band)}
            </p>
            <div className="aff-hero">
              <div>
                <span className="aff-legend">Estimated monthly cost</span>
                <strong>{formatUsd(cost?.monthlyCost)}</strong>
                <span className={`badge ${budget.band === "comfortable" ? "good" : budget.band === "tight" ? "warn" : budget.band === "over" ? "bad" : "neutral"}`}>
                  {bandLabel(budget.band)}
                </span>
              </div>
              <div>
                <span className="aff-legend">Estimated take-home</span>
                <strong>{formatUsd(income?.netMonthly)}</strong>
                <small>
                  from {formatUsd(income?.grossMonthly)} gross
                  {income ? ` · ${Math.round(income.effectiveRate * 100)}% effective tax` : ""}
                </small>
              </div>
              <div>
                <span className="aff-legend">Money left over</span>
                <strong>{formatUsd(budget.headroom)}</strong>
                <small>
                  {profileLabel(scenario.spendingProfile)} spending · {tenureLabel(scenario.tenure)}
                </small>
              </div>
            </div>

            <dl className="aff-breakdown">
              <div>
                <dt>Housing</dt>
                <dd>{formatUsd(cost?.housing)}</dd>
              </div>
              <div>
                <dt>Everyday costs</dt>
                <dd>{formatUsd(cost?.nonHousing)}</dd>
              </div>
              <div>
                <dt>
                  {scenario.healthCoverage === "va_primary"
                    ? "Medicare Part B"
                    : "Medicare / supplement"}
                </dt>
                <dd>{formatUsd(cost?.nationalFixed)}</dd>
              </div>
              <div>
                <dt>Federal tax</dt>
                <dd>{formatUsd(income?.federalMonthly)}</dd>
              </div>
              <div>
                <dt>State tax</dt>
                <dd>{formatUsd(income?.stateMonthly)}</dd>
              </div>
              <div>
                <dt>FICA</dt>
                <dd>{formatUsd(income?.ficaMonthly)}</dd>
              </div>
            </dl>

            {approximations.length > 0 ? (
              <div className="aff-notes">
                <p>
                  <strong>Approximated</strong> — the total is usable, but these
                  pieces used a national stand-in instead of local data:
                </p>
                <ul>
                  {approximations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {missing.length > 0 ? (
              <div className="aff-notes aff-missing">
                <p>
                  <strong>Missing</strong> from take-home, not from the cost
                  total:
                </p>
                <ul>
                  {missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {income?.notes.length ? (
              <ul className="aff-notes">
                {income.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            {cost?.missingContext.length ? (
              <div className="aff-notes">
                <p>
                  <strong>Not modeled</strong> — these do not change the total
                  or the band above:
                </p>
                <ul>
                  {cost.missingContext.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {ownershipCaveat ? <p className="aff-notes">{ownershipCaveat}</p> : null}
          </>
        )}

        <p className="aff-disclaimer">
          {AFFORDABILITY_DISCLAIMER} {affordabilityVintage()}
        </p>
      </div>
    </section>
  );
}
