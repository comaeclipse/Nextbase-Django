import { CalendarClock, CircleHelp, ExternalLink, Home, Tag, TrendingDown } from "lucide-react";
import type { HousingMarketSnapshot } from "@/lib/housing-market";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HousingMarketCard({
  city,
  market,
}: {
  city: string;
  market: HousingMarketSnapshot;
}) {
  return (
    <section className="card housing-market" aria-labelledby="housing-market-title">
      <div className="card-head">
        <Home className="icon" aria-hidden="true" />
        <h2 id="housing-market-title">Housing Market</h2>
        <a
          className="housing-source"
          href={market.sourceUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${market.sourceLabel} for ${city} in a new tab`}
          title={`Source: ${market.sourceLabel}`}
        >
          <ExternalLink aria-hidden="true" />
          <span>Source</span>
        </a>
      </div>
      <div className="card-body">
        <div className="housing-market-grid">
          <div className="housing-primary-metric">
            <span className="housing-label">Typical home value</span>
            <strong>{money(market.typicalHomeValue)}</strong>
            <span className="housing-change">
              <TrendingDown aria-hidden="true" /> {Math.abs(market.yearOverYearChangePercent)}% lower year over year
            </span>
          </div>
          <div className="housing-stat">
            <CalendarClock aria-hidden="true" />
            <span>{market.daysToPending} days</span>
            <small>typical time to pending</small>
          </div>
          <div className="housing-stat">
            <Tag aria-hidden="true" />
            <span>{market.belowListPercent}%</span>
            <small>of sales below list</small>
          </div>
        </div>
        <p className="housing-summary">{market.summary}</p>
        <dl className="housing-details">
          <div><dt>Median sale price</dt><dd>{money(market.medianSalePrice)}</dd></div>
          <div><dt>Median list price</dt><dd>{money(market.medianListPrice)}</dd></div>
          <div><dt>For-sale inventory</dt><dd>{market.inventory.toLocaleString()}</dd></div>
        </dl>
        <p className="housing-caveat">
          <CircleHelp aria-hidden="true" />
          <span>{market.caveat} Data through {market.asOf}.</span>
        </p>
      </div>
    </section>
  );
}
