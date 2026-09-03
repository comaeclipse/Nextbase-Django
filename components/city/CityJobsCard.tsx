import Link from "next/link";
import type { CityHiringResult, CityHiringSample } from "@/lib/defense-jobs";

/*
 * "Defense & Tech Jobs in this city" card for /city/[id].
 *
 * This is a self-contained, literal-color card scoped under a single `.vr-jobs`
 * class family — it never imports shadcn/Tailwind and adds no document-wide
 * selector, so it survives the pixel-parity page's unlayered CSS the same way
 * the FloatingChat's `.vr-chat-*` block does. It reproduces the LOOK of the
 * shadcn "cn-card" reference (header row + outline action, table body of
 * icon-tile rows) with hand-written scoped CSS in app/styles/city.css.
 *
 * Plain server component: the data is already fetched (getCityHiring) and passed
 * in, so there is no interactivity to hydrate.
 */

/** Inline lucide-style SVG icons per broad sector; briefcase is the fallback. */
function SectorIcon({ sector }: { sector: string }) {
  const common = {
    className: "vr-jobs-tile-icon",
    viewBox: "0 0 24 24",
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (sector) {
    case "Software & Data":
      // code brackets
      return (
        <svg {...common}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "Hardware & Engineering":
      // cpu
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M15 2v2" />
          <path d="M15 20v2" />
          <path d="M2 15h2" />
          <path d="M2 9h2" />
          <path d="M20 15h2" />
          <path d="M20 9h2" />
          <path d="M9 2v2" />
          <path d="M9 20v2" />
        </svg>
      );
    case "Manufacturing & Production":
      // factory
      return (
        <svg {...common}>
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M17 18h1" />
          <path d="M12 18h1" />
          <path d="M7 18h1" />
        </svg>
      );
    case "Mission & Flight Ops":
      // plane
      return (
        <svg {...common}>
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 4.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
      );
    case "Product & Design":
      // pen ruler
      return (
        <svg {...common}>
          <path d="M14.5 5.5 4 16v4h4L18.5 9.5" />
          <path d="m17 4 3 3" />
          <path d="M14.5 5.5 17 3l4 4-2.5 2.5" />
        </svg>
      );
    case "Business & Growth":
      // trending up
      return (
        <svg {...common}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "Security & IT":
      // shield
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
      );
    case "Corporate & G&A":
      // building
      return (
        <svg {...common}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M8 10h.01" />
          <path d="M16 10h.01" />
          <path d="M12 10h.01" />
        </svg>
      );
    default:
      // briefcase
      return (
        <svg {...common}>
          <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          <rect x="2" y="6" width="20" height="14" rx="2" />
        </svg>
      );
  }
}

/** Compact pay label, e.g. `$90k–$120k/yr`, `$45/hr`, or `$95k/yr`. Empty when unknown. */
function formatPay(
  payMin: number | null,
  payMax: number | null,
  payInterval: string | null
): string {
  if (payMin == null && payMax == null) return "";
  const yearly = !payInterval || /year|annual|yr/i.test(payInterval);
  const suffix = yearly ? "/yr" : payInterval && /hour|hr/i.test(payInterval) ? "/hr" : "";
  const fmt = (n: number): string =>
    yearly && n >= 1000
      ? `$${(n / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}k`
      : `$${n.toLocaleString("en-US")}`;
  const lo = payMin != null ? fmt(payMin) : null;
  const hi = payMax != null ? fmt(payMax) : null;
  const range = lo && hi ? (lo === hi ? lo : `${lo}–${hi}`) : (lo ?? hi ?? "");
  return `${range}${suffix}`;
}

function ListingRow({ listing }: { listing: CityHiringSample }) {
  const pay = formatPay(listing.payMin, listing.payMax, listing.payInterval);
  return (
    <a
      className="vr-jobs-row"
      href={listing.url}
      target="_blank"
      rel="noreferrer"
    >
      <span className="vr-jobs-tile">
        <SectorIcon sector={listing.sector} />
      </span>
      <span className="vr-jobs-label">
        <span className="vr-jobs-title">{listing.title}</span>
        <span className="vr-jobs-sub">
          {listing.company}
          {listing.sector ? ` · ${listing.sector}` : ""}
        </span>
      </span>
      <span className="vr-jobs-right">
        {listing.isRemote ? <span className="vr-jobs-pill">Remote</span> : null}
        {pay ? <span className="vr-jobs-pay">{pay}</span> : null}
      </span>
    </a>
  );
}

export default function CityJobsCard({
  hiring,
  cityName,
  stateAbbr,
}: {
  hiring: CityHiringResult | null;
  cityName: string;
  stateAbbr: string;
}) {
  // Nothing to show (no data, no match, or job tables not loaded).
  if (!hiring || !hiring.matched) return null;

  const { totalListings, employers, sampleListings, trackedEmployers } = hiring;
  const employerCount = employers.length;

  // Description: prefer the real-listing framing; fall back to tracked employers
  // when there are no scraped listings but we still track posting counts here.
  const place = `${cityName}${stateAbbr ? `, ${stateAbbr}` : ""}`;
  const description =
    totalListings > 0
      ? `${totalListings.toLocaleString()} open ${
          totalListings === 1 ? "role" : "roles"
        } from ${employerCount} ${
          employerCount === 1 ? "employer" : "employers"
        } in ${place}`
      : `${trackedEmployers.length} tracked ${
          trackedEmployers.length === 1 ? "employer" : "employers"
        } hiring in ${place}`;

  // Up to 5 real listings; backfill with up to 2 tracked-employer aggregate rows
  // (no apply link) when there's room, clearly labeled as counts.
  const listingRows = sampleListings.slice(0, 5);
  const trackedRows =
    listingRows.length < 5 ? trackedEmployers.slice(0, 2) : [];

  const careerHref = `/career-transition?city=${encodeURIComponent(
    cityName
  )}&state=${stateAbbr}`;

  // Deep-link "View all" straight into /defense-jobs prefiltered to this city.
  // The explorer keys a selected city as "City|ST" (its map-point key + API
  // filter format), so pass exactly that.
  const viewAllHref = stateAbbr
    ? `/defense-jobs?city=${encodeURIComponent(`${cityName}|${stateAbbr}`)}`
    : "/defense-jobs";

  return (
    <div className="vr-jobs-card">
      <div className="vr-jobs-head">
        <div className="vr-jobs-head-text">
          <h2 className="vr-jobs-heading">Defense &amp; Tech Jobs</h2>
          <p className="vr-jobs-desc">{description}</p>
        </div>
        <Link className="vr-jobs-viewall" href={viewAllHref}>
          View all
        </Link>
      </div>

      <div className="vr-jobs-body">
        {listingRows.map((listing, i) => (
          <ListingRow key={`${listing.url}-${i}`} listing={listing} />
        ))}

        {trackedRows.map((emp) => (
          <div className="vr-jobs-row vr-jobs-row-static" key={`tracked-${emp.name}`}>
            <span className="vr-jobs-tile">
              <SectorIcon sector="Security & IT" />
            </span>
            <span className="vr-jobs-label">
              <span className="vr-jobs-title">{emp.name}</span>
              <span className="vr-jobs-sub">Tracked employer &middot; aggregate count</span>
            </span>
            <span className="vr-jobs-right">
              <span className="vr-jobs-pay">
                {emp.total.toLocaleString()} tracked{" "}
                {emp.total === 1 ? "opening" : "openings"}
              </span>
            </span>
          </div>
        ))}
      </div>

      <Link className="vr-jobs-mos" href={careerHref}>
        Enter your MOS to see roles matched to your background{" "}
        <span aria-hidden>&rarr;</span>
      </Link>
    </div>
  );
}
