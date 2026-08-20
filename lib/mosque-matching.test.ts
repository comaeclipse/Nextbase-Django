import { describe, expect, it } from "vitest";
import { classify, dedupe, namesCompatible, type MosqueRecord } from "./mosque-matching";

/*
 * Every case below is a real tagging pattern found in the 2026-08-20 US
 * Overpass extract, not a hypothetical. The counts in the PR description come
 * from these rules.
 */
describe("classify", () => {
  it("keeps the v1 rule as the highest-confidence match", () => {
    expect(classify({ amenity: "place_of_worship", religion: "muslim" })).toBe("amenity_religion");
  });

  it("admits a bare building=mosque, which v1 missed entirely", () => {
    // ~53 US elements are tagged this way with no amenity and no religion.
    expect(classify({ building: "mosque" })).toBe("building_mosque");
    expect(classify({ building: "mosque", name: "Dar Al-Qalam Islamic Center" })).toBe(
      "building_mosque"
    );
  });

  it("admits a place_of_worship with a mosque name but no religion tag", () => {
    expect(classify({ amenity: "place_of_worship", name: "Islamic Center of Oklahoma City" })).toBe(
      "named_place_of_worship"
    );
    expect(classify({ amenity: "place_of_worship", name: "Masjid Al-Noor" })).toBe(
      "named_place_of_worship"
    );
  });

  it("admits religion=muslim on a land parcel as the lowest-confidence match", () => {
    expect(classify({ landuse: "religious", religion: "muslim" })).toBe("religion_muslim_site");
  });

  it("rejects a place_of_worship whose religion is not muslim", () => {
    // A church on a landuse=religious parcel would otherwise slip through.
    expect(classify({ amenity: "place_of_worship", religion: "christian" })).toBeNull();
    expect(classify({ building: "mosque", religion: "christian" })).toBeNull();
  });

  it("rejects Muslim sites that are not mosques", () => {
    expect(classify({ amenity: "school", religion: "muslim" })).toBeNull();
    expect(classify({ landuse: "cemetery", religion: "muslim" })).toBeNull();
    expect(classify({ amenity: "grave_yard", religion: "muslim" })).toBeNull();
    expect(classify({ amenity: "library", religion: "muslim" })).toBeNull();
  });

  it("rejects Spanish place names that the mosque-name pattern would otherwise match", () => {
    // Mosquero NM, Mosqueda, Los Tres Mosqueteros -- all real false positives.
    expect(classify({ amenity: "place_of_worship", name: "Mosquero Creek Church" })).toBeNull();
    expect(classify({ amenity: "place_of_worship", name: "Mosqueda Community Center" })).toBeNull();
  });

  it("rejects an untagged or unrelated element", () => {
    expect(classify(undefined)).toBeNull();
    expect(classify({})).toBeNull();
    expect(classify({ amenity: "restaurant" })).toBeNull();
    expect(classify({ amenity: "place_of_worship", name: "First Baptist Church" })).toBeNull();
  });
});

function record(over: Partial<MosqueRecord> & Pick<MosqueRecord, "osm_id">): MosqueRecord {
  return {
    osm_type: "node",
    name: null,
    address: null,
    city: null,
    state: null,
    latitude: 42.3314,
    longitude: -83.0458,
    phone: null,
    website: null,
    source_url: "https://www.openstreetmap.org/node/1",
    match_rule: "amenity_religion",
    ...over,
  };
}

describe("namesCompatible", () => {
  it("treats an unnamed record as compatible with anything", () => {
    // The building footprint drawn around a named POI node is usually unnamed.
    expect(namesCompatible(null, "Masjid Al-Noor")).toBe(true);
    expect(namesCompatible("Masjid Al-Noor", null)).toBe(true);
  });

  it("ignores punctuation and case", () => {
    expect(namesCompatible("Masjid Al-Noor", "masjid al noor")).toBe(true);
  });

  it("accepts one name containing the other", () => {
    expect(namesCompatible("Adams Community Center", "Adams Community Center Mosque")).toBe(true);
  });

  it("rejects distinct mosques that merely share a block", () => {
    // Both pairs are real 2026-08-20 false merges at 60m and 85m.
    expect(namesCompatible("Shahjalal Masjid", "Gawsiah Jame Masjid")).toBe(false);
    expect(namesCompatible("Lansdale Mosque", "North Penn Mosque")).toBe(false);
    expect(namesCompatible("Baitul Jannah", "Darul Jannah")).toBe(false);
  });

  it("does not let a short generic name swallow a longer one", () => {
    expect(namesCompatible("Masjid", "Masjid Al-Noor")).toBe(false);
  });
});

describe("dedupe", () => {
  it("collapses a POI node and its own building footprint", () => {
    const { kept, merged } = dedupe([
      record({ osm_id: 1, match_rule: "amenity_religion", name: "Masjid A" }),
      // ~30m away: the building drawn around that node.
      record({ osm_id: 2, osm_type: "way", match_rule: "building_mosque", latitude: 42.33167 }),
    ]);
    expect(merged).toBe(1);
    expect(kept).toHaveLength(1);
    expect(kept[0].osm_id).toBe(1);
  });

  it("always keeps the v1 match, so no existing Neon row is ever orphaned", () => {
    // The building is the richer record, but the v1 rule still has to win:
    // import-mosques upserts on (osm_type, osm_id) and never deletes, so
    // swapping which element represents a mosque would leave both in the DB.
    const { kept } = dedupe([
      record({
        osm_id: 20,
        osm_type: "way",
        match_rule: "building_mosque",
        name: "Masjid B",
        city: "Dearborn",
        state: "MI",
        phone: "313-555-0100",
        website: "https://example.org",
      }),
      record({ osm_id: 10, match_rule: "amenity_religion" }),
    ]);
    expect(kept).toHaveLength(1);
    expect(kept[0].osm_id).toBe(10);
    expect(kept[0].match_rule).toBe("amenity_religion");
  });

  it("keeps two genuinely distinct mosques that are merely close", () => {
    // ~500m apart, which happens in Brooklyn and Dearborn.
    const { kept, merged } = dedupe([
      record({ osm_id: 1 }),
      record({ osm_id: 2, latitude: 42.3359 }),
    ]);
    expect(merged).toBe(0);
    expect(kept).toHaveLength(2);
  });

  it("keeps differently-named mosques inside the dedupe radius", () => {
    // ~60m apart. Distance alone would merge these; the names must not.
    const { kept, merged } = dedupe([
      record({ osm_id: 1, name: "Shahjalal Masjid" }),
      record({ osm_id: 2, name: "Gawsiah Jame Masjid", latitude: 42.33194 }),
    ]);
    expect(merged).toBe(0);
    expect(kept).toHaveLength(2);
  });

  it("is order-independent and deterministic", () => {
    const a = record({ osm_id: 1, match_rule: "building_mosque", osm_type: "way" });
    const b = record({ osm_id: 2, match_rule: "religion_muslim_site", latitude: 42.33165 });
    const c = record({ osm_id: 3, latitude: 40.7, longitude: -74 });

    const forward = dedupe([a, b, c]);
    const reverse = dedupe([c, b, a]);
    expect(forward.kept.map((r) => r.osm_id)).toEqual(reverse.kept.map((r) => r.osm_id));
    expect(forward.merged).toBe(reverse.merged);
    // Higher-confidence rule wins regardless of input order.
    expect(forward.kept.map((r) => r.osm_id).sort()).toEqual([1, 3]);
  });

  it("breaks a same-rule tie by richness, then type, then id", () => {
    const sparse = record({ osm_id: 5, match_rule: "building_mosque", osm_type: "way" });
    const rich = record({
      osm_id: 9,
      match_rule: "building_mosque",
      osm_type: "way",
      latitude: 42.33145,
      name: "Masjid C",
      city: "Detroit",
    });
    expect(dedupe([sparse, rich]).kept[0].osm_id).toBe(9);
  });
});
