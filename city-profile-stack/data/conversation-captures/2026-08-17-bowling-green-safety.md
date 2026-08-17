# Bowling Green safety refinement: conversation research capture

**Status:** local R&D preservation record. This captures a source-linked safety
refinement for Bowling Green, KY on 2026-08-17. It is not a replacement for the
city CSV's `TCI` field, which remains a violent-crime index.

## How to read this capture

- **FBI UCR 2024** remains the standardized basis for the stored city `TCI`.
- **BGPD 2025** figures are local operational year-end statistics reported by
  WBKO; they are useful context but are not treated as finalized FBI UCR rows.
- Citywide rates do not describe neighborhood-level conditions.

## Safety Analysis

Bowling Green's 2024 violent-crime rate is below the U.S. average, which supports
the stored `TCI=63` and `CrimeRating=Low` under the repo's violent-crime-index
method. OpenCrime reports 174 violent crimes and a violent-crime rate of 224.5
per 100,000 in 2024, compared with a national violent-crime rate of 359.1.
PlainCrime reports the same 224.5 violent-crime rate and says the figures are
compiled from FBI UCR / CDE data.

The important nuance is property crime. OpenCrime reports 2,270 property crimes
and a 2024 property-crime rate of 2,928.9 per 100,000. PlainCrime lists
property crime as the lead offense family, with 1,800 larceny-thefts, 264
burglaries, and 206 motor-vehicle thefts. This means Bowling Green can look
more concerning on broad crime-ranking sites than its violence statistics alone
would suggest.

Reported rape is also an offense-mix outlier. The 2024 UCR mirror shows 69 rape
reports, or 89.0 per 100,000. That should be carried as a caveat in safety
discussion, not converted into an individual-risk probability, because reported
sexual-violence rates can be affected by reporting behavior, agency practice,
and definitions.

The five-year standardized trend is favorable. OpenCrime's 2020-2024 table shows
violent crimes falling from 247 to 174 and property crimes falling from 3,195 to
2,270. BGPD's 2025 year-end statistics, reported by WBKO, also point to theft as
the most visible practical issue: 500 shoplifting cases, 162 thefts from
vehicles, and 56 stolen guns, with shoplifting concentrated at large retail
locations.

## Characterization for City-Profile Signals

| Dimension | Value |
| --- | --- |
| Violent crime | comparatively favorable / below national average |
| Property crime | elevated / theft-led |
| Reported rape | concerning offense-mix outlier |
| Trend | improving across 2020-2024 UCR data |
| Practical relocation note | neighborhood choice and vehicle/property security matter more than broad violent-crime fear |

## Sources

- OpenCrime Bowling Green, Kentucky FBI UCR mirror: https://www.opencrime.us/cities/bowling-green-kentucky
- PlainCrime Bowling Green, KY FBI UCR mirror: https://plaincrime.com/city/bowling-green-ky
- WBKO report on Bowling Green Police Department 2025 crime statistics: https://www.wbko.com/2026/01/13/bowling-green-police-department-shares-2025-city-crime-statistics/
- Bowling Green Police Department current monthly statistics page: https://www.bgky.org/police/statistics
- FBI UCR program overview: https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/ucr
