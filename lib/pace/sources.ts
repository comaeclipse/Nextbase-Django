import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { rucaPrimaryToScore } from "./ruca";
import type {
  PaceDerivedBundle,
  PaceDerivedUnit,
  PaceSourceMeta,
} from "./types";

export const PACE_SOURCES_DIR = path.join(
  process.cwd(),
  "data",
  "sources",
  "pace"
);

export const PACE_RAW_DIR = path.join(PACE_SOURCES_DIR, "raw");
export const PACE_DERIVED_DIR = path.join(PACE_SOURCES_DIR, "derived");
export const PACE_MANIFEST_PATH = path.join(PACE_SOURCES_DIR, "manifest.json");
export const PACE_DERIVED_BUNDLE_PATH = path.join(
  PACE_DERIVED_DIR,
  "pace_derived.json"
);

export interface PaceManifestFile {
  id: string;
  version: string;
  url: string;
  filename: string;
  sha256: string | null;
  notes?: string;
}

export interface PaceManifest {
  description: string;
  files: PaceManifestFile[];
}

export function loadManifest(): PaceManifest {
  return JSON.parse(readFileSync(PACE_MANIFEST_PATH, "utf-8")) as PaceManifest;
}

type CompactTract = [
  string,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
  string | null | undefined,
];

export function loadDerivedBundle(): PaceDerivedBundle {
  if (!existsSync(PACE_DERIVED_BUNDLE_PATH)) {
    throw new Error(
      `Missing derived pace bundle at ${PACE_DERIVED_BUNDLE_PATH}. ` +
        `Run scripts/prepare-pace-sources.ts first.`
    );
  }
  const raw = JSON.parse(
    readFileSync(PACE_DERIVED_BUNDLE_PATH, "utf-8")
  ) as PaceDerivedBundle & { place_compact?: CompactTract[] };

  if ((!raw.place || raw.place.length === 0) && raw.place_compact?.length) {
    raw.place = raw.place_compact.map((row) => ({
      geoid: String(row[0]),
      population: row[1],
      ruca_primary: row[2],
      ruca_score: null,
      density: row[3],
      ua_population: row[4],
      employment_density: row[5],
      walkability: row[6],
      ped_intersection_density: row[7],
      cbsa: row[8] != null && row[8] !== "" ? String(row[8]) : null,
    }));
    // Drop compact copy from the in-memory object after expand.
    delete raw.place_compact;
  }

  // Fill ruca_score from primary when missing (compact encoding omits it).
  for (const u of raw.place) {
    if (u.ruca_score == null && u.ruca_primary != null) {
      u.ruca_score = rucaPrimaryToScore(u.ruca_primary);
    }
  }
  for (const u of raw.cbsa) {
    if (u.ruca_score == null && u.ruca_primary != null) {
      u.ruca_score = rucaPrimaryToScore(u.ruca_primary);
    }
  }

  return raw;
}

export function indexDerivedUnits(
  units: PaceDerivedUnit[]
): Map<string, PaceDerivedUnit> {
  const map = new Map<string, PaceDerivedUnit>();
  for (const u of units) {
    map.set(String(u.geoid), u);
  }
  return map;
}

export function sourceMetaFromBundle(bundle: PaceDerivedBundle): PaceSourceMeta {
  return bundle.sources;
}
