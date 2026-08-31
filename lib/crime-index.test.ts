import { describe, it, expect } from "vitest";
import {
  NATIONAL_CRIME_REFERENCE,
  NATIONAL_CRIME_REFERENCE_BY_YEAR,
  VIOLENT_WEIGHT,
  PROPERTY_WEIGHT,
  crimeLabelFromTci,
  ratePer100k,
  ratesFromCounts,
  referenceForYear,
  totalCrimeIndex,
  totalCrimeIndexBreakdown,
  type CrimeReference,
} from "./crime-index";

// A fixed, round reference so the arithmetic in these tests is obvious and does
// not shift when the real FBI national rates are updated.
const REF: CrimeReference = {
  year: 2023,
  violentRatePer100k: 400,
  propertyRatePer100k: 2000,
  source: "test fixture",
};

describe("weights are a valid convex combination", () => {
  it("violent and property weights sum to 1", () => {
    expect(VIOLENT_WEIGHT + PROPERTY_WEIGHT).toBeCloseTo(1, 10);
  });
});

describe("ratePer100k", () => {
  it("computes a per-100k rate", () => {
    expect(ratePer100k(400, 100_000)).toBe(400);
    expect(ratePer100k(85, 85_000)).toBeCloseTo(100, 10);
  });
  it("rejects non-positive population and negative counts", () => {
    expect(() => ratePer100k(10, 0)).toThrow();
    expect(() => ratePer100k(-1, 100)).toThrow();
  });
});

describe("totalCrimeIndex", () => {
  it("a city exactly at the national rate on both scores is 100", () => {
    const tci = totalCrimeIndex(
      { violentRatePer100k: 400, propertyRatePer100k: 2000 },
      REF,
    );
    expect(tci).toBe(100);
  });

  it("half the national rate on both scores is 50 (safe)", () => {
    const b = totalCrimeIndexBreakdown(
      { violentRatePer100k: 200, propertyRatePer100k: 1000 },
      REF,
    );
    expect(b.tci).toBe(50);
    expect(b.label).toBe("Low");
    expect(b.violentIndex).toBe(50);
    expect(b.propertyIndex).toBe(50);
  });

  it("equal weighting keeps violence from being drowned out by property crime", () => {
    // Twice national violence, national property → 0.5*200 + 0.5*100 = 150.
    const b = totalCrimeIndexBreakdown(
      { violentRatePer100k: 800, propertyRatePer100k: 2000 },
      REF,
    );
    expect(b.violentIndex).toBe(200);
    expect(b.propertyIndex).toBe(100);
    expect(b.tci).toBe(150);
    expect(b.label).toBe("High");
  });

  it("accepts FBI counts via ratesFromCounts", () => {
    // 340 violent + 1700 property over 85k people = national rate on both → 100.
    const rates = ratesFromCounts({ violentCount: 340, propertyCount: 1700, population: 85_000 });
    expect(totalCrimeIndex(rates, REF)).toBe(100);
  });

  it("carries the reference year through", () => {
    const b = totalCrimeIndexBreakdown({ violentRatePer100k: 400, propertyRatePer100k: 2000 }, REF);
    expect(b.referenceYear).toBe(2023);
  });

  it("rejects negative rates", () => {
    expect(() => totalCrimeIndex({ violentRatePer100k: -1, propertyRatePer100k: 10 }, REF)).toThrow();
  });
});

describe("crimeLabelFromTci thresholds", () => {
  it("Low below 75, High at/above 150, Moderate between", () => {
    expect(crimeLabelFromTci(0)).toBe("Low");
    expect(crimeLabelFromTci(74)).toBe("Low");
    expect(crimeLabelFromTci(75)).toBe("Moderate");
    expect(crimeLabelFromTci(100)).toBe("Moderate");
    expect(crimeLabelFromTci(149)).toBe("Moderate");
    expect(crimeLabelFromTci(150)).toBe("High");
    expect(crimeLabelFromTci(500)).toBe("High");
  });
});

describe("shipped national reference", () => {
  it("is a plausible FBI year with positive rates and property > violent", () => {
    expect(NATIONAL_CRIME_REFERENCE.year).toBeGreaterThanOrEqual(2022);
    expect(NATIONAL_CRIME_REFERENCE.violentRatePer100k).toBeGreaterThan(0);
    expect(NATIONAL_CRIME_REFERENCE.propertyRatePer100k).toBeGreaterThan(NATIONAL_CRIME_REFERENCE.violentRatePer100k);
    expect(NATIONAL_CRIME_REFERENCE.source).toMatch(/FBI/);
  });

  it("default reference is the entry in the by-year map, and every stored year is self-consistent", () => {
    expect(NATIONAL_CRIME_REFERENCE).toBe(NATIONAL_CRIME_REFERENCE_BY_YEAR[NATIONAL_CRIME_REFERENCE.year]);
    for (const [year, ref] of Object.entries(NATIONAL_CRIME_REFERENCE_BY_YEAR)) {
      expect(ref.year).toBe(Number(year));
      expect(ref.propertyRatePer100k).toBeGreaterThan(ref.violentRatePer100k);
      expect(ref.source).toMatch(/FBI/);
    }
  });
});

describe("referenceForYear", () => {
  it("returns a stored year and rejects an unknown one with guidance", () => {
    expect(referenceForYear(2023).violentRatePer100k).toBe(363.8);
    expect(() => referenceForYear(1999)).toThrow(/No national reference for FBI year 1999/);
  });
});
