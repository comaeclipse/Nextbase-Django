# `retired_pay_tax` verification — 2026-08-07

Resolves the 18 states flagged `unknown` in issue #6 (source summary was silent or ambiguous
on whether military retired pay is excluded from state income tax). Each value below was
checked against the state's own department of revenue / veterans-affairs guidance, current
as of 2026-08-07. Only `retired_pay_tax` is verified by this note — the other
`locations_stateinfo` boolean columns for these states are unchanged and remain unverified
(`vet_benefits_verified_on` stays NULL until the full row, not just this one field, is checked).

Allowed values: `no_income_tax`, `exempt`, `partial`, `conditional`, `taxed`, `unknown`.

| State | Value | Basis | Primary source |
| --- | --- | --- | --- |
| KS | `exempt` | Military retirement/SBP fully excluded from Kansas income tax | Kansas Department of Revenue |
| KY | `partial` | First $31,110 of retirement income excluded (pre-1998 service may exclude more via Schedule P) | Kentucky Department of Revenue |
| LA | `exempt` | Federal retirement benefits, including military retirement and SBP, excluded from Louisiana taxable income | Louisiana Department of Revenue |
| MA | `exempt` | U.S. military pensions excluded from Massachusetts gross income | Mass.gov |
| MI | `exempt` | Military retirement/pensions exempt from Michigan individual income tax | Michigan.gov |
| MN | `exempt` | Military retirement fully subtractable from Minnesota taxable income | Minnesota Department of Revenue |
| MT | `conditional` | No broad exemption; a working retiree may exclude the lesser of 50% of military retirement or MT earned/business/farm income, for up to 5 consecutive years | Montana Department of Revenue |
| NE | `exempt` | 100% exempt since tax year 2022, no election required | Nebraska Department of Revenue |
| NM | `partial` | Up to $30,000 of qualifying Armed Forces retirement pay deductible for tax years 2024-2026 | New Mexico Taxation and Revenue Department |
| ND | `exempt` | Federally taxable military retirement benefits fully subtractable since 2019 | ND Office of State Tax Commissioner |
| OK | `partial` | Exclusion is the greater of 75% of benefits or $10,000 | Oklahoma.gov (veterans benefits guidance) |
| OR | `taxed` | No broad exemption for military retirement; generally taxed as ordinary income | Oregon Department of Veterans' Affairs |
| PA | `exempt` | Pennsylvania does not tax retirement pensions, including military retired pay | PA.gov |
| RI | `exempt` | Military service pensions fully excluded from RI personal income tax since tax year 2023 | RI Division of Taxation |
| UT | `taxed` | No blanket veteran exemption; taxed as ordinary retirement income under federal AGI | Utah State Tax Commission |
| VA | `partial` | Up to $40,000 of qualifying military retirement income exempt for tax year 2025 and later | Virginia Department of Taxation |
| WV | `exempt` | West Virginia does not tax military retirement, including survivor annuities | West Virginia Tax Division |
| WI | `exempt` | All U.S. military retirement payments, including SBP, exempt from Wisconsin income tax | Wisconsin Department of Revenue |

Not carried into this pass (out of scope for `retired_pay_tax`, flagged for a future full-row
verification per issue #6 acceptance criteria): `disabled_vet_property_tax` gating details
(e.g. minimum disability rating, income caps, TDIU treatment, surviving-spouse continuation)
vary enormously by state and are currently a single boolean. A future pass should consider
richer fields (`property_tax_min_va_rating`, `property_tax_full_exemption_rating`,
`property_tax_income_test`, `tdiu_accepted`, `surviving_spouse_continuation`,
`disabled_veteran_sales_tax_exemption`) rather than collapsing this into one flag.
