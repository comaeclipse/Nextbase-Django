export type HousingMarketSnapshot = {
  asOf: string;
  typicalHomeValue: number;
  yearOverYearChangePercent: number;
  daysToPending: number;
  medianSalePrice: number;
  medianListPrice: number;
  inventory: number;
  belowListPercent: number;
  sourceUrl: string;
  sourceLabel: string;
  summary: string;
  caveat: string;
};

/**
 * Curated city-level market snapshots. Values are deliberately separate from
 * locations_location.avg_home_value: Zillow's ZHVI is a time-stamped typical
 * home value, while that legacy column has historically mixed source vintages.
 */
const HOUSING_MARKETS: Record<string, HousingMarketSnapshot> = {
  "Gilbert|AZ": {
    asOf: "June 30, 2026",
    typicalHomeValue: 572_453,
    yearOverYearChangePercent: -0.8,
    daysToPending: 23,
    medianSalePrice: 569_000,
    medianListPrice: 618_291,
    inventory: 1_149,
    belowListPercent: 61.2,
    sourceUrl: "https://www.zillow.com/home-values/4888/gilbert-az/",
    sourceLabel: "Zillow Housing Market",
    summary:
      "Gilbert is in mild post-pandemic normalization: the typical home value is down slightly year over year, and most recent sales closed below list. Values remain historically elevated, so this is more buyer-friendly than 2021–22 rather than low-cost.",
    caveat:
      "Typical home value is Zillow's ZHVI, not the median sale price. Inventory and list-to-sale measures use the dated local market snapshot shown below.",
  },
};

export function getHousingMarket(name: string, state: string) {
  return HOUSING_MARKETS[`${name}|${state}`] ?? null;
}
