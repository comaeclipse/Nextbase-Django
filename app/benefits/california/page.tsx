import type { Metadata } from "next";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
// california-benefits.css is imported from ./layout.tsx (layout-level) so it
// loads before the page commits on client-side navigation — see that file.

export const metadata: Metadata = {
  title: "California Veteran Benefits | VetRetire",
  description:
    "A source-backed overview of California tax, property, education, vehicle, and home-loan benefits for veterans.",
};

const sources = [
  ["FTB: 2025 Schedule CA (540) instructions", "https://www.ftb.ca.gov/forms/2025/2025-540-ca-instructions.html"],
  ["BOE: Disabled Veterans' Exemption", "https://www.boe.ca.gov/proptaxes/dv_exemption.htm"],
  ["BOE: 2026 exemption amounts", "https://www.boe.ca.gov/proptaxes/pdf/lta25014.pdf"],
  ["CalVet: College Fee Waiver", "https://www.calvet.ca.gov/VetServices/Pages/College-Fee-Waiver.aspx"],
  ["California DMV: Disabled Veteran License Plates", "https://www.dmv.ca.gov/portal/vehicle-registration/license-plates-decals-and-placards/disabled-veteran-dv-license-plates/"],
  ["CalVet Home Loans", "https://www.calvet.ca.gov/HomeLoans/Pages/New-Customer.aspx"],
] as const;

export default function CaliforniaBenefitsPage() {
  return (
    <div className="california-benefits-page">
      <PublicNav active="explore" />
      <main className="california-benefits-content">
        <Link className="california-benefits-back" href="/explore?state_filter=CA">
          ← Explore California locations
        </Link>
        <header className="california-benefits-hero">
          <p>State benefit guide</p>
          <h1>California veteran benefits</h1>
          <span>A concise, source-backed overview for comparing California retirement locations.</span>
        </header>

        <section>
          <h2>Military retirement and SBP income</h2>
          <p>For tax years 2025–2029, California permits a qualified taxpayer to exclude up to $20,000 of qualifying federal military retirement pay or Department of Defense Survivor Benefit Plan income. Federal AGI must not exceed $125,000, or $250,000 for a surviving spouse or spouses filing jointly. The $20,000 cap applies to the return; it is not automatically a separate exclusion for each spouse.</p>
        </section>

        <section>
          <h2>Disabled-veterans property-tax exemption</h2>
          <p>This is an assessed-value exemption on a qualifying principal residence, not generally a complete property-tax waiver. It may be available to veterans rated 100% disabled for a service-connected disability or compensated at the 100% rate due to individual unemployability, subject to the program&apos;s other requirements.</p>
          <p>For the January 1, 2026 lien date, the basic exemption is $180,671. The low-income exemption is $271,009 for households at or below the $81,131 income limit. These figures are adjusted annually.</p>
        </section>

        <section>
          <h2>Additional California programs</h2>
          <div className="california-benefits-grid">
            <article><h3>Dependent college fee waiver</h3><p>CalVet administers fee-waiver plans for certain eligible dependents at California public colleges. Eligibility and covered charges depend on the plan.</p></article>
            <article><h3>Disabled-veteran plates</h3><p>Eligible disabled veterans may receive a registration and license fee exemption for one qualifying vehicle with DV plates; the disability requirements are specific.</p></article>
            <article><h3>CalVet Home Loans</h3><p>CalVet offers a state home-loan program for eligible veterans, with program terms and property rules set by CalVet.</p></article>
          </div>
        </section>

        <section className="california-benefits-sources">
          <h2>Official sources and applications</h2>
          <ul>{sources.map(([label, href]) => <li key={href}><a href={href} target="_blank" rel="noreferrer">{label} <span aria-hidden>↗</span></a></li>)}</ul>
          <p className="california-benefits-note">Benefit rules, eligibility, income limits, and annual exemption amounts can change. Confirm your circumstances with the relevant California agency, county assessor, or qualified adviser.</p>
        </section>
      </main>
    </div>
  );
}
