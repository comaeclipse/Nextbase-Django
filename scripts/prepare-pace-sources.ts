/*
 * Download fixed RUCA 2020 + EPA SLD 2021 snapshots, verify checksums, and
 * build the derived pace bundle used by classify-pace.ts.
 *
 * Usage:
 *   node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/prepare-pace-sources.ts [--skip-download]
 *
 * Writes data/sources/pace/derived/pace_derived.json and updates sha256 values
 * in data/sources/pace/manifest.json when previously null.
 */
import { createHash } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parse } from "csv-parse";
import { aggregateUnits, type WeightedUnit } from "../lib/pace/aggregate";
import { placeCentroidKey } from "../lib/pace/geography";
import { prepareSeries } from "../lib/pace/normalize";
import {
  loadManifest,
  PACE_DERIVED_BUNDLE_PATH,
  PACE_DERIVED_DIR,
  PACE_MANIFEST_PATH,
  PACE_RAW_DIR,
  type PaceManifest,
} from "../lib/pace/sources";
import type {
  PaceDerivedBundle,
  PaceDerivedUnit,
  PacePercentileBreaks,
  PacePlaceCentroid,
} from "../lib/pace/types";
import { PACE_ALGORITHM_VERSION } from "../lib/pace/types";

const skipDownload = process.argv.includes("--skip-download");

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function downloadFile(url: string, dest: string): Promise<void> {
  console.log(`  ↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Download failed (${res.status}): ${url}`);
  }
  // Node fetch body → file via web streams / buffer fallback
  const file = createWriteStream(dest);
  const reader = res.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        await new Promise<void>((resolve, reject) => {
          file.write(Buffer.from(value), (err: Error | null | undefined) =>
            err ? reject(err) : resolve()
          );
        });
      }
    }
    await new Promise<void>((resolve, reject) => {
      file.end((err: Error | null | undefined) =>
        err ? reject(err) : resolve()
      );
    });
  } catch (err) {
    file.destroy();
    throw err;
  }
  console.log(`    saved ${dest}`);
}

function pad(n: string | number, len: number): string {
  return String(n).replace(/\D/g, "").padStart(len, "0").slice(-len);
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

interface TractRow {
  tract: string;
  cbsa: string | null;
  ua: string | null;
  population: number;
  density: number | null;
  ruca_primary: number | null;
  employment_density: number | null;
  walkability: number | null;
  ped_intersection_density: number | null;
  /** Urban-area total population (filled in a second pass). */
  ua_population: number | null;
}

async function loadRuca(filePath: string): Promise<{
  byTract: Map<string, { population: number; density: number | null; ruca: number | null; ua: string | null }>;
  uaPop: Map<string, number>;
}> {
  const byTract = new Map<
    string,
    { population: number; density: number | null; ruca: number | null; ua: string | null }
  >();
  const uaPop = new Map<string, number>();

  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true })
  );

  for await (const row of parser as AsyncIterable<Record<string, string>>) {
    const tract = pad(row.TractFIPS20 ?? row.tractfips20 ?? "", 11);
    if (tract.length !== 11) continue;
    const population = num(row.Population) ?? 0;
    const density = num(row.PopDensity);
    const ruca = num(row.PrimaryRUCA);
    const uaRaw = (row.UrbanAreaCode20 ?? "").trim();
    const ua = uaRaw && uaRaw !== "99999" && uaRaw !== "0" ? uaRaw : null;

    byTract.set(tract, { population, density, ruca, ua });
    if (ua && population > 0) {
      uaPop.set(ua, (uaPop.get(ua) ?? 0) + population);
    }
  }

  console.log(`  RUCA tracts: ${byTract.size}, urban areas: ${uaPop.size}`);
  return { byTract, uaPop };
}

async function loadSld(filePath: string): Promise<{
  /** tract → pop-weighted BG metrics accumulator */
  byTract: Map<
    string,
    {
      pop: number;
      empNum: number;
      empDen: number;
      walkNum: number;
      walkDen: number;
      pedNum: number;
      pedDen: number;
      cbsaVotes: Map<string, number>;
    }
  >;
}> {
  const byTract = new Map<
    string,
    {
      pop: number;
      empNum: number;
      empDen: number;
      walkNum: number;
      walkDen: number;
      pedNum: number;
      pedDen: number;
      cbsaVotes: Map<string, number>;
    }
  >();

  let rows = 0;
  const parser = createReadStream(filePath).pipe(
    parse({ columns: true, skip_empty_lines: true, relax_column_count: true })
  );

  for await (const row of parser as AsyncIterable<Record<string, string>>) {
    rows++;
    const state = pad(row.STATEFP ?? "", 2);
    const county = pad(row.COUNTYFP ?? "", 3);
    const tractce = pad(row.TRACTCE ?? "", 6);
    if (state.length !== 2 || county.length !== 3 || tractce.length !== 6) continue;
    const tract = `${state}${county}${tractce}`;

    const pop = num(row.TotPop) ?? 0;
    const emp = num(row.D1C ?? row.D1c);
    const walk = num(row.NatWalkInd);
    const ped = num(row.D3BPO4 ?? row.D3bpo4);
    const cbsaRaw = (row.CBSA ?? "").trim();
    const cbsa =
      cbsaRaw && cbsaRaw !== "99999" && cbsaRaw !== "N/A" && cbsaRaw !== "0"
        ? pad(cbsaRaw, 5)
        : null;

    let acc = byTract.get(tract);
    if (!acc) {
      acc = {
        pop: 0,
        empNum: 0,
        empDen: 0,
        walkNum: 0,
        walkDen: 0,
        pedNum: 0,
        pedDen: 0,
        cbsaVotes: new Map(),
      };
      byTract.set(tract, acc);
    }
    const w = pop > 0 ? pop : 1;
    acc.pop += pop;
    if (emp != null) {
      acc.empNum += emp * w;
      acc.empDen += w;
    }
    if (walk != null) {
      acc.walkNum += walk * w;
      acc.walkDen += w;
    }
    if (ped != null) {
      acc.pedNum += ped * w;
      acc.pedDen += w;
    }
    if (cbsa) {
      acc.cbsaVotes.set(cbsa, (acc.cbsaVotes.get(cbsa) ?? 0) + w);
    }

    if (rows % 50_000 === 0) console.log(`  … SLD rows ${rows}`);
  }

  console.log(`  SLD block groups rolled to ${byTract.size} tracts (${rows} rows)`);
  return { byTract };
}

function dominantCbsa(votes: Map<string, number>): string | null {
  let best: string | null = null;
  let bestW = -1;
  for (const [k, w] of votes) {
    if (w > bestW) {
      best = k;
      bestW = w;
    }
  }
  return best;
}

function mergeTracts(
  ruca: Awaited<ReturnType<typeof loadRuca>>,
  sld: Awaited<ReturnType<typeof loadSld>>
): TractRow[] {
  const tracts = new Set([...ruca.byTract.keys(), ...sld.byTract.keys()]);
  const out: TractRow[] = [];

  for (const tract of tracts) {
    const r = ruca.byTract.get(tract);
    const s = sld.byTract.get(tract);
    const population = r?.population ?? s?.pop ?? 0;
    const cbsa = s ? dominantCbsa(s.cbsaVotes) : null;
    const ua = r?.ua ?? null;
    out.push({
      tract,
      cbsa,
      ua,
      population,
      density: r?.density ?? null,
      ruca_primary: r?.ruca ?? null,
      employment_density: s && s.empDen > 0 ? s.empNum / s.empDen : null,
      walkability: s && s.walkDen > 0 ? s.walkNum / s.walkDen : null,
      ped_intersection_density: s && s.pedDen > 0 ? s.pedNum / s.pedDen : null,
      ua_population: ua ? ruca.uaPop.get(ua) ?? null : null,
    });
  }
  return out;
}

function toWeighted(t: TractRow): WeightedUnit {
  return {
    population: t.population,
    ruca_primary: t.ruca_primary,
    density: t.density,
    ua_population: t.ua_population,
    employment_density: t.employment_density,
    walkability: t.walkability,
    ped_intersection_density: t.ped_intersection_density,
  };
}

function aggregateGroup(
  geoid: string,
  rows: TractRow[],
  name?: string | null
): PaceDerivedUnit {
  const metrics = aggregateUnits(rows.map(toWeighted));
  return { geoid, name: name ?? null, ...metrics };
}

function buildPercentiles(tracts: TractRow[]): PacePercentileBreaks {
  const density = prepareSeries(
    tracts.map((t) => t.density).filter((v): v is number => v != null && v >= 0),
    true
  );
  const ua = prepareSeries(
    tracts
      .map((t) => t.ua_population)
      .filter((v): v is number => v != null && v >= 0),
    true
  );
  const emp = prepareSeries(
    tracts
      .map((t) => t.employment_density)
      .filter((v): v is number => v != null && v >= 0),
    true
  );
  const walk = prepareSeries(
    tracts
      .map((t) => t.walkability)
      .filter((v): v is number => v != null && v >= 0),
    false
  );
  const ped = prepareSeries(
    tracts
      .map((t) => t.ped_intersection_density)
      .filter((v): v is number => v != null && v >= 0),
    true
  );

  // Store a thinned empirical distribution to keep the bundle small (~percentiles).
  const thin = (sorted: number[], maxPoints = 2000): number[] => {
    if (sorted.length <= maxPoints) return sorted;
    const out: number[] = [];
    for (let i = 0; i < maxPoints; i++) {
      const idx = Math.round((i / (maxPoints - 1)) * (sorted.length - 1));
      out.push(sorted[idx]);
    }
    return out;
  };

  return {
    density: thin(density.sorted),
    ua_population: thin(ua.sorted),
    employment_density: thin(emp.sorted),
    walkability: thin(walk.sorted),
    ped_intersection_density: thin(ped.sorted),
    winsor: {
      density: density.bounds,
      ua_population: ua.bounds,
      employment_density: emp.bounds,
      walkability: walk.bounds,
      ped_intersection_density: ped.bounds,
    },
  };
}

function groupBy<T>(items: T[], key: (t: T) => string | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

async function ensureSources(manifest: PaceManifest): Promise<{
  versions: Record<string, string>;
  checksums: Record<string, string>;
  paths: Record<string, string>;
}> {
  mkdirSync(PACE_RAW_DIR, { recursive: true });
  const versions: Record<string, string> = {};
  const checksums: Record<string, string> = {};
  const paths: Record<string, string> = {};
  let manifestDirty = false;

  for (const file of manifest.files) {
    const dest = path.join(PACE_RAW_DIR, file.filename);
    paths[file.id] = dest;
    versions[file.id] = file.version;

    if (!existsSync(dest)) {
      if (skipDownload) {
        throw new Error(`Missing ${dest} and --skip-download was set`);
      }
      await downloadFile(file.url, dest);
    } else {
      console.log(`  . using cached ${file.filename}`);
    }

    const digest = await sha256File(dest);
    checksums[file.id] = digest;
    if (!file.sha256) {
      file.sha256 = digest;
      manifestDirty = true;
      console.log(`  * recorded sha256 for ${file.id}`);
    } else if (file.sha256 !== digest) {
      throw new Error(
        `Checksum mismatch for ${file.id}: expected ${file.sha256}, got ${digest}`
      );
    } else {
      console.log(`  ✓ checksum ok ${file.id}`);
    }
  }

  if (manifestDirty) {
    writeFileSync(PACE_MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
    console.log("  updated manifest.json with checksums");
  }

  return { versions, checksums, paths };
}

function loadPlaceCentroids(zipPath: string): Record<string, PacePlaceCentroid> {
  const extractDir = path.join(PACE_RAW_DIR, "gaz_place");
  mkdirSync(extractDir, { recursive: true });

  // Prefer PowerShell Expand-Archive on Windows; fall back to tar (Windows 10+).
  try {
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: "pipe" }
    );
  } catch {
    execFileSync("tar", ["-xf", zipPath, "-C", extractDir], { stdio: "pipe" });
  }

  const txt = readdirSync(extractDir).find((f) => f.endsWith(".txt"));
  if (!txt) throw new Error(`No .txt found after extracting ${zipPath}`);

  const text = readFileSync(path.join(extractDir, txt), "utf-8").replace(
    /^\uFEFF/,
    ""
  );
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = lines[0].split("\t").map((h) => h.trim());
  const idx = (...names: string[]) => {
    for (const name of names) {
      const i = header.indexOf(name);
      if (i >= 0) return i;
    }
    return -1;
  };

  const iUsps = idx("USPS");
  const iGeoid = idx("GEOID");
  const iName = idx("NAME");
  const iLat = idx("INTPTLAT");
  const iLon = idx("INTPTLONG", "INTPTLON");
  if ([iUsps, iGeoid, iName, iLat, iLon].some((i) => i < 0)) {
    throw new Error(`Unexpected gazetteer header: ${header.join(",")}`);
  }

  const out: Record<string, PacePlaceCentroid> = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    const state = (cols[iUsps] ?? "").trim().toUpperCase();
    const geoid = (cols[iGeoid] ?? "").trim();
    let name = (cols[iName] ?? "").trim();
    // Strip legal/statistical suffixes: "Paterson city", "King of Prussia CDP"
    name = name
      .replace(
        /\s+(city|town|village|borough|CDP|municipality|corporation|urban\s+county)$/i,
        ""
      )
      .trim();
    const lat = Number(cols[iLat]);
    const lon = Number(cols[iLon]);
    if (!state || !geoid || !name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      continue;
    }
    const key = placeCentroidKey(name, state);
    // Prefer the first (usually incorporated) when duplicates share a key.
    if (!out[key]) {
      out[key] = { geoid, name, state, lat, lon };
    }
  }
  console.log(`  place centroids: ${Object.keys(out).length}`);
  return out;
}

async function main() {
  console.log("Preparing pace source extracts\n");
  const manifest = loadManifest();
  const { versions, checksums, paths } = await ensureSources(manifest);

  console.log("\nLoading RUCA…");
  const ruca = await loadRuca(paths.ruca_2020_tracts);

  console.log("\nLoading EPA SLD (this may take a few minutes)…");
  const sld = await loadSld(paths.epa_sld_v3_2021);

  console.log("\nMerging tracts…");
  const tracts = mergeTracts(ruca, sld);
  console.log(`  merged tracts: ${tracts.length}`);

  console.log("\nBuilding national percentiles…");
  const percentiles = buildPercentiles(tracts);

  console.log("\nAggregating CBSAs…");
  const cbsaGroups = groupBy(tracts, (t) => t.cbsa);
  const cbsa: PaceDerivedUnit[] = [];
  for (const [geoid, rows] of cbsaGroups) {
    cbsa.push(aggregateGroup(geoid, rows));
  }
  cbsa.sort((a, b) => a.geoid.localeCompare(b.geoid));
  console.log(`  CBSAs: ${cbsa.length}`);

  // Tract-keyed units for place-scope fallback (geocoder place → tract).
  // Compact encoding keeps the committed bundle smaller.
  console.log("\nBuilding tract units (place-scope fallback)…");
  const placeTracts = tracts.filter((t) => t.population > 0);
  console.log(`  tract units: ${placeTracts.length}`);

  console.log("\nLoading place gazetteer centroids…");
  const place_centroids = loadPlaceCentroids(paths.census_gaz_place_2024);

  console.log("\nBuilding county → CBSA map…");
  const countyVotes = new Map<string, Map<string, number>>();
  for (const t of tracts) {
    if (!t.cbsa || t.population <= 0) continue;
    const county = t.tract.slice(0, 5);
    let votes = countyVotes.get(county);
    if (!votes) {
      votes = new Map();
      countyVotes.set(county, votes);
    }
    votes.set(t.cbsa, (votes.get(t.cbsa) ?? 0) + t.population);
  }
  const county_cbsa: Record<string, string> = {};
  for (const [county, votes] of countyVotes) {
    let best: string | null = null;
    let bestW = -1;
    for (const [cbsa, w] of votes) {
      if (w > bestW) {
        best = cbsa;
        bestW = w;
      }
    }
    if (best) county_cbsa[county] = best;
  }
  console.log(`  counties with CBSA: ${Object.keys(county_cbsa).length}`);

  mkdirSync(PACE_DERIVED_DIR, { recursive: true });

  // Compact tract rows: [geoid, pop, ruca, density, uaPop, emp, walk, ped, cbsa]
  const placeCompact = placeTracts
    .sort((a, b) => a.tract.localeCompare(b.tract))
    .map((t) => [
      t.tract,
      t.population,
      t.ruca_primary,
      t.density,
      t.ua_population,
      t.employment_density,
      t.walkability,
      t.ped_intersection_density,
      t.cbsa,
    ]);

  const bundle: PaceDerivedBundle & { place_compact?: unknown } = {
    generated_at: new Date().toISOString(),
    algorithm_version: PACE_ALGORITHM_VERSION,
    sources: { versions, checksums },
    percentiles,
    cbsa,
    place: [], // expanded at load time from place_compact
    place_compact: placeCompact,
    place_centroids,
    county_cbsa,
  };

  writeFileSync(PACE_DERIVED_BUNDLE_PATH, JSON.stringify(bundle));
  const sizeMb = (
    Buffer.byteLength(JSON.stringify(bundle)) /
    (1024 * 1024)
  ).toFixed(1);
  console.log(`\nWrote ${PACE_DERIVED_BUNDLE_PATH} (~${sizeMb} MB)`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
