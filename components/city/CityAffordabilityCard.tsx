"use client";

import { useMemo, useState } from "react";
import type { Location } from "@/lib/types";
import {
  COMFORT_COST_SHARE,
  assessBudget,
  estimateMonthlyCost,
  incomeTargets,
  quickCheck,
  type LocationBudget,
} from "@/lib/affordability";
import { resolveCostConstants } from "@/lib/cost-constants";
import { resolveTaxConstants } from "@/lib/tax-constants";
import {
  AFFORDABILITY_DISCLAIMER,
  CUSHION_OPTIONS,
  DEFAULT_AFFORDABILITY_SCENARIO,
  HEALTH_COVERAGE_OPTIONS,
  HOUSEHOLD_OPTIONS,
  INCOME_FIELDS,
  PROFILE_OPTIONS,
  TENURE_OPTIONS,
  affordabilityVintage,
  bandLabel,
  bandVerdict,
  cushionShare,
  formatUsd,
  householdLabel,
  parseMonthlyAmount,
  profileLabel,
  healthLineLabel,
  quickVerdictBadgeClass,
  quickVerdictCopy,
  quickVerdictLabel,
  scenarioEstimateOptions,
  scenarioIsActive,
  scenarioSources,
  tenureLabel,
  wildestDreamsLine,
  type AffordabilityScenario,
  type CushionChoice,
} from "@/lib/affordability-scenario";
import type { FilingStatus } from "@/lib/income";
import type {
  HealthCoverage,
  Household,
  SpendingProfile,
  Tenure,
} from "@/lib/affordability";

type Mode = "quick" | "detailed";

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
  const [mode, setMode] = useState<Mode>("quick");
  const [scenario, setScenario] = useState<AffordabilityScenario>(
    DEFAULT_AFFORDABILITY_SCENARIO
  );
  // Quick-check inputs. Tenure is shared with the detailed scenario so
  // "Fine-tune" carries it over instead of restarting.
  const [quickIncome, setQuickIncome] = useState("");
  const [quickHousehold, setQuickHousehold] = useState<Household>("single");

  function set<K extends keyof AffordabilityScenario>(
    key: K,
    value: AffordabilityScenario[K]
  ) {
    setScenario((current) => ({ ...current, [key]: value }));
  }

  /*
   * Quick check deliberately has NO spending or coverage knobs: one
   * standardized baseline (the modest basket, Medicare + supplement) so the
   * answer is a reality check, not a lifestyle questionnaire. The detailed
   * tab is where those choices live.
   */
  const quickEstimate = useMemo(() => {
    const cost = resolveCostConstants();
    if (!cost.ok) return null;
    return estimateMonthlyCost(location, scenario.tenure, cost.constants, {
      spendingProfile: "modest",
      healthCoverage: "medicare_supplement",
      household: quickHousehold,
    });
  }, [location, scenario.tenure, quickHousehold]);

  const quickIncomeParsed = parseMonthlyAmount(quickIncome);
  const quick = useMemo(
    () => (quickEstimate ? quickCheck(quickEstimate, quickIncomeParsed) : null),
    [quickEstimate, quickIncomeParsed]
  );

  // The no-input answer: what take-home income each housing choice takes in
  // this city, at the quick-check baseline for the selected household.
  const glance = useMemo(() => {
    const cost = resolveCostConstants();
    if (!cost.ok) return null;
    return TENURE_OPTIONS.map((option) => ({
      tenure: option.id,
      label: option.label,
      targets: incomeTargets(
        estimateMonthlyCost(location, option.id, cost.constants, {
          spendingProfile: "modest",
          healthCoverage: "medicare_supplement",
          household: quickHousehold,
        })
      ),
    }));
  }, [location, quickHousehold]);

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
      // One source of truth for scenario -> options (couple basket for
      // married filing, housing overrides); /explore uses the same helper so
      // the two surfaces can never price the same scenario differently.
      scenarioEstimateOptions(scenario),
      cushionShare(scenario.cushion)
    );
  }, [location, scenario]);

  function fineTune() {
    if (quickHousehold === "couple" && scenario.filing !== "married") {
      set("filing", "married");
    }
    setMode("detailed");
  }

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
      ? scenario.homePrice.trim()
        ? "Ownership uses your home price plus a 1% maintenance planning rule."
        : "Ownership uses this city's typical home value plus a 1% maintenance planning rule, not a downsized modest dwelling."
      : null;

  const cushionTargetPct = Math.round((1 - COMFORT_COST_SHARE) * 100);

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
        <div className="aff-tabs" role="group" aria-label="Estimate mode">
          <button
            type="button"
            className="aff-toggle"
            aria-pressed={mode === "quick"}
            onClick={() => setMode("quick")}
          >
            Quick check
          </button>
          <button
            type="button"
            className="aff-toggle"
            aria-pressed={mode === "detailed"}
            onClick={() => setMode("detailed")}
          >
            Detailed estimate
          </button>
        </div>

        {mode === "quick" ? (
          <>
            <p className="lede">
              A quick reality check for {location.name} — no detailed budget
              required. Assumes a modest budget and Medicare with supplement.
            </p>

            <div className="aff-fields">
              <Field
                id="city-aff-quick-income"
                label="Monthly take-home income"
                hint="After taxes — any mix of sources counts the same here"
                value={quickIncome}
                onChange={setQuickIncome}
              />
            </div>
            <div className="aff-row-controls">
              <div>
                <span className="aff-legend">Household</span>
                <div className="aff-toggles" role="group" aria-label="Household">
                  {HOUSEHOLD_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="aff-toggle"
                      aria-pressed={quickHousehold === option.id}
                      onClick={() => setQuickHousehold(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
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
            </div>

            {quickIncomeParsed <= 0 ? (
              <>
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
                                  <strong>
                                    {formatUsd(row.targets.comfortable)}/mo
                                  </strong>
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
                      Take-home targets for a{" "}
                      {quickHousehold === "couple" ? "couple" : "single person"}.
                      &ldquo;Covers the basics&rdquo; just meets estimated
                      costs; &ldquo;comfortable&rdquo; keeps at least{" "}
                      {cushionTargetPct}% of income unspent as cushion.
                      Ownership rows use this city&rsquo;s typical home value;
                      buying assumes 20% down at current rates.
                    </p>
                  </>
                ) : null}
                <p className="aff-empty">
                  Enter your take-home above for a verdict on {location.name}.
                </p>
              </>
            ) : !quickEstimate ? (
              <p className="aff-notes aff-missing">
                Estimates are unavailable right now — the model&rsquo;s
                national constants could not be loaded.
              </p>
            ) : quick === null || quickEstimate.monthlyCost === null ? (
              <div className="aff-notes aff-missing">
                <p>
                  <strong>Not enough data</strong> to price this city for{" "}
                  {tenureLabel(scenario.tenure).toLowerCase()}.
                </p>
                <ul>
                  {quickEstimate.missing.map((item) => (
                    <li key={item}>Missing: {item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="aff-quick-result">
                <p className={`aff-verdict aff-verdict-${quick.verdict}`}>
                  <span className={`badge ${quickVerdictBadgeClass(quick.verdict)}`}>
                    {quickVerdictLabel(quick.verdict)}
                  </span>
                </p>
                <p className={`aff-quick-copy aff-verdict-${quick.verdict}`}>
                  {quickVerdictCopy(quick.verdict)}
                </p>
                {wildestDreamsLine(quick) ? (
                  <p className="aff-notes aff-wildest">
                    {wildestDreamsLine(quick)}
                  </p>
                ) : null}
                <dl className="aff-quick-rows">
                  <div>
                    <dt>Your take-home</dt>
                    <dd>{formatUsd(quickIncomeParsed)}/mo</dd>
                  </div>
                  <div>
                    <dt>Estimated monthly costs</dt>
                    <dd>{formatUsd(quickEstimate?.monthlyCost)}/mo</dd>
                  </div>
                  <div>
                    <dt>Comfortable target</dt>
                    <dd>{formatUsd(quick.targets.comfortable)}/mo</dd>
                  </div>
                  <div>
                    <dt>
                      {quick.remaining >= 0
                        ? "Money remaining"
                        : "Estimated shortfall"}
                    </dt>
                    <dd>{formatUsd(Math.abs(quick.remaining))}/mo</dd>
                  </div>
                  {quick.remaining >= 0 ? (
                    <div>
                      <dt>Estimated cushion</dt>
                      <dd>
                        {Math.round(quick.cushion * 100)}%{" "}
                        <small>(target {cushionTargetPct}%)</small>
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <p className="aff-distance">
                  {quick.verdict === "comfortable"
                    ? `You're at or past our comfortable benchmark for ${location.name}.`
                    : quick.remaining >= 0
                      ? `You're about ${formatUsd(quick.toComfortable)}/month away from our comfortable range.`
                      : `Estimated costs here are about ${formatUsd(-quick.remaining)}/month higher than your current take-home.`}
                </p>
                {quickEstimate && quickEstimate.approximations.length > 0 ? (
                  <div className="aff-notes">
                    <p>
                      <strong>Approximated</strong> — these pieces used a
                      national stand-in instead of local data:
                    </p>
                    <ul>
                      {quickEstimate.approximations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {quickEstimate && quickEstimate.missingContext.length > 0 ? (
                  <div className="aff-notes">
                    <p>
                      <strong>Not modeled</strong> — these do not change the
                      verdict above:
                    </p>
                    <ul>
                      {quickEstimate.missingContext.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <button type="button" className="aff-finetune" onClick={fineTune}>
                  Fine-tune this estimate →
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="lede">
              Enter how your income breaks down — taxes are estimated for {location.state}. The estimate uses {profileLabel(scenario.spendingProfile).toLowerCase()} spending and {tenureLabel(scenario.tenure).toLowerCase()} housing.
            </p>
            {quick && quickEstimate?.monthlyCost !== null ? (
              <p className="aff-notes">
                Quick check said <strong>{quickVerdictLabel(quick.verdict)}</strong>{" "}
                at {formatUsd(quickIncomeParsed)}/mo take-home ·{" "}
                {tenureLabel(scenario.tenure)} · modest budget · Medicare with
                supplement · {householdLabel(quickHousehold).toLowerCase()} ·{" "}
                {cushionTargetPct}% cushion.
              </p>
            ) : null}

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
              <div>
                <span className="aff-legend">Financial cushion</span>
                <div className="aff-toggles" role="group" aria-label="Financial cushion">
                  {CUSHION_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="aff-toggle"
                      aria-pressed={scenario.cushion === option.id}
                      onClick={() => set("cushion", option.id as CushionChoice)}
                      title={option.hint}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="aff-fields">
              <Field
                id="city-aff-dependents"
                label="Dependents"
                hint="Extra people beyond the adults above (e.g. a grandchild) — priced on everyday spending only, one dwelling"
                value={scenario.dependents}
                onChange={(value) => set("dependents", value)}
              />
            </div>

            {scenario.tenure !== "rent" ? (
              <div className="aff-housing-details">
                <span className="aff-legend">
                  Housing details <small>(optional — blank uses this city&rsquo;s defaults)</small>
                </span>
                <div className="aff-fields">
                  <Field
                    id="city-aff-homePrice"
                    label="Home price"
                    hint={`Blank = this city's typical home value`}
                    value={scenario.homePrice}
                    onChange={(value) => set("homePrice", value)}
                  />
                  <Field
                    id="city-aff-propertyTaxPct"
                    label="Property tax % / yr"
                    hint="Blank = this city's effective rate"
                    value={scenario.propertyTaxPct}
                    onChange={(value) => set("propertyTaxPct", value)}
                  />
                  <Field
                    id="city-aff-hoaMonthly"
                    label="HOA / mo"
                    hint="Blank = none"
                    value={scenario.hoaMonthly}
                    onChange={(value) => set("hoaMonthly", value)}
                  />
                  {scenario.tenure === "buying" ? (
                    <>
                      <Field
                        id="city-aff-downPaymentPct"
                        label="Down payment %"
                        hint="Blank = 20%"
                        value={scenario.downPaymentPct}
                        onChange={(value) => set("downPaymentPct", value)}
                      />
                      <Field
                        id="city-aff-mortgageRatePct"
                        label="Mortgage rate %"
                        hint="Blank = current 30-year average"
                        value={scenario.mortgageRatePct}
                        onChange={(value) => set("mortgageRatePct", value)}
                      />
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}

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
                    <dt>{healthLineLabel(scenario.healthCoverage)}</dt>
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
          </>
        )}

        <p className="aff-disclaimer">
          {AFFORDABILITY_DISCLAIMER} {affordabilityVintage()}
        </p>
      </div>
    </section>
  );
}
