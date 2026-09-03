import DefenseJobsExplorer, {
  type EmployerCount,
} from "@/components/defense-jobs/DefenseJobsExplorer";
import {
  getDefenseEmployerCityCounts,
  getDefenseJobFacets,
  getDefenseJobInitialListings,
  getDefenseJobInitialMap,
  getDefenseJobListingsPage,
  getDefenseJobMapAggregation,
  toClientListing,
} from "@/lib/defense-jobs";

export const dynamic = "force-dynamic";

/**
 * Normalize a `?city=` deep link (from the city page's "View all") into the
 * "City|ST" key the explorer + API filter use. Accepts `|` or `,` as the
 * separator; returns null unless both parts are present.
 */
function normalizeCityParam(raw: string | undefined): string | null {
  if (!raw) return null;
  const sep = raw.includes("|") ? "|" : raw.includes(",") ? "," : null;
  if (!sep) return null;
  const idx = raw.indexOf(sep);
  const city = raw.slice(0, idx).trim();
  const state = raw.slice(idx + 1).trim();
  return city && state ? `${city}|${state}` : null;
}

export default async function DefenseJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const initialCity = normalizeCityParam((await searchParams).city);
  const filter = initialCity ? { city: initialCity } : {};

  // Only the first page of listings, the filter-chip options, the city-level map
  // aggregation, and the tracked-employer counts — never all ~12k rows. The
  // client fetches subsequent pages / filtered results from /api/defense-jobs.
  // When a city deep link is present, the initial reads are filtered to it
  // server-side so the first paint is already scoped (no unfiltered flash); the
  // unfiltered reads stay cached for the common no-city case.
  const [facets, firstPage, cityPoints, countRows] = await Promise.all([
    getDefenseJobFacets(),
    initialCity
      ? getDefenseJobListingsPage(filter, 1)
      : getDefenseJobInitialListings(),
    initialCity
      ? getDefenseJobMapAggregation(filter)
      : getDefenseJobInitialMap(),
    getDefenseEmployerCityCounts(),
  ]);

  const counts: EmployerCount[] = countRows.map((c) => ({
    employerSlug: c.employer_slug,
    displayName: c.display_name,
    city: c.city,
    state: c.state,
    latitude: c.latitude,
    longitude: c.longitude,
    onsite: c.onsite,
    hybrid: c.hybrid,
    remote: c.remote,
    total: c.total,
  }));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Defense Jobs</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Open roles across the defense-technology sector. Filter by broad job
          sector or employer, and cross-reference the defense employers we already
          track. Click a city on the map to see its listings.
        </p>
      </header>
      <DefenseJobsExplorer
        facets={facets}
        initialListings={firstPage.listings.map(toClientListing)}
        initialTotal={firstPage.total}
        initialCityPoints={cityPoints}
        counts={counts}
        initialCity={initialCity}
      />
    </div>
  );
}
