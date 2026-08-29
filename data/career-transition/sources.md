# Career Transition Seed Sources

Retrieved: 2026-08-29

This v1 bundle seeds the military specialty career matcher with a narrow aviation-maintenance slice plus a first ordnance/weapons expansion. It is designed to prove the all-branch schema and UI without claiming complete military occupation coverage.

## Stable occupation and credential sources

- O*NET Military Crosswalk: https://www.onetonline.org/crosswalk/MOC/
- O*NET Crosswalk files and Military Transition Search notes: https://www.onetcenter.org/crosswalks.html
- O*NET aircraft mechanic summary: https://www.onetonline.org/link/summary/49-3011.00
- O*NET avionics technician summary: https://www.onetonline.org/link/summary/49-2091.00
- Navy NEOCS manual landing page: https://www.mynavyhr.navy.mil/References/NEOCS-Manual/
- Marine Corps FY26/FY27 MOS manual landing page: https://www.marines.mil/News/Publications/MCPEL/Electronic-Library-Display/Article/4429151/navmc-12001l/
- Navy Aviation Ordnanceman page: https://www.navy.com/careers-benefits/careers/aviation/aviation-ordnanceman
- MyNavy HR AO page: https://www.mynavyhr.navy.mil/Career-Management/Community-Management/Enlisted/Aviation/AO/
- Navy Gunner's Mate page: https://www.navy.com/careers-benefits/careers/industrial-mechanical/gunners-mate
- MyNavy HR GM page: https://www.mynavyhr.navy.mil/Career-Management/Community-Management/Enlisted/Surface-CS-OPS/GM/
- Army 91F Small Arms/Towed Artillery Repairer page: https://www.goarmy.com/careers-and-jobs/mechanics-engineering/test-repair/91f-small-arms-towed-artillery-repair
- Army 89B Ammunition Specialist page: https://www.goarmy.com/careers-and-jobs/support-logistics/transportation-inventory/89b-ammunition-specialist
- Army 94F Computer/Detection Systems Repairer page: https://www.goarmy.com/careers-and-jobs/signal-intelligence/locations-stats-frequencies/94f-computer-detection-systems-repairer
- Air Force Aircraft Armament Systems page: https://www.airforce.com/careers/science-and-technology/aircraft-armament-systems
- Air Force Munitions Systems page: https://www.airforce.com/careers/logistics-and-administration/munitions-systems
- Air Force Missile and Space Systems Electronic Maintenance page: https://www.airforce.com/careers/science-and-technology/missile-and-space-systems-electronic-maintenance
- Air Force Missile and Space Systems Maintenance page: https://www.airforce.com/careers/science-and-technology/missile-and-space-systems-maintenance
- O*NET Explosives Workers, Ordnance Handling Experts, and Blasters summary: https://www.onetonline.org/link/summary/47-5032.00
- O*NET Electrical and Electronics Repairers, Commercial and Industrial Equipment summary: https://www.onetonline.org/link/summary/49-2094.00
- Army QASAS overview: https://www.army.mil/article/283327/qasas_play_essential_role_in_army_readiness

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
- BAE Systems Ordnance Systems careers: https://jobs.baesystems.com/global/en/osi
- BAE Systems military veterans page: https://jobs.baesystems.com/global/en/militaryveterans
- General Dynamics Ordnance and Tactical Systems: https://www.gdots.com/
- General Dynamics Ordnance and Tactical Systems careers: https://www.gdots.com/careers/
- RTX careers: https://careers.rtx.com/
- Northrop Grumman careers: https://www.northropgrumman.com/jobs/
- HII careers: https://hii.com/careers/
- Leonardo DRS careers: https://www.leonardodrs.com/careers/
- KBR careers: https://www.kbr.com/en/careers
- FN America careers: https://fnamerica.com/careers/
- SIG Sauer careers: https://www.sigsauer.com/careers
- Colt CZ Group careers: https://www.coltczgroup.com/en/career
- Air Methods careers: https://www.airmethods.com/careers/
- PHI Aviation careers: https://www.phihelico.com/careers/
- Bristow careers: https://www.bristowgroup.com/careers/
- Erickson careers: https://ericksoninc.com/careers/
- Columbia Helicopters careers: https://colheli.com/careers/

## Caveats

- Current postings change quickly. `snapshot_date` and `source_retrieved_on` are required for every employer match.
- Ordnance employer matches are curated system-fit snapshots, not claims that a specialty usually feeds a specific employer.
- System tags such as Mk 41 VLS, CIWS, Mk 45, aviation ordnance, ammunition, fire control, and electro-optical systems should be treated as user-profile refinements when more granular service history is available.
- Civilian operators are transition employers, not defense employers. They are intentionally not inserted into `defense_employers`.
- A mapped VetRetire location count exists only for transition employers linked to an existing `defense_employers.slug`; an unmapped employer means "not yet mapped," not "no locations."
