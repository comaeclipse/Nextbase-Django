# State marijuana status backfill, 2026-08-17

Scope: fill `locations_stateinfo.marijuana_status` for the 40 states that were null in Neon on 2026-08-17.

Precedence applied: recreational adult-use legalization -> statewide decriminalization -> medical cannabis -> illegal/criminalized. Under this scheme, a non-recreational state with both statewide decriminalization and medical cannabis is recorded as `Decriminalized`.

Normalization:

- User-provided `legalized` -> `Recreational`
- User-provided `medicinal` -> `Medical`
- User-provided `decriminalized` -> `Decriminalized`
- User-provided `illegal/criminalized` -> `Illegal`

Sources checked:

- NCSL Cannabis Overview: https://www.ncsl.org/civil-and-criminal-justice/cannabis-overview
- NCSL State Medical Cannabis Laws: https://www.ncsl.org/health/state-medical-cannabis-laws
- MPP Cannabis Legalization: https://www.mpp.org/issues/legalization/
- MPP Iowa medical cannabidiol summary: https://www.mpp.org/states/iowa/summary-iowas-medical-cannabidiol-program/
- MPP Idaho state page: https://www.mpp.org/states/idaho/
- MPP Nebraska medical cannabis FAQ: https://www.mpp.org/states/nebraska/nebraska-medical-cannabis-laws-faqs/

Notes:

- Adult-use states use the MPP legalization overview as the row source URL.
- `HI`, `MS`, `ND`, and `NE` use NCSL's statewide decriminalization list as the row source URL.
- `FL`, `KY`, `OK`, `PA`, `SD`, `UT`, and `WV` use NCSL's state medical cannabis laws table as the row source URL.
- `IA` is stored as `Medical` using the MPP Iowa page because it allows medical cannabis preparations but not raw flower.
- `ID` is stored as `Illegal` using the MPP Idaho page.
- `KS`, `SC`, `TN`, and `WI` are stored as `Illegal` because the available NCSL material treats their low-THC/CBD carve-outs as limited-access laws, not comprehensive medical cannabis programs.
