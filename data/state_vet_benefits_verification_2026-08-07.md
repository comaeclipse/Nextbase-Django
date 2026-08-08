# State veteran benefits verification — 2026-08-07

Issue: #6

## Verification policy

The state-level veteran benefit seed was re-audited against primary state government sources. `data/state_vet_benefits_verification.csv` is the machine-readable audit ledger: one row per state, the audited `retired_pay_tax` classification, a primary state source URL, and the verification date.

The boolean benefit fields remain deliberately three-valued. `Y` means the state source establishes a qualifying statewide benefit. A blank remains `NULL` when the audit did not establish a clean statewide yes/no result (for example, a benefit is municipal/local, narrowly program-specific, or the consolidated state source does not establish absence). **Absence of a mention was not converted to `false`.** Product filters therefore match only `=== true`; they never interpret `NULL` as false.

The summaries are state-level editorial summaries of the verified benefit categories and are rendered only when `vet_benefits_verified_on` and `source_url` are populated. The verification importer refuses to stamp a row verified if either field is missing or if `retired_pay_tax` remains `unknown`.

## Retired-pay blocker resolution

The 18 states that were `unknown` in the original seed were resolved as follows:

| State | Value | Basis |
|---|---|---|
| KS | `exempt` | Kansas excludes U.S. military retirement from state income tax. |
| KY | `partial` | Kentucky's pension exclusion covers the first $31,110; additional Schedule P treatment depends on service dates. |
| LA | `exempt` | Louisiana exempts military retirement benefits. |
| MA | `exempt` | Massachusetts excludes U.S. military pensions from gross income. |
| MI | `exempt` | Michigan excludes qualifying military retirement/pension benefits. |
| MN | `exempt` | Minnesota allows a full military pension subtraction. |
| MT | `conditional` | Montana's working-military-retiree exclusion is work/income limited and time limited. |
| NE | `exempt` | Nebraska excludes military retirement benefits from state income tax. |
| NM | `partial` | New Mexico allows a capped military retirement deduction; current treatment is not a blanket full exemption. |
| ND | `exempt` | North Dakota subtracts qualifying military retirement benefits. |
| OK | `partial` | Oklahoma provides a partial military retirement exclusion rather than a blanket full exclusion. |
| OR | `taxed` | Oregon has no broad current military-retirement exclusion; legacy service-date rules do not make it generally exempt. |
| PA | `exempt` | Pennsylvania does not tax qualifying retirement pension income, including military retired pay. |
| RI | `exempt` | Rhode Island excludes qualifying military service pensions. |
| UT | `taxed` | Utah has no blanket military-retirement subtraction; general retirement credits are separate. |
| VA | `partial` | Virginia allows a military-benefits subtraction up to the statutory cap ($40,000 for tax year 2025 and later). |
| WV | `exempt` | West Virginia excludes military retirement and qualifying survivor annuity income. |
| WI | `exempt` | Wisconsin excludes qualifying U.S. military retirement and SBP payments. |

Final 50-state distribution: **25 `exempt`, 9 `partial`, 9 `no_income_tax`, 5 `conditional`, 2 `taxed`, 0 `unknown`.**

## Primary-source examples used in the audit

These are representative primary sources for the formerly-blocking states; the complete one-source-per-state ledger is in `state_vet_benefits_verification.csv`.

- Kansas Office of Veterans Services — State Veterans Benefits: https://www.kovs.ks.gov/veteran-services/state-veterans-benefits-guide
- Kentucky Department of Veterans Affairs — Veterans Benefits: https://veterans.ky.gov/Benefits/pages/default.aspx
- Louisiana Department of Veterans Affairs — State Benefits: https://vetaffairs.la.gov/benefits/state
- Massachusetts Executive Office of Veterans Services — Veterans' Laws and Benefits: https://www.mass.gov/info-details/guide-to-veterans-laws-and-benefits
- Michigan Veterans Affairs Agency — State of Michigan Veteran Benefits: https://www.michigan.gov/mvaa/quality-of-life/quality-of-life/state-of-michigan-veteran-benefits
- Minnesota Department of Veterans Affairs: https://mn.gov/mdva/resources/iamaveteran/
- Nebraska Department of Veterans' Affairs — Benefits and Services Overview: https://veterans.nebraska.gov/benefits-and-services-overview
- New Mexico Department of Veterans Services — State Benefits: https://www.dvs.nm.gov/benefits/
- North Dakota Department of Veterans Affairs — Benefits and Services: https://www.veterans.nd.gov/benefits-and-services
- Oklahoma Department of Veterans Affairs — Benefits: https://oklahoma.gov/veterans/benefits.html
- Oregon Department of Veterans' Affairs — Benefits: https://www.oregon.gov/odva/benefits/pages/default.aspx
- Virginia Department of Veterans Services — Benefits: https://www.dvs.virginia.gov/benefits
- Wisconsin Department of Veterans Affairs — Benefits and Claims: https://dva.wi.gov/Pages/benefitsClaims/Benefits-and-Claims.aspx

## Product/data invariants

1. A row is product-renderable only when both `vet_benefits_verified_on` and `source_url` are non-null.
2. `retired_pay_tax = unknown` is invalid for a verified row.
3. Boolean filters use positive matches (`=== true`) only.
4. State-level benefit copy comes from `locations_stateinfo.vet_benefits_summary`, never a per-city copy.
5. `locations_location.veterans_benefits` is obsolete and is dropped by the migration in this change.
