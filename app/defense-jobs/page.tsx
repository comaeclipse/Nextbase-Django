import DefenseJobsExplorer, {
  type EmployerCount,
  type JobListing,
} from "@/components/defense-jobs/DefenseJobsExplorer";
import {
  getDefenseEmployerCityCounts,
  getDefenseJobListings,
} from "@/lib/defense-jobs";

export const dynamic = "force-dynamic";

export default async function DefenseJobsPage() {
  const [rows, countRows] = await Promise.all([
    getDefenseJobListings(),
    getDefenseEmployerCityCounts(),
  ]);

  const listings: JobListing[] = rows.map((r) => ({
    id: r.id,
    company: r.company,
    employerSlug: r.employer_slug,
    title: r.title,
    fieldRaw: r.field_raw,
    sector: r.sector,
    city: r.city,
    state: r.state,
    region: r.region,
    isRemote: r.is_remote,
    latitude: r.latitude,
    longitude: r.longitude,
    employmentType: r.employment_type,
    payMin: r.pay_min,
    payMax: r.pay_max,
    payInterval: r.pay_interval,
    education: r.education,
    url: r.url,
  }));

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
      <DefenseJobsExplorer listings={listings} counts={counts} />
    </div>
  );
}
