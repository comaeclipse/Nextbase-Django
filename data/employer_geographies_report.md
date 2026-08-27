# Employer geographies — historical resolution report

**Correction notice (2026-08-27):** This report preserves the original resolver output, including rejected geography. The current import CSVs supersede its affected rows. See `employer_geography_corrections_2026-08-27_sources.md` and `sources/employer-geography/superseded_rows_2026-08-27.json`; do not use the historical wrong-place coordinates or metro assignments as current facts.

**Generated:** by `scripts/resolve-employer-geographies.ts`
**Source:** Census Geocoder (Public_AR_Current/Current_Current) + county→CBSA crosswalk from `pace_derived.json`

- places with a physical presence: **396**
- resolved to a county: **379**
- of those, assigned a CBSA: **361** (0 from the geocoder's MSA layer, 361 from the county crosswalk)
- unresolved: **17**
- distinct geographies written: **376** (plus **3** feed spelling variant(s) recorded as aliases)

## Unresolved — no row written

- Midland, GA (54 onsite/hybrid) — geocoder returned nothing
- Dulles, VA (12 onsite/hybrid) — geocoder returned nothing
- Buckley Sfb, CO (11 onsite/hybrid) — geocoder returned nothing
- Opa Locka, FL (7 onsite/hybrid) — geocoder returned nothing
- Hanover, MD (2 onsite/hybrid) — geocoder returned nothing
- Merrimack, NH (2 onsite/hybrid) — geocoder returned nothing
- Cranberry Township, PA (1 onsite/hybrid) — geocoder returned nothing
- Dededo, GU (1 onsite/hybrid) — geocoder returned nothing
- Fort Novosel, AL (1 onsite/hybrid) — geocoder returned nothing
- Fort Shafter, HI (1 onsite/hybrid) — geocoder returned nothing
- JBER, AK (1 onsite/hybrid) — geocoder returned nothing
- Linthicum Heights, MD (1 onsite/hybrid) — geocoder returned nothing
- Millersville, MD (1 onsite/hybrid) — geocoder returned nothing
- Patrick Air Force Base, FL (1 onsite/hybrid) — geocoder returned nothing
- Peterson Afb, CO (1 onsite/hybrid) — geocoder returned nothing
- Santa Rita, GU (1 onsite/hybrid) — geocoder returned nothing
- Yigo, GU (1 onsite/hybrid) — geocoder returned nothing

## Name differs from the Census name

The `City` column keeps the employer feed's spelling on purpose: the
`trg_link_city_to_employer_locations` trigger links postings on an exact
`lower(city)`/`upper(state)` match, so the Census spelling would silently fail to link.

- feed `Tewksbury, MA` ↔ census `Tewksbury (county subdivision)`
- feed `Portsmouth, RI` ↔ census `Newport East`
- feed `Santa Isabel, PR` ↔ census `Isabela`
- feed `Westford, MA` ↔ census `Westford (county subdivision)`
- feed `Pelham, NH` ↔ census `Pelham (county subdivision)`
- feed `St Petersburg, FL` ↔ census `St. Petersburg`
- feed `Langley Afb, VA` ↔ census `Joint Base Langley-Eustis`
- feed `Cheshire, CT` ↔ census `Cheshire Village`
- feed `Ft George G Meade, MD` ↔ census `Fort Meade`
- feed `Annapolis Junction, MD` ↔ census `Annapolis`
- feed `Tinker Afb, OK` ↔ census `Tinker Air Force Base`
- feed `Bedford, MA` ↔ census `Medford`
- feed `Moorestown, NJ` ↔ census `Moorestown-Lenola`
- feed `Augusta, GA` ↔ census `Augusta-Richmond County consolidated government (balance)`
- feed `Carson City, NV` ↔ census `Fort Carson`
- feed `Charleston AFB, SC` ↔ census `Charleston`
- feed `Cherry Point, NC` ↔ census `Marine Corps Air Station Cherry Point`
- feed `Concord, MA` ↔ census `Concord (county subdivision)`
- feed `East Pensacola Heights, FL` ↔ census `Pensacola`
- feed `Egg Harbor Township, NJ` ↔ census `Tuckerton`
- feed `Ellsworth AFB, SD` ↔ census `Ellsworth Air Force Base`
- feed `Farmington, CT` ↔ census `Farmington (county subdivision)`
- feed `Fort George G Meade, MD` ↔ census `Fort Meade`
- feed `Fort Johnson, LA` ↔ census `Seymour Johnson Air Force Base`
- feed `Glastonbury, CT` ↔ census `Glastonbury (county subdivision)`
- feed `Goodfellow AFB, TX` ↔ census `Goodfellow Air Force Base`
- feed `Great Lakes, IL` ↔ census `Naval Station Great Lakes`
- feed `Harrison Township, MI` ↔ census `Redding (county subdivision)`
- feed `Hickam AFB, HI` ↔ census `Joint Base Pearl Harbor-Hickam`
- feed `Jamaica, NY` ↔ census `New York`
- feed `John C Stennis Space Center, MS` ↔ census `Bay St. Louis`
- feed `Kennedy Space Center, FL` ↔ census `Center (county subdivision)`
- feed `Lake Suzy, FL` ↔ census `Naval Station Great Lakes`
- feed `Lexington, KY` ↔ census `Lexington-Fayette`
- feed `Marine Corps Base Kaneohe Bay, HI` ↔ census `Naval Submarine Base Kings Bay`
- feed `Natick, MA` ↔ census `Natick (county subdivision)`
- feed `Nimitz Hill, GU` ↔ census `Hills`
- feed `Patuxent River, MD` ↔ census `Naval Air Station Patuxent River`
- feed `Pearl Harbor, HI` ↔ census `Joint Base Pearl Harbor-Hickam`
- feed `Schriever Afb, CO` ↔ census `Schriever`
- feed `Schriever AFB, CO` ↔ census `Schriever`
- feed `Stafford, VA` ↔ census `Aquia (county subdivision)`
- feed `Stennis Space Center, MS` ↔ census `Bay St. Louis`
- feed `Washington D.C., DC` ↔ census `Washington`
- feed `Washington Navy Yard, DC` ↔ census `Washington`

## Spelling variants recorded as aliases, not separate geographies

- St. Petersburg, FL (1 onsite/hybrid) -> St Petersburg
- Schriever AFB, CO (1 onsite/hybrid) -> Schriever Afb
- Wright-Patterson AFB, OH (1 onsite/hybrid) -> Wright-Patterson Afb

## Resolved places

| place | onsite+hybrid | county | CBSA | CBSA via | method | employers |
|---|---:|---|---|---|---|---|
| Cedar Rapids, IA | 187 | Linn | 16300 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Tewksbury, MA | 185 | Middlesex | 14460 | county_crosswalk | street_guess:100 Main St | Leidos; Raytheon |
| Andover, MA | 180 | Essex | 14460 | county_crosswalk | gazetteer_centroid | Raytheon |
| Mckinney, TX | 172 | Collin | 19100 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Raytheon |
| East Hartford, CT | 153 | Capitol | — | — | gazetteer_centroid | Pratt & Whitney; Raytheon |
| Marlborough, MA | 135 | Middlesex | 14460 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos; Raytheon |
| Woburn, MA | 80 | Middlesex | 14460 | county_crosswalk | gazetteer_centroid | Raytheon |
| Aurora, CO | 67 | Arapahoe | 19740 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos; Raytheon |
| El Segundo, CA | 67 | Los Angeles | 31080 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos; Raytheon |
| Aguadilla, PR | 61 | Aguadilla | 10380 | county_crosswalk | street_guess:1 First St | Collins Aerospace; Pratt & Whitney |
| Middletown, CT | 47 | Lower Connecticut River Valley | — | — | gazetteer_centroid | Pratt & Whitney |
| North Berwick, ME | 43 | York | 38860 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Richardson, TX | 43 | Dallas | 19100 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris; Raytheon |
| Windsor Locks, CT | 40 | Capitol | — | — | gazetteer_centroid | Collins Aerospace |
| Clayville, NY | 31 | Oneida | 46540 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Largo, FL | 31 | Pinellas | 45300 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Raytheon |
| Portsmouth, RI | 30 | Newport | 39300 | county_crosswalk | street_guess:1 Main St | Raytheon |
| Melbourne, FL | 29 | Brevard | 37340 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris |
| Plano, TX | 28 | Collin | 19100 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris; Raytheon |
| Jupiter, FL | 24 | Palm Beach | 33100 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Rockford, IL | 24 | Winnebago | 40420 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Santa Isabel, PR | 20 | Isabela | 10380 | county_crosswalk | street_guess:1 First St | Collins Aerospace |
| Sterling, VA | 20 | Loudoun | 47900 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris; Raytheon |
| Winston-Salem, NC | 20 | Forsyth | 49180 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Fullerton, CA | 19 | Orange | 31080 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Raytheon |
| Lenexa, KS | 18 | Johnson | 28140 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Springdale, AR | 18 | Washington | 22220 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Foley, AL | 17 | Baldwin | 19300 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| York, NE | 14 | York | — | — | gazetteer_centroid | Collins Aerospace |
| Fulton, MD | 13 | Howard | 12580 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Chesapeake, VA | 12 | Chesapeake | 47260 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| Carlsbad, CA | 11 | San Diego | 41740 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris; Pratt & Whitney |
| Miramar, FL | 11 | Broward | 33100 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| West Des Moines, IA | 11 | Polk | 19780 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Arlington, VA | 10 | Arlington | 47900 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris; Leidos; Pratt & Whitney; Raytheon; System High |
| Middletown, PA | 10 | Dauphin | 25420 | county_crosswalk | gazetteer_centroid | Leidos; Pratt & Whitney |
| Westford, MA | 10 | Middlesex | 14460 | county_crosswalk | street_guess:1 Main St | Raytheon |
| Wilson, NC | 10 | Wilson | 48980 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Charlotte, NC | 9 | Mecklenburg | 16740 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos; Raytheon |
| Chula Vista, CA | 9 | San Diego | 41740 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris |
| Riverside, CA | 9 | Riverside | 40140 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| San Marcos, TX | 9 | Hays | 12420 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Troy, OH | 9 | Miami | 19430 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Coralville, IA | 8 | Johnson | 26980 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Everett, WA | 8 | Snohomish | 42660 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Fairfield, CA | 8 | Solano | 46700 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos |
| Farmington, NM | 8 | San Juan | 22140 | county_crosswalk | gazetteer_centroid | Raytheon |
| Irving, TX | 8 | Dallas | 19100 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Pelham, NH | 8 | Hillsborough | 31700 | county_crosswalk | street_guess:1 Main St | Raytheon |
| Columbia, MD | 7 | Howard | 12580 | county_crosswalk | gazetteer_centroid | L3Harris; Leidos; Raytheon |
| St Petersburg, FL | 7 | Pinellas | 45300 | county_crosswalk | street_guess:1 First St | Collins Aerospace; Raytheon |
| Holt, MI | 6 | Ingham | 29620 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Langley Afb, VA | 6 | Hampton | 47260 | county_crosswalk | military_installation:Joint Base Langley-Eustis | Collins Aerospace; Pratt & Whitney |
| West Valley City, UT | 6 | Salt Lake | 41620 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Alexandria, VA | 5 | Alexandria | 47900 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| Bridgeport, WV | 5 | Harrison | 17220 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Cheshire, CT | 5 | Naugatuck Valley | — | — | street_guess:1 Main St | Collins Aerospace |
| Ft George G Meade, MD | 5 | Anne Arundel | 12580 | county_crosswalk | military_installation:Fort Meade | Collins Aerospace; Raytheon |
| Lawton, OK | 5 | Comanche | 30020 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| Middletown, NY | 5 | Orange | 39100 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Santa Fe Springs, CA | 5 | Los Angeles | 31080 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| South Burlington, VT | 5 | Chittenden | 15540 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Springfield, VA | 5 | Fairfax | 47900 | county_crosswalk | gazetteer_centroid | L3Harris; Leidos; Raytheon |
| Anaheim, CA | 4 | Orange | 31080 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris |
| Annapolis, MD | 4 | Anne Arundel | 12580 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Raytheon |
| Chambersburg, PA | 4 | Franklin | 16540 | county_crosswalk | gazetteer_centroid | Raytheon |
| Lansing, MI | 4 | Ingham | 29620 | county_crosswalk | gazetteer_centroid | Leidos; Pratt & Whitney |
| Lompoc, CA | 4 | Santa Barbara | 42200 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| Manchester, IA | 4 | Delaware | — | — | gazetteer_centroid | Collins Aerospace |
| Sacramento, CA | 4 | Sacramento | 40900 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris; Leidos; Pratt & Whitney; Raytheon |
| Union, WV | 4 | Monroe | — | — | gazetteer_centroid | Collins Aerospace |
| Wichita Falls, TX | 4 | Wichita | 48660 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Wilsonville, OR | 4 | Clackamas | 38900 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Aberdeen, MD | 3 | Harford | 12580 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos |
| Annapolis Junction, MD | 3 | Anne Arundel | 12580 | county_crosswalk | street_guess:1 Main St | Collins Aerospace; Leidos |
| Bellevue, IA | 3 | Jackson | — | — | gazetteer_centroid | Collins Aerospace |
| College Park, GA | 3 | Fulton | 12060 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos |
| Denver, CO | 3 | Denver | 19740 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| Fort Bliss, TX | 3 | El Paso | 21340 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| Fort Worth, TX | 3 | Tarrant | 19100 | county_crosswalk | gazetteer_centroid | L3Harris; Leidos; System High |
| Las Cruces, NM | 3 | Doña Ana | 29740 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| Poulsbo, WA | 3 | Kitsap | 14740 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| San Jose, CA | 3 | Santa Clara | 41940 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos |
| Springfield, IL | 3 | Sangamon | 44100 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos |
| Tinker Afb, OK | 3 | Oklahoma | 36420 | county_crosswalk | military_installation:Tinker Air Force Base | Pratt & Whitney |
| Virgin, UT | 3 | Washington | 41100 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Washington, DC | 3 | District of Columbia | 47900 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos; Raytheon |
| White Sands, NM | 3 | Doña Ana | 29740 | county_crosswalk | gazetteer_centroid | Raytheon |
| Andrews Afb, MD | 2 | Prince George's | 47900 | county_crosswalk | gazetteer_centroid | Raytheon |
| Ashburn, VA | 2 | Loudoun | 47900 | county_crosswalk | gazetteer_centroid | L3Harris; Leidos |
| Beale Afb, CA | 2 | Yuba | 49700 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Raytheon |
| Bedford, MA | 2 | Middlesex | 14460 | county_crosswalk | street_guess:100 Main St | Leidos; System High |
| Bothell, WA | 2 | King | 42660 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Cape Canaveral, FL | 2 | Brevard | 37340 | county_crosswalk | gazetteer_centroid | L3Harris; Leidos |
| Charlottesville, VA | 2 | Charlottesville | 16820 | county_crosswalk | gazetteer_centroid | Leidos; Pratt & Whitney |
| Dahlgren, VA | 2 | King George | — | — | gazetteer_centroid | L3Harris; Leidos |
| Des Plaines, IL | 2 | Cook | 16980 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos |
| Edwards Afb, CA | 2 | Kern | 12540 | county_crosswalk | gazetteer_centroid | Pratt & Whitney; Raytheon |
| Fort Belvoir, VA | 2 | Fairfax | 47900 | county_crosswalk | gazetteer_centroid | Leidos; System High |
| Grand Prairie, TX | 2 | Dallas | 19100 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Hurlburt Field, FL | 2 | Okaloosa | 18880 | county_crosswalk | gazetteer_centroid | L3Harris; Leidos |
| Livermore, CA | 2 | Alameda | 41860 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Marana, AZ | 2 | Pima | 46060 | county_crosswalk | gazetteer_centroid | Leidos; Raytheon |
| Medley, FL | 2 | Miami-Dade | 33100 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Miamisburg, OH | 2 | Montgomery | 19430 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Monroe, NC | 2 | Union | 16740 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Moorestown, NJ | 2 | Burlington | 37980 | county_crosswalk | street_guess:1 Main St | Raytheon |
| North Charleston, SC | 2 | Charleston | 16700 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos |
| Pascagoula, MS | 2 | Jackson | 25060 | county_crosswalk | gazetteer_centroid | Raytheon |
| Pittsfield, MA | 2 | Berkshire | 38340 | county_crosswalk | gazetteer_centroid | Raytheon |
| Richmond, VA | 2 | Richmond | 40060 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris; Raytheon |
| San Miguel, CA | 2 | Contra Costa | 41860 | county_crosswalk | gazetteer_centroid | Raytheon |
| Simpsonville, SC | 2 | Greenville | 24860 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Warner Robins, GA | 2 | Houston | 47580 | county_crosswalk | gazetteer_centroid | Raytheon |
| West Palm Beach, FL | 2 | Palm Beach | 33100 | county_crosswalk | gazetteer_centroid | L3Harris; Pratt & Whitney |
| Abingdon, MD | 1 | Harford | 12580 | county_crosswalk | gazetteer_centroid | Leidos |
| Adelphi, MD | 1 | Prince George's | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Aiea, HI | 1 | Honolulu | 46520 | county_crosswalk | gazetteer_centroid | Leidos |
| Albany, OR | 1 | Linn | 10540 | county_crosswalk | gazetteer_centroid | Leidos |
| Allentown, PA | 1 | Lehigh | 10900 | county_crosswalk | gazetteer_centroid | Leidos |
| Alpharetta, GA | 1 | Fulton | 12060 | county_crosswalk | gazetteer_centroid | L3Harris |
| Ann Arbor, MI | 1 | Washtenaw | 11460 | county_crosswalk | gazetteer_centroid | Leidos |
| Anniston, AL | 1 | Calhoun | 11500 | county_crosswalk | gazetteer_centroid | Leidos |
| Arnold, MO | 1 | Jefferson | 41180 | county_crosswalk | gazetteer_centroid | Leidos |
| Ashaway, RI | 1 | Washington | 39300 | county_crosswalk | gazetteer_centroid | L3Harris |
| Auburn, WA | 1 | King | 42660 | county_crosswalk | gazetteer_centroid | Leidos |
| Augusta, GA | 1 | Richmond | 12260 | county_crosswalk | street_guess:1 Broadway | Leidos |
| Aurora, IL | 1 | Kane | 16980 | county_crosswalk | gazetteer_centroid | L3Harris |
| Austin, TX | 1 | Travis | 12420 | county_crosswalk | gazetteer_centroid | Collins Aerospace; Leidos; Pratt & Whitney; Raytheon |
| Barstow, CA | 1 | San Bernardino | 40140 | county_crosswalk | gazetteer_centroid | Leidos |
| Baton Rouge, LA | 1 | East Baton Rouge | 12940 | county_crosswalk | gazetteer_centroid | Leidos |
| Beaufort, SC | 1 | Beaufort | 25940 | county_crosswalk | gazetteer_centroid | Leidos |
| Beavercreek, OH | 1 | Greene | 19430 | county_crosswalk | gazetteer_centroid | Leidos |
| Bethesda, MD | 1 | Montgomery | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Bethlehem, PA | 1 | Northampton | 10900 | county_crosswalk | gazetteer_centroid | Leidos |
| Big Rapids, MI | 1 | Mecosta | 13660 | county_crosswalk | gazetteer_centroid | Leidos |
| Bohemia, NY | 1 | Suffolk | 35620 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Bristol, PA | 1 | Bucks | 37980 | county_crosswalk | gazetteer_centroid | L3Harris |
| Buckhannon, WV | 1 | Upshur | — | — | gazetteer_centroid | Leidos |
| California, MD | 1 | St. Mary's | 15680 | county_crosswalk | gazetteer_centroid | Leidos |
| Cambridge, MA | 1 | Middlesex | 14460 | county_crosswalk | gazetteer_centroid | Raytheon |
| Camp Springs, MD | 1 | Prince George's | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Carbondale, IL | 1 | Jackson | 16060 | county_crosswalk | gazetteer_centroid | Leidos |
| Carlisle, PA | 1 | Cumberland | 25420 | county_crosswalk | gazetteer_centroid | Leidos |
| Carlstadt, NJ | 1 | Bergen | 35620 | county_crosswalk | gazetteer_centroid | L3Harris |
| Carson City, NV | 1 | El Paso | 17820 | county_crosswalk | military_installation:Fort Carson | Collins Aerospace |
| Centennial, CO | 1 | Arapahoe | 19740 | county_crosswalk | gazetteer_centroid | Leidos |
| Chandler, AZ | 1 | Maricopa | 38060 | county_crosswalk | gazetteer_centroid | Leidos |
| Charleston AFB, SC | 1 | Charleston | 16700 | county_crosswalk | street_guess:1 Broadway | Leidos |
| Cherry Point, NC | 1 | Craven | 35100 | county_crosswalk | military_installation:Marine Corps Air Station Cherry Point | Pratt & Whitney |
| Clarksburg, WV | 1 | Harrison | 17220 | county_crosswalk | gazetteer_centroid | Leidos |
| Cleveland, OH | 1 | Cuyahoga | 17460 | county_crosswalk | gazetteer_centroid | Leidos |
| Clifton, NJ | 1 | Passaic | 35620 | county_crosswalk | gazetteer_centroid | L3Harris |
| Clinton, MD | 1 | Prince George's | 47900 | county_crosswalk | gazetteer_centroid | L3Harris |
| Clovis, NM | 1 | Curry | 17580 | county_crosswalk | gazetteer_centroid | Leidos |
| Collinsville, IL | 1 | Madison | 41180 | county_crosswalk | gazetteer_centroid | Leidos |
| Concord, MA | 1 | Middlesex | 14460 | county_crosswalk | street_guess:1 Main St | Leidos |
| Corpus Christi, TX | 1 | Nueces | 18580 | county_crosswalk | gazetteer_centroid | Leidos |
| Cypress, CA | 1 | Orange | 31080 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Dayton, OH | 1 | Montgomery | 19430 | county_crosswalk | gazetteer_centroid | Leidos |
| Daytona Beach, FL | 1 | Volusia | 19660 | county_crosswalk | gazetteer_centroid | L3Harris |
| Dearborn, MI | 1 | Wayne | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Del Rio, TX | 1 | Val Verde | 19620 | county_crosswalk | gazetteer_centroid | Leidos |
| Des Moines, WA | 1 | King | 42660 | county_crosswalk | gazetteer_centroid | Leidos |
| Detroit, MI | 1 | Wayne | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Duluth, MN | 1 | St. Louis | 20260 | county_crosswalk | gazetteer_centroid | Leidos |
| Durham, NH | 1 | Strafford | 14460 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Durham, NC | 1 | Durham | 20500 | county_crosswalk | gazetteer_centroid | Leidos |
| Eagan, MN | 1 | Dakota | 33460 | county_crosswalk | gazetteer_centroid | Leidos |
| East Pensacola Heights, FL | 1 | Escambia | 37860 | county_crosswalk | street_guess:1 Main St | L3Harris |
| Easton, PA | 1 | Northampton | 10900 | county_crosswalk | gazetteer_centroid | Leidos |
| Egg Harbor City, NJ | 1 | Atlantic | 12100 | county_crosswalk | gazetteer_centroid | Leidos |
| Egg Harbor Township, NJ | 1 | Ocean | 35620 | county_crosswalk | street_guess:1 Main St | Leidos |
| Eglin Air Force Base, FL | 1 | Walton | 18880 | county_crosswalk | military_installation:Eglin Air Force Base | Leidos |
| Eielson Afb, AK | 1 | Fairbanks North Star | 21820 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| El Dorado Hills, CA | 1 | El Dorado | 40900 | county_crosswalk | gazetteer_centroid | Raytheon |
| Ellsworth AFB, SD | 1 | Meade | 39660 | county_crosswalk | military_installation:Ellsworth Air Force Base | System High |
| Englewood, CO | 1 | Arapahoe | 19740 | county_crosswalk | gazetteer_centroid | Leidos |
| Fairbanks, AK | 1 | Fairbanks North Star | 21820 | county_crosswalk | gazetteer_centroid | Leidos |
| Fall River, MA | 1 | Bristol | 39300 | county_crosswalk | gazetteer_centroid | L3Harris |
| Farmington, MN | 1 | Dakota | 33460 | county_crosswalk | gazetteer_centroid | Leidos |
| Farmington, CT | 1 | Capitol | — | — | street_guess:1 Main St | Raytheon |
| Federal Way, WA | 1 | King | 42660 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Forest, VA | 1 | Bedford | 31340 | county_crosswalk | gazetteer_centroid | L3Harris |
| Fort Benning, GA | 1 | Chattahoochee | 17980 | county_crosswalk | military_installation:Fort Benning | Leidos |
| Fort Campbell, KY | 1 | Montgomery | 17300 | county_crosswalk | military_installation:Fort Campbell | Raytheon |
| Fort George G Meade, MD | 1 | Anne Arundel | 12580 | county_crosswalk | military_installation:Fort Meade | L3Harris |
| Fort Greely, AK | 1 | Southeast Fairbanks | — | — | gazetteer_centroid | Leidos |
| Fort Johnson, LA | 1 | Wayne | 24140 | county_crosswalk | military_installation:Seymour Johnson Air Force Base | Leidos |
| Fort Lauderdale, FL | 1 | Broward | 33100 | county_crosswalk | gazetteer_centroid | Leidos |
| Fort Lewis, WA | 1 | Pierce | 42660 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Fort Meade, MD | 1 | Anne Arundel | 12580 | county_crosswalk | gazetteer_centroid | Leidos |
| Fort Riley, KS | 1 | Riley | 31740 | county_crosswalk | gazetteer_centroid | Leidos |
| Fort Walton Beach, FL | 1 | Okaloosa | 18880 | county_crosswalk | gazetteer_centroid | Leidos |
| Framingham, MA | 1 | Middlesex | 14460 | county_crosswalk | gazetteer_centroid | Leidos |
| Frankfort, KY | 1 | Franklin | 23180 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Frederick, MD | 1 | Frederick | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Freer, TX | 1 | Duval | 10860 | county_crosswalk | gazetteer_centroid | Raytheon |
| Fremont, CA | 1 | Alameda | 41860 | county_crosswalk | gazetteer_centroid | Leidos |
| Gainesville, FL | 1 | Alachua | 23540 | county_crosswalk | gazetteer_centroid | Leidos |
| Gaithersburg, MD | 1 | Montgomery | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Gardena, CA | 1 | Los Angeles | 31080 | county_crosswalk | gazetteer_centroid | L3Harris |
| Gibsonia, PA | 1 | Allegheny | 38300 | county_crosswalk | gazetteer_centroid | Leidos |
| Glastonbury, CT | 1 | Capitol | — | — | street_guess:1 Main St | Pratt & Whitney |
| Glendale, AZ | 1 | Maricopa | 38060 | county_crosswalk | gazetteer_centroid | Leidos |
| Goodfellow AFB, TX | 1 | Tom Green | 41660 | county_crosswalk | military_installation:Goodfellow Air Force Base | Leidos |
| Goose Creek, SC | 1 | Berkeley | 16700 | county_crosswalk | gazetteer_centroid | Leidos |
| Grand Rapids, MI | 1 | Kent | 24340 | county_crosswalk | gazetteer_centroid | Leidos |
| Great Lakes, IL | 1 | Lake | 16980 | county_crosswalk | military_installation:Naval Station Great Lakes | Leidos |
| Greenbelt, MD | 1 | Prince George's | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Groton, CT | 1 | Southeastern Connecticut | — | — | gazetteer_centroid | Leidos |
| Haltom City, TX | 1 | Tarrant | 19100 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Hammond, LA | 1 | Tangipahoa | 25220 | county_crosswalk | gazetteer_centroid | Leidos |
| Hampton, VA | 1 | Hampton | 47260 | county_crosswalk | gazetteer_centroid | Leidos |
| Harrisburg, PA | 1 | Dauphin | 25420 | county_crosswalk | gazetteer_centroid | Leidos; Pratt & Whitney |
| Harrison Township, MI | 1 | Clare | — | — | street_guess:100 Main St | Leidos |
| Hazel Green, AL | 1 | Madison | 26620 | county_crosswalk | gazetteer_centroid | Leidos |
| Herndon, VA | 1 | Fairfax | 47900 | county_crosswalk | gazetteer_centroid | L3Harris |
| Hertford, NC | 1 | Perquimans | 21020 | county_crosswalk | gazetteer_centroid | Leidos |
| Hickam AFB, HI | 1 | Honolulu | 46520 | county_crosswalk | military_installation:Joint Base Pearl Harbor-Hickam | Leidos |
| Hill Air Force Base, UT | 1 | Davis | 36260 | county_crosswalk | military_installation:Hill Air Force Base | Leidos |
| Hilliard, FL | 1 | Nassau | 27260 | county_crosswalk | gazetteer_centroid | L3Harris |
| Hilton Head Island, SC | 1 | Beaufort | 25940 | county_crosswalk | gazetteer_centroid | L3Harris |
| Homestead, FL | 1 | Miami-Dade | 33100 | county_crosswalk | gazetteer_centroid | Leidos |
| Huntington, WV | 1 | Cabell | 26580 | county_crosswalk | gazetteer_centroid | Leidos |
| Independence, MO | 1 | Jackson | 28140 | county_crosswalk | gazetteer_centroid | Leidos |
| Indian Springs, NV | 1 | Clark | 29820 | county_crosswalk | gazetteer_centroid | Leidos |
| Iuka, MS | 1 | Tishomingo | — | — | gazetteer_centroid | Leidos |
| Jackson, MI | 1 | Jackson | 27100 | county_crosswalk | gazetteer_centroid | Leidos |
| Jamaica, NY | 1 | Queens | 35620 | county_crosswalk | street_guess:1 Broadway | Leidos |
| John C Stennis Space Center, MS | 1 | Hancock | 25060 | county_crosswalk | street_guess:100 Main St | L3Harris |
| Johnston, IA | 1 | Polk | 19780 | county_crosswalk | gazetteer_centroid | Leidos |
| Junction City, KS | 1 | Geary | 31740 | county_crosswalk | gazetteer_centroid | Leidos |
| Kahului, HI | 1 | Maui | 27980 | county_crosswalk | gazetteer_centroid | Leidos |
| Kalamazoo, MI | 1 | Kalamazoo | 28020 | county_crosswalk | gazetteer_centroid | Leidos |
| Kansas City, MO | 1 | Jackson | 28140 | county_crosswalk | gazetteer_centroid | Leidos |
| Kennedy Space Center, FL | 1 | Metcalfe | 23980 | county_crosswalk | street_guess:1 Main St | Leidos |
| Keyport, WA | 1 | Kitsap | 14740 | county_crosswalk | gazetteer_centroid | Leidos |
| Killeen, TX | 1 | Bell | 28660 | county_crosswalk | gazetteer_centroid | Leidos |
| Kingsville, TX | 1 | Kleberg | 28780 | county_crosswalk | gazetteer_centroid | Leidos |
| Lafayette, CO | 1 | Boulder | 14500 | county_crosswalk | gazetteer_centroid | Raytheon |
| Lafayette, LA | 1 | Lafayette | 29180 | county_crosswalk | gazetteer_centroid | Leidos |
| Lake Suzy, FL | 1 | Lake | 16980 | county_crosswalk | military_installation:Naval Station Great Lakes | Collins Aerospace |
| Lakewood, CA | 1 | Los Angeles | 31080 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Lancaster, PA | 1 | Lancaster | 29540 | county_crosswalk | gazetteer_centroid | Leidos |
| Laurel, MD | 1 | Prince George's | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Lexington, KY | 1 | Fayette | 30460 | county_crosswalk | street_guess:100 Main St | Leidos |
| Lexington Park, MD | 1 | St. Mary's | 15680 | county_crosswalk | gazetteer_centroid | L3Harris |
| Linthicum, MD | 1 | Anne Arundel | 12580 | county_crosswalk | gazetteer_centroid | Leidos |
| Londonderry, NH | 1 | Rockingham | 14460 | county_crosswalk | gazetteer_centroid | L3Harris |
| Long Beach, MS | 1 | Harrison | 25060 | county_crosswalk | gazetteer_centroid | Leidos |
| Longmont, CO | 1 | Boulder | 14500 | county_crosswalk | gazetteer_centroid | Leidos |
| Lorton, VA | 1 | Fairfax | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Loveland, CO | 1 | Larimer | 22660 | county_crosswalk | gazetteer_centroid | L3Harris |
| Lubbock, TX | 1 | Lubbock | 31180 | county_crosswalk | gazetteer_centroid | Leidos |
| Lynnwood, WA | 1 | Snohomish | 42660 | county_crosswalk | gazetteer_centroid | Leidos |
| Madison, WI | 1 | Dane | 31540 | county_crosswalk | gazetteer_centroid | Leidos |
| Marine Corps Base Kaneohe Bay, HI | 1 | Camden | 41220 | county_crosswalk | military_installation:Naval Submarine Base Kings Bay | Leidos |
| Marysville, CA | 1 | Yuba | 49700 | county_crosswalk | gazetteer_centroid | Leidos |
| Mason, OH | 1 | Warren | 17140 | county_crosswalk | gazetteer_centroid | L3Harris |
| Mcalester, OK | 1 | Pittsburg | 32540 | county_crosswalk | gazetteer_centroid | Raytheon |
| McLean, VA | 1 | Fairfax | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Mechanicsburg, PA | 1 | Cumberland | 25420 | county_crosswalk | gazetteer_centroid | Leidos |
| Meridian, ID | 1 | Ada | 14260 | county_crosswalk | gazetteer_centroid | Leidos |
| Merritt Island, FL | 1 | Brevard | 37340 | county_crosswalk | gazetteer_centroid | Leidos |
| Milford, MI | 1 | Oakland | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Millington, TN | 1 | Shelby | 32820 | county_crosswalk | gazetteer_centroid | Leidos |
| Minot, ND | 1 | Ward | 33500 | county_crosswalk | gazetteer_centroid | Leidos |
| Muskegon, MI | 1 | Muskegon | 34740 | county_crosswalk | gazetteer_centroid | Leidos |
| Natick, MA | 1 | Middlesex | 14460 | county_crosswalk | street_guess:1 Main St | Leidos |
| Nellis Afb, NV | 1 | Clark | 29820 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| New Kent, VA | 1 | New Kent | 40060 | county_crosswalk | gazetteer_centroid | Raytheon |
| New York, NY | 1 | Kings | 35620 | county_crosswalk | gazetteer_centroid | Leidos |
| Newark, NJ | 1 | Essex | 35620 | county_crosswalk | gazetteer_centroid | Leidos |
| Newport, RI | 1 | Newport | 39300 | county_crosswalk | gazetteer_centroid | Leidos |
| Newport News, VA | 1 | Newport News | 47260 | county_crosswalk | gazetteer_centroid | Raytheon |
| Nimitz Hill, GU | 1 | Johnson | 26980 | county_crosswalk | street_guess:100 Main St | Leidos |
| Norco, CA | 1 | Riverside | 40140 | county_crosswalk | gazetteer_centroid | Leidos |
| North Amityville, NY | 1 | Suffolk | 35620 | county_crosswalk | gazetteer_centroid | L3Harris |
| North Fort Lewis, WA | 1 | Pierce | 42660 | county_crosswalk | gazetteer_centroid | L3Harris |
| North Las Vegas, NV | 1 | Clark | 29820 | county_crosswalk | gazetteer_centroid | Leidos |
| North Logan, UT | 1 | Cache | 30860 | county_crosswalk | gazetteer_centroid | Raytheon |
| Northampton, MA | 1 | Hampshire | 44140 | county_crosswalk | gazetteer_centroid | L3Harris |
| Norton Shores, MI | 1 | Muskegon | 34740 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Oak Ridge, TN | 1 | Anderson | 28940 | county_crosswalk | gazetteer_centroid | Leidos |
| Oakland, CA | 1 | Alameda | 41860 | county_crosswalk | gazetteer_centroid | Leidos |
| Oceanside, CA | 1 | San Diego | 41740 | county_crosswalk | gazetteer_centroid | Leidos |
| Odenton, MD | 1 | Anne Arundel | 12580 | county_crosswalk | gazetteer_centroid | Leidos |
| Offutt Air Force Base, NE | 1 | Sarpy | 36540 | county_crosswalk | military_installation:Offutt Air Force Base | L3Harris |
| Ogden, UT | 1 | Weber | 36260 | county_crosswalk | gazetteer_centroid | Leidos |
| Olathe, KS | 1 | Johnson | 28140 | county_crosswalk | gazetteer_centroid | L3Harris |
| Olympia, WA | 1 | Thurston | 36500 | county_crosswalk | gazetteer_centroid | Collins Aerospace; L3Harris |
| Ontario, CA | 1 | San Bernardino | 40140 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Orange, VA | 1 | Orange | — | — | gazetteer_centroid | L3Harris |
| Oxnard, CA | 1 | Ventura | 37100 | county_crosswalk | gazetteer_centroid | Leidos |
| Palmdale, CA | 1 | Los Angeles | 31080 | county_crosswalk | gazetteer_centroid | Leidos |
| Parkersburg, WV | 1 | Wood | 37620 | county_crosswalk | gazetteer_centroid | Leidos |
| Pasadena, CA | 1 | Los Angeles | 31080 | county_crosswalk | gazetteer_centroid | Raytheon |
| Patuxent River, MD | 1 | St. Mary's | 15680 | county_crosswalk | military_installation:Naval Air Station Patuxent River | Pratt & Whitney |
| Pearl Harbor, HI | 1 | Honolulu | 46520 | county_crosswalk | military_installation:Joint Base Pearl Harbor-Hickam | Leidos |
| Picatinny Arsenal, NJ | 1 | Morris | 35620 | county_crosswalk | military_installation:Picatinny Arsenal | Leidos |
| Plymouth, MI | 1 | Wayne | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Pontiac, MI | 1 | Oakland | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Port Hueneme, CA | 1 | Ventura | 37100 | county_crosswalk | gazetteer_centroid | L3Harris |
| Port Huron, MI | 1 | St. Clair | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Portsmouth, VA | 1 | Portsmouth | 47260 | county_crosswalk | gazetteer_centroid | Leidos |
| Premont, TX | 1 | Jim Wells | 10860 | county_crosswalk | gazetteer_centroid | Raytheon |
| Princeton, NJ | 1 | Mercer | 45940 | county_crosswalk | gazetteer_centroid | Leidos |
| Rancho Cordova, CA | 1 | Sacramento | 40900 | county_crosswalk | gazetteer_centroid | Leidos |
| Reading, PA | 1 | Berks | 39740 | county_crosswalk | gazetteer_centroid | Leidos |
| Redmond, WA | 1 | King | 42660 | county_crosswalk | gazetteer_centroid | L3Harris |
| Reston, VA | 1 | Fairfax | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Ridgecrest, CA | 1 | Kern | 12540 | county_crosswalk | gazetteer_centroid | Leidos |
| Robins AFB, GA | 1 | Houston | 47580 | county_crosswalk | gazetteer_centroid | System High |
| Rock Island, IL | 1 | Rock Island | 19340 | county_crosswalk | gazetteer_centroid | Leidos |
| Rockville, MD | 1 | Montgomery | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Rockwall, TX | 1 | Rockwall | 19100 | county_crosswalk | gazetteer_centroid | L3Harris |
| Saginaw, MI | 1 | Saginaw | 40980 | county_crosswalk | gazetteer_centroid | Leidos |
| San Angelo, TX | 1 | Tom Green | 41660 | county_crosswalk | gazetteer_centroid | Leidos |
| San Dimas, CA | 1 | Los Angeles | 31080 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| San Francisco, CA | 1 | San Francisco | 41860 | county_crosswalk | gazetteer_centroid | Leidos |
| San Juan, PR | 1 | San Juan | 41980 | county_crosswalk | street_guess:1 Main St | Collins Aerospace; Pratt & Whitney |
| Santa Ana, CA | 1 | Orange | 31080 | county_crosswalk | gazetteer_centroid | Leidos |
| Schriever Afb, CO | 1 | Terrebonne | 26380 | county_crosswalk | street_guess:100 Main St | Raytheon |
| Schriever AFB, CO | 1 | Terrebonne | 26380 | county_crosswalk | street_guess:100 Main St | L3Harris |
| Scott AFB, IL | 1 | St. Clair | 41180 | county_crosswalk | gazetteer_centroid | System High |
| Scott Air Force Base, IL | 1 | St. Clair | 41180 | county_crosswalk | military_installation:Scott Air Force Base | Leidos |
| Scottsdale, AZ | 1 | Maricopa | 38060 | county_crosswalk | gazetteer_centroid | Raytheon |
| Seaside, CA | 1 | Monterey | 41500 | county_crosswalk | gazetteer_centroid | Leidos |
| Seattle, WA | 1 | King | 42660 | county_crosswalk | gazetteer_centroid | Leidos |
| Seven Fields, PA | 1 | Butler | 38300 | county_crosswalk | gazetteer_centroid | Leidos |
| Shalimar, FL | 1 | Okaloosa | 18880 | county_crosswalk | gazetteer_centroid | Leidos |
| Silverdale, WA | 1 | Kitsap | 14740 | county_crosswalk | gazetteer_centroid | Leidos |
| South Plainfield, NJ | 1 | Middlesex | 35620 | county_crosswalk | gazetteer_centroid | Leidos |
| Southfield, MI | 1 | Oakland | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Sparks, NV | 1 | Washoe | 39900 | county_crosswalk | gazetteer_centroid | Leidos |
| Spokane Valley, WA | 1 | Spokane | 44060 | county_crosswalk | gazetteer_centroid | Leidos |
| St. Augustine, FL | 1 | St. Johns | 27260 | county_crosswalk | gazetteer_centroid | Leidos |
| St. Louis, MO | 1 | St. Louis | 41180 | county_crosswalk | gazetteer_centroid | Leidos |
| St. Paul, MN | 1 | Ramsey | 33460 | county_crosswalk | gazetteer_centroid | Leidos |
| St. Petersburg, FL | 1 | Pinellas | 45300 | county_crosswalk | gazetteer_centroid | Leidos |
| Stafford, VA | 1 | Stafford | 47900 | county_crosswalk | street_guess:1 Main St | L3Harris |
| Stamford, CT | 1 | Western Connecticut | — | — | gazetteer_centroid | Leidos |
| Stennis Space Center, MS | 1 | Hancock | 25060 | county_crosswalk | street_guess:100 Main St | Leidos |
| Sterling Heights, MI | 1 | Macomb | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Suffolk, VA | 1 | Suffolk | 47260 | county_crosswalk | gazetteer_centroid | Leidos |
| Suitland, MD | 1 | Prince George's | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Sunrise, FL | 1 | Broward | 33100 | county_crosswalk | gazetteer_centroid | L3Harris |
| Tacoma, WA | 1 | Pierce | 42660 | county_crosswalk | gazetteer_centroid | Leidos |
| Tampa, FL | 1 | Hillsborough | 45300 | county_crosswalk | gazetteer_centroid | Leidos |
| Tempe, AZ | 1 | Maricopa | 38060 | county_crosswalk | gazetteer_centroid | L3Harris |
| Terre Haute, IN | 1 | Vigo | 45460 | county_crosswalk | gazetteer_centroid | Leidos |
| The Woodlands, TX | 1 | Montgomery | 26420 | county_crosswalk | gazetteer_centroid | Leidos |
| Toledo, OH | 1 | Lucas | 45780 | county_crosswalk | gazetteer_centroid | Leidos |
| Traverse City, MI | 1 | Grand Traverse | 45900 | county_crosswalk | gazetteer_centroid | Leidos |
| Twentynine Palms, CA | 1 | San Bernardino | 40140 | county_crosswalk | gazetteer_centroid | Leidos |
| Uniontown, OH | 1 | Stark | 15940 | county_crosswalk | gazetteer_centroid | Collins Aerospace |
| Vancouver, WA | 1 | Clark | 38900 | county_crosswalk | gazetteer_centroid | Leidos |
| Vienna, VA | 1 | Fairfax | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Vista, CA | 1 | San Diego | 41740 | county_crosswalk | gazetteer_centroid | Leidos |
| Waco, TX | 1 | McLennan | 47380 | county_crosswalk | gazetteer_centroid | L3Harris |
| Wahiawa, HI | 1 | Honolulu | 46520 | county_crosswalk | gazetteer_centroid | Leidos |
| Walled Lake, MI | 1 | Oakland | 19820 | county_crosswalk | gazetteer_centroid | Leidos |
| Warrenton, VA | 1 | Fauquier | 47900 | county_crosswalk | gazetteer_centroid | Leidos |
| Washington D.C., DC | 1 | District of Columbia | 47900 | county_crosswalk | street_guess:1 Main St | L3Harris |
| Washington Navy Yard, DC | 1 | District of Columbia | 47900 | county_crosswalk | street_guess:1 Main St | L3Harris |
| Webster, TX | 1 | Harris | 26420 | county_crosswalk | gazetteer_centroid | Leidos |
| Whitehall, OH | 1 | Franklin | 18140 | county_crosswalk | gazetteer_centroid | Leidos |
| Whiteman AFB, MO | 1 | Johnson | 47660 | county_crosswalk | gazetteer_centroid | Leidos |
| Williamsport, PA | 1 | Lycoming | 48700 | county_crosswalk | gazetteer_centroid | Leidos |
| Wilmington, MA | 1 | Middlesex | 14460 | county_crosswalk | gazetteer_centroid | L3Harris |
| Worcester, MA | 1 | Worcester | 49340 | county_crosswalk | gazetteer_centroid | Leidos |
| Wright-Patterson Afb, OH | 1 | Greene | 19430 | county_crosswalk | gazetteer_centroid | Pratt & Whitney |
| Wright-Patterson AFB, OH | 1 | Greene | 19430 | county_crosswalk | gazetteer_centroid | System High |
| Wrightstown, NJ | 1 | Burlington | 37980 | county_crosswalk | gazetteer_centroid | Leidos |
| Yorba Linda, CA | 1 | Orange | 31080 | county_crosswalk | gazetteer_centroid | L3Harris |
| York, PA | 1 | York | 49620 | county_crosswalk | gazetteer_centroid | Leidos |
| Yorktown, VA | 1 | York | 47260 | county_crosswalk | gazetteer_centroid | Leidos |
| Youngstown, OH | 1 | Mahoning | 49660 | county_crosswalk | gazetteer_centroid | Leidos |
