"use client";

import { useMemo, useState } from "react";
import type { Location, StateInfoRow } from "@/lib/types";
import { filterAndSort, type FilterParams } from "@/lib/filters";
import LocationCard from "./LocationCard";
import StateMap from "./StateMap";

/*
 * Interactive explore area, ported from the inline script in
 * locations/templates/locations/explore.html. HTMX's server round trip is
 * replaced with in-browser filtering: the full dataset is already on the
 * client (server-rendered as `initialLocations` for first-paint parity), so
 * filter/sort changes reuse the exact same `filterAndSort` logic the
 * /api/locations route runs, but instantly and without a network request.
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
  stateInfos,
  stateCounts,
}: {
  initialLocations: Location[];
  stateInfos: StateInfoRow[];
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

  // Build the same FilterParams shape the /api/locations route parses from
  // query params, but as an object — no query string or network round trip.
  const filterParams = useMemo<FilterParams>(() => {
    const climateVal = CLIMATE_KEYS.filter((k) => climate[k]).join(",");
    const lifeVal = LIFESTYLE_KEYS.filter((k) => lifestyle[k]).join(",");
    const hcMap: Record<string, string> = {
      "va-hospital": "va_hospital",
      "va-clinic": "va_clinic",
    };
    const hcVal = HEALTHCARE_KEYS.filter((k) => healthcare[k])
      .map((k) => hcMap[k])
      .join(",");
    const actVal = ACTIVITY_KEYS.filter((k) => activities[k]).join(",");
    const pmin = priceMin.match(/\d+/);
    const pmax = priceMax.match(/\d+/);
    return {
      snow: snow || null,
      no_awb: noAwb ? "true" : null,
      no_hcm: noHcm ? "true" : null,
      state_filter: selectedMapState || null,
      lgbtq_friendly: lgbtq ? "true" : null,
      climate: climateVal || null,
      cost_of_living: cost || null,
      price_min: pmin ? pmin[0] : null,
      price_max: pmax ? pmax[0] : null,
      lifestyle: lifeVal || null,
      healthcare: hcVal || null,
      activities: actVal || null,
      sort,
    };
  }, [
    snow, lgbtq, noAwb, noHcm, sort, climate, cost, priceMin, priceMax,
    lifestyle, healthcare, activities, selectedMapState,
  ]);

  // Filtering ~70 in-memory rows is sub-millisecond, so this recomputes
  // live on every change instead of debouncing a network request.
  const results = useMemo(
    () => filterAndSort(initialLocations, stateInfos, filterParams),
    [initialLocations, stateInfos, filterParams]
  );
  const total = results.length;

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

        {/* Filtering is already live (see `results` above); this button is
            kept for pixel/UX parity with the original design as a no-op. */}
        <button className="apply-filters" type="button">
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
