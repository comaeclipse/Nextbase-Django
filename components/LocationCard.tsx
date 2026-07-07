"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Location } from "@/lib/types";

/*
 * Ported 1:1 from locations/templates/locations/partials/location_cards.html.
 * The whole card is clickable (Django used `onclick=window.location.href`);
 * "Learn More" navigates with a Next <Link> per the migration plan.
 */
export default function LocationCard({ location }: { location: Location }) {
  const router = useRouter();
  const href = `/city/${location.id}`;

  return (
    <div className="location-card" onClick={() => router.push(href)}>
      <div className="card-image" style={{ background: location.gradient }}>
        {location.emoji}
        {location.featured && <span className="card-badge">Featured</span>}
      </div>
      <div className="card-content">
        <div className="location-header">
          <div>
            <div className="location-name">{location.name}</div>
            <div className="location-state">{location.state}</div>
          </div>
          <div className="match-score">
            {location.calculated_match_score ?? 0}% Fit
          </div>
        </div>

        <div className="card-stats">
          <div className="stat">
            <span className="stat-label">Avg. Home Price</span>
            <span className="stat-value">
              {location.avg_home_value_display || "—"}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Climate</span>
            <span className="stat-value">{location.climate || "—"}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Cost of Living</span>
            <span className="stat-value">{location.cost_of_living}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Population</span>
            <span className="stat-value">{location.population || "—"}</span>
          </div>
        </div>

        {location.tags && location.tags.length > 0 && (
          <div className="card-tags">
            {location.tags.map((tag, i) => (
              <span className="tag" key={i}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="card-footer">
          <div className="va-distance">
            🏥 VA Hospital:{" "}
            {location.has_va
              ? "Yes"
              : location.distance_to_va
                ? `Nearest is ${location.distance_to_va} away`
                : "Distance unknown"}
          </div>
          <Link
            href={href}
            className="learn-more"
            onClick={(e) => e.stopPropagation()}
          >
            Learn More →
          </Link>
        </div>
      </div>
    </div>
  );
}
