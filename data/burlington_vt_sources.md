# Burlington, VT Source Notes (Cohort A backfill, issue #29)

Retrieval date: 2026-08-08.

## Scope of this patch

Legacy-seed row (`locations_location` id 61); pre-patch scan confirmed all six target fields were
genuinely NULL/empty. Applied via a single-row parameterized SQL UPDATE
(`scripts/_apply_cohort_a_patch.cjs`, transient/not committed, permanent safety check). No other
column touched.

## tci (Safety and Social Policy)

- Burlington 2024 violent crime rate: 479.13 per 100,000 (213 violent crimes), FBI UCR data, up 17%
  from 2023. https://plaincrime.com/city/burlington-vt
- FBI 2024 national violent crime rate baseline: 359.1 per 100,000 (FBI CDE "UCR Summary of Reported
  Crimes in the Nation, 2024" — same baseline used throughout this backfill).
  https://cde.ucr.cjis.gov/LATEST/resources/reports/UCR%20Summary%20of%20Reported%20Crimes%20in%20the%20Nation%202024.pdf
- TCI = 479.13 / 359.1 * 100 = 133.4, stored as 133 (integer).

## Elections (county: Chittenden) — discrepancy noted

- Two-party math, Chittenden County, VT:
  - 2016: Trump 18,601 (22.30% of all votes); Clinton 54,814 (65.71% of all votes). Two-party total
    73,415. Trump two-party share 25.34%, Clinton 74.66%.
  - 2024: Trump 20,937 (21.51% of all votes); Harris 72,656 (74.65% of all votes). Two-party total
    93,593. Trump two-party share 22.37%, Harris 77.63%.
  - `rep_vote_share_change_pp` = 22.37 − 25.34 = **-3.0**
  - `dem_vote_share_change_pp` = 77.63 − 74.66 = **+3.0**
  - This is the **opposite direction** from the row's pre-existing `election_change` value of "2% less
    Democratic." Flagged per the established pattern rather than reconciled — `election_change` left
    untouched.
- Sources (Wikipedia "By county" section, fetched via the MediaWiki parse API for the specific
  section):
  - 2016: https://en.wikipedia.org/wiki/2016_United_States_presidential_election_in_Vermont (section 8)
  - 2024: https://en.wikipedia.org/wiki/2024_United_States_presidential_election_in_Vermont (section 8)

## tags / description

- Tags: `["Culture", "Lake", "Parks"]`.
- Culture: Church Street Marketplace, a four-block pedestrian mall, hosts 100+ shops and restaurants
  plus year-round events. https://churchstmarketplace.com/
- Lake/Parks: Burlington sits on Lake Champlain, with Waterfront Park, a bike path, and views of the
  Adirondack Mountains across the lake. https://www.visittheusa.com/destinations/vermont/burlington/
- Description written from the same facts above.

## veterans_benefits

- Under Vermont's Act 71 (effective the 2025 tax year), military retirement and survivor benefit income
  is fully exempt for taxpayers with AGI up to $125,000, phasing out between $125,000 and $175,000 (no
  exemption above $175,000); taxpayers cannot claim both the Social Security and military-retirement
  exemptions in the same year.
  https://tax.vermont.gov/individuals/income-tax-returns/who-needs-to-file/military-personnel
- Disabled veterans (50%+ VA disability compensation, non-service-connected pension, or permanent
  medical military retirement) qualify for a property tax exemption with a state-mandated minimum of
  $10,000, which individual towns may raise up to $40,000.
  https://veterans.vermont.gov/office-veterans-affairs/programs-administered-office-veterans-affairs/property-tax-exemption

## Known limitations

None — all six target fields for this row were sourced and populated.
