# Charleston, South Carolina — Nanogenre Classification Proposal v1

Ninth genre-classification proposal produced through the PROMPT_TEMPLATE.md Block 4
process (after Victorville, Gilbert, Odessa, Cheyenne, North Platte, Grand Junction,
Savannah and Mobile). Delivered in the same research pass as the
`reddit_sentiment_2026` dossier (`charleston-sc.md`); this companion carries the
official/structural evidence and the measured-vs-experienced reconciliation that
Blocks 1–3 deliberately exclude.

Charleston is the **tenth classified city** (Casper prototype included), which
triggers the taxonomy's batch-of-10 review, and it was the flagged genre-neighbor test
for the Savannah+Mobile coastal-port bundle. The test succeeded: Charleston's labels
carry the bundle's core vocabulary as a third independent city.

### Executive classification

| Level                  | Assignment                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| **Broad genres**       | Historic Coastal Regional Hub · Tourism-Pressured Lifestyle City · Growing Sunbelt Coastal Metro |
| **Primary microgenre** | **Historic Coastal Regional Hub Under Tourism-and-Growth Pressure**   |
| Secondary microgenre   | Amenity-Rich Coastal Lifestyle City With Local-Wage Mismatch          |
| Secondary microgenre   | Walkable-Core Car-Dependent Coastal Metro                             |
| **Primary nanogenre**  | **Polished Historic Coastal Hub With Beach Access, Medical Depth, and Growth Friction** (high confidence) |
| Secondary nanogenre    | Tourism-Pressured Coastal Lifestyle City With Local-Wage Housing Mismatch (high confidence) |
| Secondary nanogenre    | Walkable-Core Car-Dependent Historic Port City (high confidence)      |
| Secondary nanogenre    | Water-Rich Summer-Limited Coastal City With Chronic Flood Adaptation (high confidence) |

**In one sentence:** Charleston is a highly distinctive historic coastal hub whose
unusually deep food, medical, airport and water-access amenities increasingly collide
with tourism, housing costs, summer climate, flood adaptation and transportation
constraints.

All labels are **proposals, not admissions** — per NANOGENRE_TAXONOMY.md §3 / §12
decision 1, a nanogenre needs 2 independently-researched cities before entering
`genre-ontology.ts` (3 for micro, 5 for broad).

**Recurrence notes — and the batch-of-10 review agenda:**

1. **The coastal walkable-core/car-dependent bundle reaches THREE cities — the micro
   floor is met, and both caps are tripped.** Savannah, Mobile and now Charleston all
   carry the walkable-historic-core + car-dependent-outer + humid-coastal-port
   vocabulary at nano level (Charleston: "Walkable-Core Car-Dependent Historic Port
   City"; micro-secondary "Walkable-Core Car-Dependent Coastal Metro"). Three
   independently researched cities exceed the nano floor (2) and meet the micro floor
   (3). But 3 of 10 classified cities is 30% prevalence — above the 15% nano cap and
   the 25% micro cap — for the same reason the interior service-hub family tripped its
   cap: the last three cities were deliberately correlated picks (we chased the
   coastal recurrence to test it). **The batch-of-10 review should treat both
   families' prevalence numbers as selection-bias artifacts of a tiny deliberately
   steered corpus**, and either defer cap enforcement until the corpus is larger or
   compute prevalence against a selection-adjusted denominator.
2. **The three cities are not copies — the "discovery gradient" hypothesis.** Block
   4's comparative note (preserved below) proposes Charleston = polished/
   high-institution/high-pressure, Savannah = artsier/socially looser/increasingly
   discovered, Mobile = less-discovered/lower-tourism-pressure. The features support
   a gradient, not duplication: tourism_pressure 0.91 (Charleston) / 0.88 (Savannah) /
   unscored-but-visibly-lower (Mobile); housing_affordability 0.18 / 0.48 / 0.67;
   specialist healthcare 0.86 / 0.52 / abstained. This argues the shared structure is
   one family whose members differ along position/intensity dimensions
   (discovery/pressure stage), not three separate genres — a modeling question for the
   reviewer: family + stage traits, or three sibling nanogenres?
3. **The wage-housing squeeze reaches EIGHT of ten cities**, with Charleston the
   sharpest yet (local_wage_adequacy 0.24, housing_affordability 0.18). The
   trait-not-genre assessment is settled fact at this corpus size; Charleston is its
   price-side extreme while Mobile is its wage-side extreme.
4. **The healthcare capacity-vs-navigability family reaches FOUR cities** (North
   Platte, Grand Junction, Savannah, Charleston) and Charleston is its sharpest
   expression: specialist_healthcare_access 0.86 against healthcare_navigability
   0.35, with MUSC's own wait times the subject of a dedicated thread. Meanwhile the
   all-sources-agree navigability prediction (0.36 vs measured 0.35) confirmed for
   the third consecutive pass — navigability friction generalizes across the corpus
   even though institutional capacity is lumpy and unpredictable.
5. **Charleston inverts the low-commute family.** Five interior cities established
   low-commute-vs-car-dependence; Charleston is the corpus's first
   high-commute-burden metro (0.78, falsifying the 0.48 prediction) — and the shape
   is corridor fragility (moderate 24.2-minute average, severe bridge-corridor tail
   risk), the metro-scale version of the chokepoint pattern seen at Cajon Pass and
   the Bayway. The family now has a verified boundary on both sides.
6. **Falsification: 4 of 33** (trend: 11/31 → 7/27 → 7/35 → 5/37 → 3/34 → 5/39 →
   7/38 → 2/27 → 4/33). Humidity remains the stubborn residue but its prediction is
   converging (0.33 → 0.41 → 0.48 across the humid-coastal passes); tourism's error
   is shrinking; the genuinely new misses are the lumpy institutional fact
   (MUSC/VA tertiary depth) and the commute inversion.
7. **Interior service-hub prevalence falls to 5 of 10 (50%).** Still above the 40%
   cap; see note 1 for the interpretation.
8. **VA cross-check clean again**: the Ralph H. Johnson VAMC is a 1A 155-bed tertiary
   teaching hospital in Charleston, and the app's own VA data for location 160 agrees
   (nearest_va_kind = hospital).

## Reconciliation: measured vs. experienced

### 1. Is Charleston simply expensive, or specifically expensive relative to the people who work there?

- **Measured:** Census QuickFacts reports a 2020-2024 median owner-occupied home value
  of $509,700, median gross rent of $1,722 and median household income of $92,414. BLS
  reports a May 2025 metro mean wage of $30.89 per hour versus $33.54 nationally; food
  preparation and serving accounts for 11.5% of local employment and averages $15.85
  per hour.
  ([Census QuickFacts](https://www.census.gov/quickfacts/fact/table/charlestoncitysouthcarolina/INC110223),
  [BLS Charleston OEWS](https://www.bls.gov/regions/southeast/news-release/occupationalemploymentandwages_charleston.htm))
- **Experienced:** Residents repeatedly describe the central problem as local salaries
  failing to catch up with housing costs, including nurses and moderate-income workers
  rather than only downtown luxury buyers.
  ([Reddit](https://www.reddit.com/r/Charleston/comments/15of5hw/))
- **Resulting trait:** High-amenity coastal housing market with a pronounced
  local-wage affordability mismatch.

### 2. Is traffic genuinely severe if the average commute is only moderate?

- **Measured:** Census QuickFacts gives Charleston city workers a mean commute of 24.2
  minutes for 2020-2024, which by itself does not look extreme.
  ([Census QuickFacts](https://www.census.gov/quickfacts/fact/table/charlestoncitysouthcarolina/POP715224))
- **Experienced:** Residents describe severe bad-day variability on bridge and
  interstate corridors and routinely advise movers to choose housing around workplace
  location. ([Reddit](https://www.reddit.com/r/Charleston/comments/1m8hv04/))
- **Resulting trait:** Moderate average commute with high corridor-specific tail risk:
  transportation pain is more about bottleneck unpredictability than universally long
  distance.

### 3. Does Charleston have good healthcare if residents complain about getting appointments?

- **Measured:** MUSC operates the Lowcountry's ACS-verified Level I trauma center
  ("the only ACS Level 1 verified Trauma Center in the Lowcountry"). The Ralph H.
  Johnson VA system describes its Charleston facility as a 1A 155-bed tertiary
  teaching hospital serving 85,000 veterans across a 22-county South Carolina/Georgia
  coastal region.
  ([MUSC](https://medicine.musc.edu/departments/surgery/divisions/acute-care-trauma-burn/trauma-center),
  [VA Charleston](https://www.va.gov/charleston-health-care/about-us/))
- **Experienced:** Residents comparing Charleston with Savannah often identify
  healthcare depth as a Charleston advantage, while local primary-care threads
  describe waits of several months and difficult new-patient scheduling.
  ([Reddit](https://www.reddit.com/r/savannah/comments/1cyiyp0/savannah_vs_charleston/),
  [Reddit](https://www.reddit.com/r/Charleston/comments/1osldh0/))
- **Resulting trait:** High specialist and tertiary-care capacity paired with mediocre
  routine-care navigability; institutional depth and appointment accessibility
  diverge.

### 4. Is Charleston's flood reputation mostly hurricane anxiety?

- **Measured:** The City Water Plan is explicitly designed around tides, sea-level
  rise, stormwater, storm surge and groundwater. The city's flood strategy says
  Charleston "is experiencing flooding more frequently than ever" and cites 13 inches
  of sea-level rise in the past 100 years (NOAA tide-gauge data), with roughly half of
  that in the last 20 years.
  ([Charleston Water Plan](https://www.charleston-sc.gov/2818/Charleston-Water-Plan-Comprehensive-Inte),
  [Flooding & Sea Level Rise Strategy](https://charleston-sc.gov/1981/Flooding-Sea-Level-Rise-Strategy))
- **Experienced:** Residents discuss ordinary high-tide and heavy-rain flooding
  separately from hurricanes and repeatedly emphasize that exposure changes block by
  block. ([Reddit](https://www.reddit.com/r/Charleston/comments/166a6qx/))
- **Resulting trait:** Water is simultaneously a core amenity and a routine planning
  constraint; flood adaptation is structural to Charleston's identity rather than an
  occasional disaster overlay.

### 5. Is the perception of rapid growth supported by measured change?

- **Measured:** Census estimates Charleston city's population at 159,423 in 2025, up
  5.8% from its 2020 estimates base; the 2020 Census counted 150,227 residents versus
  120,083 in 2010. Charleston County reached an estimated 436,200 in 2025, 6.8% above
  its 2020 base.
  ([Census QuickFacts](https://www.census.gov/quickfacts/fact/table/charlestoncountysouthcarolina,charlestoncitysouthcarolina/PST045225))
- **Experienced:** Long-term residents frequently connect growth with traffic, housing
  costs, crowded beaches and a more commercialized version of Charleston, although a
  minority explicitly disputes the idea that the city has substantially deteriorated.
  ([Reddit](https://www.reddit.com/r/Charleston/comments/1qzab7a/is_there_anywhere_in_us_like_old_school_charleston/))
- **Resulting trait:** Objectively fast-growing metro with contested cultural
  interpretation: growth is real, while whether it constitutes decline is a
  lived-experience disagreement.

### 6. Is Charleston's visitor-city character large enough to shape the economy?

- **Measured:** Census QuickFacts reports roughly $1.55 billion in accommodation and
  food-services sales inside Charleston city in 2022 and about $3.29 billion across
  Charleston County.
  ([Census QuickFacts](https://www.census.gov/quickfacts/fact/table/charlestoncountysouthcarolina,charlestoncitysouthcarolina/PST045225))
- **Experienced:** Residents repeatedly complain that tourism shapes congestion,
  downtown rhythms and the city's increasingly polished destination aesthetic.
  ([Reddit](https://www.reddit.com/r/SameGrassButGreener/comments/1co96a3/so_hows_charleston_sc/))
- **Resulting trait:** Tourism pressure is both structurally large and experientially
  visible; it is not merely a perception generated by living near a few attractions.

### 7. Does a city this size have unusually strong external access?

- **Measured:** Charleston International handled 6,341,145 arriving and departing
  passengers in calendar 2025 (3,167,903 deplaned + 3,173,242 enplaned in the airport's
  December 2025 operations summary). Its current nonstop network spans 50+ destinations
  including Seattle (daily, Alaska), seasonal Toronto (Air Canada) and less-than-daily
  Cancún (Breeze); the airport is about 12 miles from downtown.
  ([CHS nonstops](https://iflychs.com/nonstopdestinations/),
  [CHS ops summary](https://iflychs.com/wp-content/uploads/2026/01/Ops-Summary-DEC2025_508.pdf))
- **Experienced:** Air access is not a major complaint in the relocation discourse,
  which itself contrasts with the intense discussion of road congestion and housing.
- **Resulting trait:** Strong air connectivity for a midsize coastal city exists
  alongside weak everyday non-car mobility — a notable access split rather than a
  uniformly accessible transportation system.

## The three-city hypothesis (preserved from the research pass)

The most interesting three-city juxtaposition is not that Charleston, Savannah and
Mobile are all old humid coastal Southern ports; that is merely a trait bundle.
Community comparisons instead suggest three different stages or expressions of the
same underlying urban type. Charleston appears the most polished, institutionally deep
and economically "discovered" version: stronger tertiary healthcare, substantial air
access, intense tourism, high housing pressure and a historic core increasingly
treated as premium real estate. Savannah is repeatedly cast as the looser sibling —
stronger public-square and arts identity, later and less buttoned-up nightlife,
historically cheaper housing, but increasingly experiencing its own tourism and growth
pressure. A 2026 Savannah-to-Mobile thread in r/MobileAL explicitly describes Mobile
and Savannah as similar while saying Mobile has not yet been "discovered" to the same
degree; an older Mobile discussion asks why the city never achieved
Charleston/Savannah's tourism profile and repeatedly points to differences in
preservation, investment and destination-building. That makes Mobile especially
interesting as a possible less-commercialized control case: not simply "cheaper
Charleston," but a historic coastal port where the tourism/preservation/gentrification
machine developed differently. The hypothesis worth testing with independent dossiers
is therefore Charleston = polished/high-institution/high-pressure, Savannah =
artsier/socially looser but increasingly discovered, and Mobile =
less-discovered/lower-tourism-pressure counterpart — not three interchangeable
versions of Southern charm.
([Reddit](https://www.reddit.com/r/savannah/comments/1cyiyp0/savannah_vs_charleston/),
[Reddit](https://www.reddit.com/r/MobileAL/comments/1rd3w0q/worth_it/))

*Note: all three cities now have independent dossiers — the hypothesis is testable
against the imported features and is quantified in recurrence note 2 above.*

## Gaps

- The proposed genre labels remain candidates only; the taxonomy's minimum-membership
  rules require independently researched peer cities before admission — and where the
  coastal family's floors are now met, its prevalence caps are simultaneously tripped
  by deliberately correlated selection (see recurrence note 1).
- Measured school-performance and parcel-level flood/insurance evidence were outside
  the structural reconciliation pass and should not be inferred from community scores.
- Racial-inclusion climate remains unscored across all three coastal-family cities —
  a corpus-level gap, not just a Charleston one.
- Greenville, the in-state inland counterfactual, is unresearched; it would test
  whether the "Growing Sunbelt" vocabulary separates from the coastal bundle.
