import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEmployerIndex,
  getLocationById,
  getSimilarLocations,
  getStateInfo,
} from "@/lib/locations";
import {
  calculateBaselineScore,
  calculateFitBreakdown,
  crimeGradeMeta,
} from "@/lib/scoring";
import { resolveStateAbbr } from "@/lib/states";
import type { Location } from "@/lib/types";
import PublicNav from "@/components/PublicNav";
import "../../styles/city.css";

export const dynamic = "force-dynamic";

function parseId(id: string): number | null {
  // Django routes /city/<int:pk>/ — only integers reach the view.
  if (!/^\d+$/.test(id)) return null;
  return Number(id);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pk = parseId(id);
  if (pk === null) return { title: "VetRetire" };
  const location = await getLocationById(pk);
  if (!location) return { title: "VetRetire" };
  return { title: `${location.name}, ${location.state} — VetRetire` };
}

// Ported 1:1 from locations/templates/locations/city_detail.html + views.city_detail
export default async function CityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pk = parseId(id);
  if (pk === null) notFound();

  const row = await getLocationById(pk);
  if (!row) notFound();

  const location: Location = {
    ...row,
    calculated_match_score: calculateBaselineScore(row),
  };
  const fitBreakdown = calculateFitBreakdown(row);
  const [crimeGrade] = crimeGradeMeta(row);

  const stateAbbr = resolveStateAbbr(location.state);
  // Independent of each other once we have `location`, so run in parallel
  // instead of two sequential Neon round trips.
  const [stateInfo, similarRows, employerIndex] = await Promise.all([
    stateAbbr ? getStateInfo(stateAbbr) : Promise.resolve(null),
    getSimilarLocations(location.state, location.id),
    getEmployerIndex(),
  ]);
  const employersHere = employerIndex[location.id] ?? [];
  const similar: Location[] = similarRows.map((r) => ({
    ...r,
    calculated_match_score: calculateBaselineScore(r),
  }));

  const meterClass = (score: number) =>
    score >= 80 ? "good" : score >= 60 ? "ok" : score >= 40 ? "warn" : "bad";

  return (
    <>
      <PublicNav active="explore" />

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link href="/explore">Explore</Link>
        <svg className="icon" viewBox="0 0 24 24">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <Link href={`/explore?state_filter=${stateAbbr ?? ""}`}>
          {location.state}
        </Link>
        <svg className="icon" viewBox="0 0 24 24">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="current">{location.name}</span>
      </div>

      {/* Hero */}
      <div className="hero-wrap">
        <div className="hero">
          <div className="hero-bg" style={{ background: location.gradient }}></div>
          <div className="hero-emoji">{location.emoji}</div>
          <div className="hero-content">
            <div>
              <h1 className="hero-title">{location.name}</h1>
              <div className="hero-sub">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {location.state}
                {location.county ? ` · ${location.county}` : ""}
              </div>
              <div className="hero-badges">
                {location.featured && (
                  <span className="hero-badge featured">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                    </svg>
                    Featured
                  </span>
                )}
                {location.climate && (
                  <span className="hero-badge">
                    <svg className="icon" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                    {location.climate}
                  </span>
                )}
                {location.cost_of_living && (
                  <span className="hero-badge">
                    <svg className="icon" viewBox="0 0 24 24">
                      <line x1="12" x2="12" y1="2" y2="22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    {location.cost_of_living} Cost
                  </span>
                )}
                {location.has_va && (
                  <span className="hero-badge">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    </svg>
                    VA On-Site
                  </span>
                )}
              </div>
            </div>
            <div className="hero-fit">
              <span className="hero-fit-num">{location.calculated_match_score}</span>
              <span className="hero-fit-label">Fit Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="layout">
        <div className="main-col">
          {/* KPI Row */}
          <div className="kpi-grid">
            <div className="kpi">
              <div className="kpi-label">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                </svg>
                Median Home
              </div>
              <div className="kpi-value">
                {location.avg_home_value_display || "—"}
              </div>
              <div className="kpi-sub">Typical home value</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M18 21a8 8 0 0 0-16 0" />
                  <circle cx="10" cy="8" r="5" />
                  <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
                </svg>
                Population
              </div>
              <div className="kpi-value">{location.population || "—"}</div>
              <div className="kpi-sub">
                {location.density ? `${location.density}/sq mi` : "Residents"}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="m12 14 4-4" />
                  <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                </svg>
                Cost of Living
              </div>
              <div className="kpi-value">
                {location.col_index ? location.col_index : location.cost_of_living}
              </div>
              <div className="kpi-sub">
                {location.col_index ? "Index (100 = US avg)" : "Category"}
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-label">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                Safety Grade
              </div>
              <div className="kpi-value">{crimeGrade || "—"}</div>
              <div className="kpi-sub">Overall crime grade</div>
            </div>
          </div>

          {/* Overview */}
          {location.description && (
            <div className="card">
              <div className="card-head">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h2>About {location.name}</h2>
              </div>
              <div className="card-body">
                <p className="lede">{location.description}</p>
              </div>
            </div>
          )}

          {/* Cost & Taxes */}
          <div className="card">
            <div className="card-head">
              <svg className="icon" viewBox="0 0 24 24">
                <line x1="12" x2="12" y1="2" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h2>Cost & Taxes</h2>
            </div>
            <div className="card-body">
              <div className="spec-grid">
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
                      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>{" "}
                    Median Home Value
                  </span>
                  <span className="spec-val">
                    {location.avg_home_value_display || "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="m12 14 4-4" />
                      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                    </svg>{" "}
                    Cost of Living Index
                  </span>
                  <span className="spec-val">{location.col_index || "—"}</span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                      <path d="M12 17.5v-11" />
                    </svg>{" "}
                    Sales Tax
                  </span>
                  <span className="spec-val">
                    {location.sales_tax != null ? `${location.sales_tax}%` : "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                      <path d="M12 17.5v-11" />
                    </svg>{" "}
                    Income Tax
                  </span>
                  <span className="spec-val">
                    {location.income_tax != null ? `${location.income_tax}%` : "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <line x1="3" x2="15" y1="22" y2="22" />
                      <line x1="4" x2="14" y1="9" y2="9" />
                      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
                      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
                    </svg>{" "}
                    Avg. Gas Price
                  </span>
                  <span className="spec-val">{location.gas_price || "—"}</span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <line x1="12" x2="12" y1="2" y2="22" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>{" "}
                    Cost Category
                  </span>
                  <span className="spec-val">{location.cost_of_living}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Climate & Weather */}
          <div className="card">
            <div className="card-head">
              <svg className="icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              <h2>Climate & Weather</h2>
            </div>
            <div className="card-body">
              <div className="spec-grid">
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                    </svg>{" "}
                    Summer High
                  </span>
                  <span className="spec-val">
                    {location.avg_high_summer != null
                      ? `${location.avg_high_summer}°F`
                      : "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                    </svg>{" "}
                    Winter Low
                  </span>
                  <span className="spec-val">
                    {location.alw != null
                      ? `${location.alw}°F`
                      : "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <line x1="2" x2="22" y1="12" y2="12" />
                      <line x1="12" x2="12" y1="2" y2="22" />
                      <path d="m20 16-4-4 4-4" />
                      <path d="m4 8 4 4-4 4" />
                      <path d="m16 4-4 4-4-4" />
                      <path d="m8 20 4-4 4 4" />
                    </svg>{" "}
                    Annual Snowfall
                  </span>
                  <span className="spec-val">
                    {location.snow_annual != null ? `${location.snow_annual}"` : "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                      <path d="M16 14v6" />
                      <path d="M8 14v6" />
                      <path d="M12 16v6" />
                    </svg>{" "}
                    Annual Rainfall
                  </span>
                  <span className="spec-val">
                    {location.rain_annual != null ? `${location.rain_annual}"` : "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>{" "}
                    Sunny Days
                  </span>
                  <span className="spec-val">
                    {location.sun_days != null ? `${location.sun_days}/yr` : "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 4.24 7 2c-.29 2.24-1.14 4.83-2.29 6.06S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
                      <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
                    </svg>{" "}
                    Summer Humidity
                  </span>
                  <span className="spec-val">
                    {location.humidity_summer != null
                      ? `${location.humidity_summer}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Veterans & Healthcare */}
          <div className="card">
            <div className="card-head">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
              </svg>
              <h2>Veterans & Healthcare</h2>
            </div>
            <div className="card-body">
              <div className="spec-grid">
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z" />
                    </svg>{" "}
                    Local VA Facility
                  </span>
                  <span className="spec-val">
                    {location.has_va ? (
                      <span className="badge good">
                        <svg className="icon" viewBox="0 0 24 24">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Yes
                      </span>
                    ) : (
                      <span className="badge neutral">No</span>
                    )}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>{" "}
                    Distance to VA
                  </span>
                  <span className="spec-val">
                    {location.has_va ? "On-site" : location.distance_to_va || "—"}
                  </span>
                </div>
                <div className="spec" style={{ gridColumn: "1 / -1" }}>
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                    </svg>{" "}
                    Nearest Facility
                  </span>
                  <span className="spec-val">{location.nearest_va || "—"}</span>
                </div>
              </div>
              {location.veterans_benefits && (
                <p
                  className="lede"
                  style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  {location.veterans_benefits}
                </p>
              )}
            </div>
          </div>

          {/* Community & Lifestyle */}
          <div className="card">
            <div className="card-head">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M18 21a8 8 0 0 0-16 0" />
                <circle cx="10" cy="8" r="5" />
                <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
              </svg>
              <h2>Community & Lifestyle</h2>
            </div>
            <div className="card-body">
              <div className="spec-grid">
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="m9 12 2 2 4-4" />
                      <path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z" />
                      <path d="M22 19H2" />
                    </svg>{" "}
                    Local Politics
                  </span>
                  <span className="spec-val">{location.city_politics || "—"}</span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>{" "}
                    2024 Result
                  </span>
                  <span className="spec-val">
                    {location.election_2024 ? (
                      <span
                        className={`badge ${
                          location.election_2024 === "R"
                            ? "rep"
                            : location.election_2024 === "D"
                              ? "dem"
                              : "neutral"
                        }`}
                      >
                        {location.election_2024}
                        {location.election_2024_percent
                          ? ` · ${location.election_2024_percent}%`
                          : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    {location.rep_vote_share_change_pp &&
                    location.rep_vote_share_change_pp > 0 ? (
                      <svg className="icon" viewBox="0 0 24 24">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                      </svg>
                    ) : (
                      <svg className="icon" viewBox="0 0 24 24">
                        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                        <polyline points="16 17 22 17 22 11" />
                      </svg>
                    )}{" "}
                    Political Trend
                  </span>
                  <span className="spec-val">{location.election_change || "—"}</span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                    </svg>{" "}
                    Marijuana
                  </span>
                  <span className="spec-val">
                    {location.marijuana_status || "—"}
                  </span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>{" "}
                    LGBTQ Friendliness
                  </span>
                  <span className="spec-val">{location.lgbtq_rating || "—"}</span>
                </div>
                <div className="spec">
                  <span className="spec-key">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                      <rect x="7" y="7" width="10" height="10" rx="1" />
                    </svg>{" "}
                    Density
                  </span>
                  <span className="spec-val">
                    {location.density ? `${location.density}/sq mi` : "—"}
                  </span>
                </div>
              </div>
              {(location.tech_hub || location.defense_hub) && (
                <div className="tags" style={{ marginTop: "1rem" }}>
                  {location.defense_hub && (
                    <span className="badge info">
                      <svg className="icon" viewBox="0 0 24 24">
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                      </svg>
                      Defense Hub
                    </span>
                  )}
                  {location.tech_hub && (
                    <span className="badge info">
                      <svg className="icon" viewBox="0 0 24 24">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <rect x="9" y="9" width="6" height="6" />
                        <path d="M15 2v2" />
                        <path d="M15 20v2" />
                        <path d="M2 15h2" />
                        <path d="M2 9h2" />
                        <path d="M20 15h2" />
                        <path d="M20 9h2" />
                        <path d="M9 2v2" />
                        <path d="M9 20v2" />
                      </svg>
                      Tech Hub
                    </span>
                  )}
                </div>
              )}
              {employersHere.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  {employersHere.map((e) => (
                    <div className="spec" key={e.slug}>
                      <span className="spec-key">{e.display_name}</span>
                      <span className="spec-val">
                        {e.total.toLocaleString()}{" "}
                        {e.total === 1 ? "opening" : "openings"}
                        {e.remote === e.total ? " (remote)" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* State Gun Laws */}
          {stateInfo && (
            <div className="card">
              <div className="card-head">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="M7 21h10" />
                  <path d="M12 3v18" />
                  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                </svg>
                <h2>{location.state} Firearm Laws</h2>
              </div>
              <div className="card-body">
                <div className="spec-grid">
                  <div className="spec">
                    <span className="spec-key">Giffords Grade</span>
                    <span className="spec-val">
                      {stateInfo.gifford_score ? (
                        <span className="badge neutral">
                          {stateInfo.gifford_score}
                        </span>
                      ) : (
                        "—"
                      )}
                    </span>
                  </div>
                  <div className="spec">
                    <span className="spec-key">Magazine Limit</span>
                    <span className="spec-val">
                      {stateInfo.magazine_limit || "None"}
                    </span>
                  </div>
                  <div className="spec">
                    <span className="spec-key">Assault Weapons Ban</span>
                    <span className="spec-val">
                      {stateInfo.assault_weapons_ban ? (
                        <span className="badge warn">Yes</span>
                      ) : (
                        <span className="badge good">No</span>
                      )}
                    </span>
                  </div>
                  <div className="spec">
                    <span className="spec-key">High-Cap Mag Ban</span>
                    <span className="spec-val">
                      {stateInfo.high_cap_mag_ban ? (
                        <span className="badge warn">Yes</span>
                      ) : (
                        <span className="badge good">No</span>
                      )}
                    </span>
                  </div>
                  <div className="spec">
                    <span className="spec-key">Ghost Gun Ban</span>
                    <span className="spec-val">
                      {stateInfo.ghost_gun_ban || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activities */}
          {location.tags && location.tags.length > 0 && (
            <div className="card">
              <div className="card-head">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </svg>
                <h2>Activities & Highlights</h2>
              </div>
              <div className="card-body">
                <div className="tags">
                  {location.tags.map((tag, i) => (
                    <span className="tag" key={i}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside className="rail">
          <div className="fit-card">
            <div className="fit-ring-wrap">
              <div
                className="fit-ring"
                style={{
                  background: `conic-gradient(var(--primary) ${location.calculated_match_score}%, #e5e7eb 0)`,
                }}
              >
                <div className="fit-ring-inner">
                  <div className="fit-ring-num">
                    {location.calculated_match_score}
                  </div>
                  <div className="fit-ring-pct">/ 100</div>
                </div>
              </div>
              <div className="fit-head-txt">
                <h3>Veteran Fit Score</h3>
                <p>
                  How well {location.name} fits a veteran&apos;s retirement —
                  five equally weighted factors.
                </p>
              </div>
            </div>

            <div className="fit-breakdown">
              {fitBreakdown.map((item) => (
                <div className="fb-row" key={item.key}>
                  <div className="fb-top">
                    <span className="fb-label">{item.label}</span>
                    <span className="fb-score">{item.score}</span>
                  </div>
                  <div className="meter">
                    <div
                      className={`meter-fill ${meterClass(item.score)}`}
                      style={{ width: `${item.score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rail-actions">
              <button className="btn btn-primary" type="button">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                Save to My List
              </button>
              <button className="btn btn-outline" type="button">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M16 3h5v5" />
                  <path d="M8 3H3v5" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 3l7 7" />
                  <path d="M16 21h5v-5" />
                  <path d="M8 21H3v-5" />
                  <path d="M21 21l-7-7" />
                  <path d="M3 21l7-7" />
                </svg>
                Compare
              </button>
              <Link className="btn btn-outline" href="/explore">
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                Back to Explore
              </Link>
            </div>

            <div className="rail-note">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>
                {location.has_va
                  ? `A VA facility is located in ${location.name}.`
                  : location.distance_to_va
                    ? `Nearest VA care is ${location.distance_to_va} away.`
                    : "VA facility distance data unavailable."}
              </span>
            </div>
          </div>

          <div className="quiz-plug">
            <div className="quiz-plug-badge">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h3>Is {location.name} right for you?</h3>
            <p>
              This score weighs five factors equally. Take the 2-minute quiz to
              re-rank it against <em>your</em> priorities — climate, budget,
              politics, and more.
            </p>
            <Link className="btn btn-primary" href="/quiz">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Get my personalized match
            </Link>
          </div>
        </aside>
      </div>

      {/* Similar in state */}
      {similar.length > 0 && (
        <div className="similar">
          <h2>More in {location.state}</h2>
          <div className="similar-grid">
            {similar.map((loc) => (
              <Link
                className="similar-card"
                href={`/city/${loc.id}`}
                key={loc.id}
                prefetch={false}
              >
                <div
                  className="similar-emoji"
                  style={{ background: loc.gradient }}
                >
                  {loc.emoji}
                </div>
                <div>
                  <div className="similar-name">{loc.name}</div>
                  <div className="similar-meta">
                    {loc.avg_home_value_display || "—"} · {loc.cost_of_living}{" "}
                    cost
                  </div>
                </div>
                <div className="similar-fit">{loc.calculated_match_score}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
