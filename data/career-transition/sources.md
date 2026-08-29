# Career Transition Seed Sources

Retrieved: 2026-08-29

This v1 bundle seeds the military specialty career matcher with a narrow aviation-maintenance slice. It is designed to prove the all-branch schema and UI without claiming complete military occupation coverage.

## Stable occupation and credential sources

- O*NET Military Crosswalk: https://www.onetonline.org/crosswalk/MOC/
- O*NET Crosswalk files and Military Transition Search notes: https://www.onetcenter.org/crosswalks.html
- O*NET aircraft mechanic summary: https://www.onetonline.org/link/summary/49-3011.00
- O*NET avionics technician summary: https://www.onetonline.org/link/summary/49-2091.00
- Navy NEOCS manual landing page: https://www.mynavyhr.navy.mil/References/NEOCS-Manual/
- Marine Corps FY26/FY27 MOS manual landing page: https://www.marines.mil/News/Publications/MCPEL/Electronic-Library-Display/Article/4429151/navmc-12001l/

## Employer snapshot sources

- Amentum veterans page: https://www.amentumcareers.com/veterans
- Amentum UH-60/MH-60R aviation-maintenance posting page: https://www.amentumcareers.com/jobs/uh-60-mh-60r-careers-structures-airframer-sheet-metal-am-avionics-technician-at-jubail-saudi-arabia-jubail-eastern-province-saudi-arabia-miramar-california-united-states-jacksonville-florida
- L3Harris careers search: https://careers.l3harris.com/en/search_jobs/oconus/4832/1/1
- Textron military veterans page: https://careers.textron.com/military-veterans/
- Lockheed Martin maintenance jobs search: https://www.lockheedmartinjobs.com/search-jobs/maintenance/
- RTX Collins Aerospace careers page: https://careers.rtx.com/global/en/collins-aerospace
- RTX Pratt & Whitney careers page: https://careers.rtx.com/global/en/pratt-whitney
- Boeing careers: https://jobs.boeing.com/
- V2X careers: https://careers.v2x.com/
- Air Methods careers: https://www.airmethods.com/careers/
- PHI Aviation careers: https://www.phihelico.com/careers/
- Bristow careers: https://www.bristowgroup.com/careers/
- Erickson careers: https://ericksoninc.com/careers/
- Columbia Helicopters careers: https://colheli.com/careers/

## Caveats

- Current postings change quickly. `snapshot_date` and `source_retrieved_on` are required for every employer match.
- Civilian operators are transition employers, not defense employers. They are intentionally not inserted into `defense_employers`.
- A mapped VetRetire location count exists only for transition employers linked to an existing `defense_employers.slug`; an unmapped employer means "not yet mapped," not "no locations."
