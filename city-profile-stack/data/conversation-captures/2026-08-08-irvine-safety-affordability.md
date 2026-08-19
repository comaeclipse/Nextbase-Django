# Irvine safety and housing affordability: conversation research capture

**Status:** local R&D preservation record. This captures the substantive city
research from the collaborative session on 2026-08-08. It is not an imported
dataset, a scorecard, or a claim that every sentence below has the same
evidentiary strength.

## How to read this capture

- **Source-linked** means a URL was supplied in the discussion and can be
  rechecked.
- **Conversation-captured** means the research conclusion is preserved even
  where a reference number or a local observation was supplied without a full
  source URL.
- Claims only become `embedding_ready` in `research-ledger.json` after they
  have city scope, source URL, retrieval date, quoted or bounded support, and
  counterevidence where relevant.

## Safety analysis

Crime: 9/10 — very low. Irvine consistently sits among the safest large cities
in the country. Recent FBI-based reporting continues to show unusually low
violent crime for a city of its size. Crime is generally not a major
quality-of-life concern, especially compared with most large Southern
California cities.

**TCI of 23** (violent crime rate ~84/100k vs national 359.1/100k).

Source: [Center on Juvenile and Criminal Justice (CJCJ)](https://www.cjcj.org/reports-publications/fact-sheet/california-heads-for-record-low-crime-in-2025).

## Housing affordability analysis

### Cost of living

Cost of living: 2/10 for affordability. General living expenses are high, but
housing absolutely wrecks the equation.

- ERI estimate: Irvine about 46% above the U.S. average; broader Orange County
  estimates are even higher.
- Source: [ERI](https://www.erieri.com/cost-of-living/united-states/california/irvine).

### Median home prices

- Current Irvine median home sale price: **~$1.52 million**.
- Source: [Redfin — Irvine housing market](https://www.redfin.com/city/9361/CA/Irvine/housing-market).
- Cheaper pockets exist: ZIP 92606 median **~$967k**.
- Source: [Redfin — ZIP 92606](https://www.redfin.com/zipcode/92606/housing-market).

### Income threshold analysis

Assumptions: ~6.7% 30-yr mortgage, 20% down, ~1.1% property tax, HOA included.

| Property type | Price range | Monthly cost | Required household income |
| --- | --- | --- | --- |
| Condo/townhome | $900k–$1.0M | ~$6,200–$6,800/mo | $240k–$275k |
| Mid-range | $1.2M | ~$7,700–$8,300/mo | $300k–$330k |
| Median-ish home | $1.5M | ~$9,300–$10,000/mo | $370k–$400k |
| Family home | $1.7M+ | $10,500+/mo | $420k+ |

Mortgage rate source: [AP News](https://apnews.com/article/42d8262fb00b904fd7c2b906751610d7).

These aren't just "will a bank approve me" numbers — they represent being able
to save for retirement, maintain cars, have kids, eat out occasionally, and
absorb repairs.

- **Floor:** ~$250k household income for purchasing something plausible in
  Irvine.
- **Comfortable family home:** ~$350k–$400k household income.
- **20% down payment on median:** ~$305k before closing costs.

## Characterization for city-profile vectors

| Dimension | Value |
| --- | --- |
| Crime | very_low / 9.5-of-10 safety |
| COL | extremely_high |
| Housing affordability | extremely_low |
| Homeownership income threshold | ~$250k entry / ~$375k typical-family-home comfortable |

**Summary insight:** Irvine represents the "you get what you pay for" extreme —
clean, planned, safe, excellent amenities and jobs, but ordinary middle-class
homeownership is basically priced out.

## Next research uses

1. Track Redfin median over time to capture directional movement.
2. Verify whether the 92606 cheaper-pocket finding holds across multiple
   months or is a point-in-time anomaly.
3. Build income-threshold comparisons against other candidate cities to
   normalize the affordability vector.
4. Source neighborhood-level crime variation within Irvine if the citywide
   average obscures meaningful differences.
