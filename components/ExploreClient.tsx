"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Location } from "@/lib/types";
import LocationCard from "./LocationCard";
import StateMap from "./StateMap";

/*
 * Interactive explore area, ported from the inline script in
 * locations/templates/locations/explore.html. Replaces HTMX with fetch to
 * /api/locations. Initial results are server-rendered (props) for parity on
 * first paint; changes refetch and re-render the grid.
 */

const CLIMATE_KEYS = ["cold_snowy", "hot_humid", "hot_dry", "mild_coastal"] as const;
const LIFESTYLE_KEYS = ["urban", "suburban", "rural"] as const;
const HEALTHCARE_KEYS = ["va-hospital", "va-clinic"] as const;
const ACTIVITY_KEYS = ["golf", "fishing", "hiking", "culture"] as const;

type BoolMap<K extends string> = Record<K, boolean>;
const falses = <K extends string>(keys: readonly K[]): BoolMap<K> =>
  Object.fromEntries(keys.map((k) => [k, false])) as BoolMap<K>;

export default function ExploreClient({
  initialLocations,
  stateCounts,
}: {
  initialLocations: Location[];
  stateCounts: Record<string, number>;
}) {
  const [climate, setClimate] = useState(falses(CLIMATE_KEYS));
  const [snow, setSnow] = useState<string | null>(null);
  const [lgbtq, setLgbtq] = useState(false);
  const [noAwb, setNoAwb] = useState(false);
  const [noHcm, setNoHcm] = useState(false);
  const [cost, setCost] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [lifestyle, setLifestyle] = useState(falses(LIFESTYLE_KEYS));
  const [healthcare, setHealthcare] = useState(falses(HEALTHCARE_KEYS));
  const [activities, setActivities] = useState(falses(ACTIVITY_KEYS));
  const [sort, setSort] = useState("best");
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [selectedMapState, setSelectedMapState] = useState<string | null>(null);
  const [mapMounted, setMapMounted] = useState(false);

  const [results, setResults] = useState<Location[]>(initialLocations);
  const [total, setTotal] = useState(initialLocations.length);

  // Build the query string exactly like the Django explore JS.
  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (snow) p.append("snow", snow);
    if (lgbtq) p.append("lgbtq_friendly", "true");
    if (noAwb) p.append("no_awb", "true");
    if (noHcm) p.append("no_hcm", "true");
    if (sort) p.append("sort", sort);
    const climateVal = CLIMATE_KEYS.filter((k) => climate[k]).join(",");
    if (climateVal) p.append("climate", climateVal);
    if (cost) p.append("cost_of_living", cost);
    const pmin = priceMin.match(/\d+/);
    if (pmin) p.append("price_min", pmin[0]);
    const pmax = priceMax.match(/\d+/);
    if (pmax) p.append("price_max", pmax[0]);
    const lifeVal = LIFESTYLE_KEYS.filter((k) => lifestyle[k]).join(",");
    if (lifeVal) p.append("lifestyle", lifeVal);
    const hcMap: Record<string, string> = {
      "va-hospital": "va_hospital",
      "va-clinic": "va_clinic",
    };
    const hcVal = HEALTHCARE_KEYS.filter((k) => healthcare[k])
      .map((k) => hcMap[k])
      .join(",");
    if (hcVal) p.append("healthcare", hcVal);
    const actVal = ACTIVITY_KEYS.filter((k) => activities[k]).join(",");
    if (actVal) p.append("activities", actVal);
    if (selectedMapState) p.append("state_filter", selectedMapState);
    return p.toString();
  }, [
    snow, lgbtq, noAwb, noHcm, sort, climate, cost, priceMin, priceMax,
    lifestyle, healthcare, activities, selectedMapState,
  ]);

  const query = buildQuery();
  const firstRun = useRef(true);

  const doFetch = useCallback(async (qs: string, signal?: AbortSignal) => {
    const res = await fetch("/api/locations" + (qs ? "?" + qs : ""), { signal });
    const data = await res.json();
    setResults(data.locations);
    setTotal(data.totalResults);
  }, []);

  useEffect(() => {
    // Initial results are already server-rendered; skip the first fetch.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(() => {
      doFetch(query, controller.signal).catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });
    }, 200);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [query, doFetch]);

  function selectView(v: "grid" | "list" | "map") {
    if (v === "map") setMapMounted(true);
    if (v !== "map" && selectedMapState) setSelectedMapState(null);
    setView(v);
  }

  const gridClass = "results-grid" + (view === "list" ? " list-view" : "");

  return (
    <div className="container">
      <aside className="sidebar">
        <h2>Filters</h2>

        <div className="filter-section">
          <h3>Climate</h3>
          {(
            [
              ["cold_snowy", "❄️ Cold / Snowy"],
              ["hot_humid", "💧 Hot / Humid"],
              ["hot_dry", "☀️ Hot / Dry"],
              ["mild_coastal", "🌊 Mild / Coastal"],
            ] as const
          ).map(([id, label]) => (
            <div className="filter-option" key={id}>
              <input
                type="checkbox"
                id={id}
                checked={climate[id]}
                onChange={(e) =>
                  setClimate((c) => ({ ...c, [id]: e.target.checked }))
                }
              />
              <label htmlFor={id}>{label}</label>
            </div>
          ))}

          <h3 style={{ marginTop: "1.5rem" }}>Snow</h3>
          <div className="pillbox-container">
            {(
              [
                ["zero", "Zero Snow"],
                ["some", "Some Snow"],
                ["lots", "Lots of Snow"],
              ] as const
            ).map(([val, label]) => (
              <div
                key={val}
                className={"pillbox" + (snow === val ? " active" : "")}
                data-snow={val}
                onClick={() => setSnow((s) => (s === val ? null : val))}
              >
                {label}
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: "1.5rem" }}>Misc</h3>
          <div className="filter-option">
            <input
              type="checkbox"
              id="lgbtq-friendly"
              checked={lgbtq}
              onChange={(e) => setLgbtq(e.target.checked)}
            />
            <label htmlFor="lgbtq-friendly">LGBTQ Friendly</label>
          </div>
          <div className="filter-option">
            <input
              type="checkbox"
              id="no-awb"
              checked={noAwb}
              onChange={(e) => setNoAwb(e.target.checked)}
            />
            <label htmlFor="no-awb">No Assault Weapons Ban</label>
          </div>
          <div className="filter-option">
            <input
              type="checkbox"
              id="no-hcm"
              checked={noHcm}
              onChange={(e) => setNoHcm(e.target.checked)}
            />
            <label htmlFor="no-hcm">No High-Cap Mag Restrictions</label>
          </div>
        </div>

        <div className="filter-section">
          <h3>Cost of Living</h3>
          <select
            id="cost-select"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          >
            <option value="">Any Budget</option>
            <option value="low">Low ($)</option>
            <option value="moderate">Moderate ($$)</option>
            <option value="high">High ($$$)</option>
          </select>
          <div className="price-range">
            <input
              type="text"
              id="price-min"
              placeholder="Min $"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
            />
            <span>-</span>
            <input
              type="text"
              id="price-max"
              placeholder="Max $"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <h3>Lifestyle</h3>
          {(
            [
              ["urban", "Urban"],
              ["suburban", "Suburban"],
              ["rural", "Rural"],
            ] as const
          ).map(([id, label]) => (
            <div className="filter-option" key={id}>
              <input
                type="checkbox"
                id={id}
                checked={lifestyle[id]}
                onChange={(e) =>
                  setLifestyle((l) => ({ ...l, [id]: e.target.checked }))
                }
              />
              <label htmlFor={id}>{label}</label>
            </div>
          ))}
        </div>

        <div className="filter-section">
          <h3>Healthcare Access</h3>
          {(
            [
              ["va-hospital", "VA Hospital Nearby"],
              ["va-clinic", "VA Clinic Access"],
            ] as const
          ).map(([id, label]) => (
            <div className="filter-option" key={id}>
              <input
                type="checkbox"
                id={id}
                checked={healthcare[id]}
                onChange={(e) =>
                  setHealthcare((h) => ({ ...h, [id]: e.target.checked }))
                }
              />
              <label htmlFor={id}>{label}</label>
            </div>
          ))}
        </div>

        <div className="filter-section">
          <h3>Activities</h3>
          {(
            [
              ["golf", "Golf"],
              ["fishing", "Fishing"],
              ["hiking", "Hiking"],
              ["culture", "Arts & Culture"],
            ] as const
          ).map(([id, label]) => (
            <div className="filter-option" key={id}>
              <input
                type="checkbox"
                id={id}
                checked={activities[id]}
                onChange={(e) =>
                  setActivities((a) => ({ ...a, [id]: e.target.checked }))
                }
              />
              <label htmlFor={id}>{label}</label>
            </div>
          ))}
        </div>

        <button className="apply-filters" onClick={() => doFetch(query)}>
          Apply Filters
        </button>
      </aside>

      <main className="main-content">
        <div className="results-header">
          <div>
            <div className="results-info" id="results-info">
              Found <strong>{total} locations</strong> matching your criteria
            </div>
          </div>
          <div className="sort-options">
            <label>Sort by:</label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="best">Best Match</option>
              <option value="cost_asc">Cost (Low to High)</option>
              <option value="cost_desc">Cost (High to Low)</option>
              <option value="climate">Climate</option>
              <option value="va">VA Access</option>
              <option value="gas_asc">Gas Price (Low to High)</option>
              <option value="gas_desc">Gas Price (High to Low)</option>
            </select>
            <div className="view-toggle">
              {(["grid", "list", "map"] as const).map((v) => (
                <button
                  key={v}
                  className={"view-btn" + (view === v ? " active" : "")}
                  data-view={v}
                  onClick={() => selectView(v)}
                >
                  {v === "grid" ? "Grid" : v === "list" ? "List" : "Map"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div id="map-view" style={{ display: view === "map" ? "block" : "none" }}>
          {mapMounted && (
            <StateMap
              stateCounts={stateCounts}
              selected={selectedMapState}
              onSelect={setSelectedMapState}
            />
          )}
        </div>

        <div className={gridClass} id="results-grid">
          {results.map((loc) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>
      </main>
    </div>
  );
}
