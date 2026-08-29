import DefenseJobsExplorer, {
  type EmployerCount,
} from "@/components/defense-jobs/DefenseJobsExplorer";
import {
  getDefenseEmployerCityCounts,
  getDefenseJobFacets,
  getDefenseJobInitialListings,
  getDefenseJobInitialMap,
  toClientListing,
} from "@/lib/defense-jobs";

export const dynamic = "force-dynamic";

export default async function DefenseJobsPage() {
  // Only the first page of listings, the filter-chip options, the city-level map
  // aggregation, and the tracked-employer counts — never all ~12k rows. The
  // client fetches subsequent pages / filtered results from /api/defense-jobs.
  const [facets, firstPage, cityPoints, countRows] = await Promise.all([
    getDefenseJobFacets(),
    getDefenseJobInitialListings(),
    getDefenseJobInitialMap(),
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
      />
    </div>
  );
}
