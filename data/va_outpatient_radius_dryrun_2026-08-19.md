# VA outpatient access radius — dry-run projection (2026-08-19)

Produced by `scripts/sync-va-facilities.ts --dry-run` on the branch that changes
`has_va` from a 0.5-mile gate to `OUTPATIENT_ACCESS_RADIUS_MI = 25`.
No production write was performed from this branch (see AGENTS.md).

- Cities evaluated: **140** (McHenry, MS omitted — no city centroid; see #55).
- `has_va = true` under the 25-mile gate: **138 / 140** (live today: 7 / 141).
- Of those, the nearest outpatient-capable site is a VA medical center, so the
  `healthcare=va_hospital` facet matches: **21**.
- Falls outside the gate: Camden, AR (26 mi), Forest, MS (40 mi).

| City | Nearest outpatient-capable | kind | mi | has_va | Nearest VAMC | mi |
| --- | --- | --- | ---: | :---: | --- | ---: |
| Akron, OH | Summit County VA Clinic | outpatient | 1 | yes | Louis Stokes Cleveland Department of Veterans Affairs Medical Center | 30 |
| Albany, NY | Samuel S. Stratton Department of Veterans Affairs Medical Center | outpatient | 2 | yes | Edward P. Boland Department of Veterans Affairs Medical Center | 61 |
| Albuquerque, NM | Raymond G. Murphy Department of Veterans Affairs Medical Center | hospital | 5 | yes | Raymond G. Murphy Department of Veterans Affairs Medical Center | 5 |
| Amarillo, TX | Amarillo VA Mobile Clinic | outpatient | 4 | yes | Thomas E. Creek Department of Veterans Affairs Medical Center | 4 |
| Anchorage, AK | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | hospital | 16 | yes | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | 16 |
| Asheville, NC | Charles George Department of Veterans Affairs Medical Center | hospital | 4 | yes | Charles George Department of Veterans Affairs Medical Center | 4 |
| Ashville, OH | Grove City VA Clinic | outpatient | 11 | yes | Chillicothe VA Medical Center | 23 |
| Atlanta, GA | Fort McPherson VA Clinic | outpatient | 4 | yes | Joseph Maxwell Cleland Atlanta VA Medical Center | 7 |
| Baltimore, MD | Baltimore VA Clinic | outpatient | 1 | yes | Baltimore VA Medical Center | 1 |
| Bangor, ME | Bangor VA Clinic | outpatient | 3 | yes | Togus VA Medical Center | 59 |
| Bath, ME | Lewiston VA Clinic | outpatient | 20 | yes | Togus VA Medical Center | 25 |
| Bellevue, WA | Seattle VA Mobile Clinic | outpatient | 7 | yes | Seattle VA Medical Center | 8 |
| Bend, OR | Robert D. Maxwell Department of Veterans Affairs Clinic | outpatient | 2 | yes | Roseburg VA Medical Center | 118 |
| Billings, MT | Benjamin Charles Steele VA Clinic | outpatient | 4 | yes | Sheridan VA Medical Center | 101 |
| Binghamton, NY | Binghamton VA Clinic | outpatient | 0 | yes | Wilkes-Barre VA Medical Center | 59 |
| Boise, ID | Boise VA Medical Center | hospital | 2 | yes | Boise VA Medical Center | 2 |
| Boston, MA | Causeway VA Clinic | outpatient | 3 | yes | Jamaica Plain VA Medical Center | 5 |
| Boulder, CO | Golden VA Clinic | outpatient | 20 | yes | Rocky Mountain Regional VA Medical Center | 30 |
| Bowling Green, KY | Bowling Green VA Clinic | outpatient | 1 | yes | Nashville VA Medical Center | 61 |
| Bremerton, WA | Silverdale VA Clinic | outpatient | 8 | yes | Seattle VA Medical Center | 19 |
| Bridgeport, CT | Orange VA Clinic | outpatient | 11 | yes | West Haven VA Medical Center | 14 |
| Broomfield, CO | York Street VA Clinic | outpatient | 14 | yes | Rocky Mountain Regional VA Medical Center | 19 |
| Burlington, VT | Burlington Lakeside VA Clinic | outpatient | 2 | yes | White River Junction VA Medical Center | 73 |
| Burnsville, MN | Richfield VA Clinic | outpatient | 8 | yes | Minneapolis VA Medical Center | 10 |
| Camden, AR | El Dorado VA Clinic | outpatient | 26 | no | John L. McClellan Memorial Veterans' Hospital | 87 |
| Carroll, IA | Carroll VA Clinic | outpatient | 1 | yes | Omaha VA Medical Center | 81 |
| Casper, WY | Casper VA Clinic | outpatient | 4 | yes | Sheridan VA Medical Center | 141 |
| Chantilly, VA | Montgomery County VA Clinic | outpatient | 21 | yes | Washington VA Medical Center | 23 |
| Charleston, WV | Charleston VA Clinic | outpatient | 7 | yes | Beckley VA Medical Center | 47 |
| Cheyenne, WY | Cheyenne VA Medical Center | hospital | 1 | yes | Cheyenne VA Medical Center | 1 |
| Chicago, IL | Chicago VA Clinic | outpatient | 2 | yes | Jesse Brown Department of Veterans Affairs Medical Center | 2 |
| Cincinnati, OH | Cincinnati 1 VA Mobile Clinic | outpatient | 0 | yes | Cincinnati VA Medical Center | 0 |
| Cody, WY | Cody VA Clinic | outpatient | 0 | yes | Sheridan VA Medical Center | 104 |
| Colorado Springs, CO | Union Boulevard VA Clinic | outpatient | 2 | yes | Rocky Mountain Regional VA Medical Center | 61 |
| Columbus, GA | Columbus Downtown VA Clinic | outpatient | 6 | yes | Central Alabama VA Medical Center-Montgomery | 80 |
| Columbus, OH | Columbus VA Clinic | outpatient | 3 | yes | Chillicothe VA Medical Center | 41 |
| Costa Mesa, CA | Santa Ana VA Clinic | outpatient | 5 | yes | Tibor Rubin VA Medical Center | 14 |
| Crestview, FL | Eglin Air Force Base VA Clinic | outpatient | 20 | yes | Central Alabama VA Medical Center-Montgomery | 114 |
| Dallas, TX | Dallas VA Medical Center | hospital | 7 | yes | Dallas VA Medical Center | 7 |
| Danville, IL | Danville VA Medical Center | hospital | 1 | yes | Danville VA Medical Center | 1 |
| Decorah, IA | Decorah VA Clinic | outpatient | 1 | yes | Tomah VA Medical Center | 81 |
| Des Moines, IA | Des Moines VA Clinic | outpatient | 2 | yes | Omaha VA Medical Center | 125 |
| El Paso, TX | El Paso Northeast VA Clinic | outpatient | 2 | yes | Raymond G. Murphy Department of Veterans Affairs Medical Center | 222 |
| Elko, NV | Elko VA Clinic | outpatient | 1 | yes | Boise VA Medical Center | 193 |
| Eureka, CA | Eureka VA Clinic | outpatient | 2 | yes | White City VA Medical Center | 132 |
| Fargo, ND | North Fargo VA Clinic | outpatient | 2 | yes | Fargo VA Medical Center | 4 |
| Fayetteville, NC | Raeford Road VA Clinic | outpatient | 3 | yes | Fayetteville VA Medical Center | 5 |
| Florence, AL | Florence VA Clinic | outpatient | 6 | yes | Nashville VA Medical Center | 103 |
| Forest, MS | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | hospital | 40 | no | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | 40 |
| Fort Collins, CO | Fort Collins VA Clinic | outpatient | 1 | yes | Cheyenne VA Medical Center | 44 |
| Fort Stockton, TX | Fort Stockton VA Clinic | outpatient | 1 | yes | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 124 |
| Fort Wayne, IN | Fort Wayne VA Medical Center | outpatient | 2 | yes | Marion VA Medical Center | 47 |
| Fresno, CA | Fresno VA Medical Center | hospital | 1 | yes | Fresno VA Medical Center | 1 |
| Gilbert, AZ | Staff Sergeant Alexander W. Conrad Veterans Affairs Health Care Clinic | outpatient | 1 | yes | Carl T. Hayden Veterans' Administration Medical Center | 23 |
| Goleta, CA | Santa Barbara VA Clinic | outpatient | 5 | yes | West Los Angeles VA Medical Center | 84 |
| Grand Forks, ND | Grand Forks VA Clinic | outpatient | 2 | yes | Fargo VA Medical Center | 72 |
| Grand Junction, CO | Western Colorado VA Mobile Clinic | outpatient | 2 | yes | Grand Junction VA Medical Center | 2 |
| Great Falls, MT | Great Falls VA Clinic | outpatient | 2 | yes | Fort Harrison VA Medical Center | 72 |
| Greenville, SC | Lance Corporal Dana Cornell Darnell VA Clinic | outpatient | 3 | yes | Charles George Department of Veterans Affairs Medical Center | 52 |
| Hamilton, WA | Mount Vernon VA Clinic | outpatient | 17 | yes | Seattle VA Medical Center | 68 |
| Hartford, CT | Newington VA Clinic | outpatient | 5 | yes | West Haven VA Medical Center | 36 |
| Honolulu, HI | Spark M. Matsunaga Department of Veterans Affairs Medical Center | hospital | 4 | yes | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 4 |
| Houston, TX | Houston Webster VA Clinic | outpatient | 3 | yes | Michael E. DeBakey Department of Veterans Affairs Medical Center | 6 |
| Hudson, NH | Lowell VA Clinic | outpatient | 12 | yes | Manchester VA Medical Center | 17 |
| Huntsville, AL | Huntsville VA Clinic | outpatient | 4 | yes | Birmingham VA Medical Center | 83 |
| Idaho Falls, ID | Idaho Falls VA Clinic | outpatient | 2 | yes | George E. Wahlen Department of Veterans Affairs Medical Center | 189 |
| Indian Trail, NC | North Charlotte VA Clinic | outpatient | 16 | yes | W.G. (Bill) Hefner Salisbury Department of Veterans Affairs Medical Center | 43 |
| Indianapolis, IN | Indianapolis VA Clinic | outpatient | 1 | yes | Richard L. Roudebush Veterans' Administration Medical Center | 2 |
| Irmo, SC | Wm. Jennings Bryan Dorn Department of Veterans Affairs Medical Center | hospital | 16 | yes | Wm. Jennings Bryan Dorn Department of Veterans Affairs Medical Center | 16 |
| Irvine, CA | Laguna Hills VA Clinic | outpatient | 5 | yes | Tibor Rubin VA Medical Center | 21 |
| Ithaca, NY | Tompkins County VA Clinic | outpatient | 3 | yes | Wilkes-Barre VA Medical Center | 89 |
| Jackson, MS | Jackson 2 VA Mobile Clinic | outpatient | 3 | yes | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | 3 |
| Jamestown, ND | Jamestown VA Clinic | outpatient | 3 | yes | Fargo VA Medical Center | 91 |
| King of Prussia, PA | West Norriton VA Clinic | outpatient | 2 | yes | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 14 |
| Kuna, ID | Boise VA Medical Center | hospital | 13 | yes | Boise VA Medical Center | 13 |
| Lake Forest, CA | Laguna Hills VA Clinic | outpatient | 4 | yes | Tibor Rubin VA Medical Center | 27 |
| Las Vegas, NV | Northwest Las Vegas VA Clinic | outpatient | 2 | yes | North Las Vegas VA Medical Center | 10 |
| Lexington, MA | Edith Nourse Rogers Memorial Veterans' Hospital | hospital | 5 | yes | Edith Nourse Rogers Memorial Veterans' Hospital | 5 |
| Little Rock, AR | Little Rock 2 VA Mobile Clinic | outpatient | 3 | yes | John L. McClellan Memorial Veterans' Hospital | 3 |
| Louisville, KY | Newburg VA Clinic | outpatient | 4 | yes | Robley Rex Department of Veterans Affairs Medical Center | 4 |
| Lynchburg, VA | Private First Class Desmond T. Doss VA Clinic | outpatient | 0 | yes | Salem VA Medical Center | 46 |
| Malabar, FL | Palm Bay VA Clinic | outpatient | 3 | yes | Orlando VA Medical Center | 50 |
| Manchester, NH | Manchester West VA Clinic | outpatient | 2 | yes | Manchester VA Medical Center | 2 |
| Marietta, GA | Cobb County VA Clinic | outpatient | 2 | yes | Joseph Maxwell Cleland Atlanta VA Medical Center | 17 |
| Memphis, TN | Nonconnah Boulevard VA Clinic | outpatient | 3 | yes | Lt. Col. Luke Weathers, Jr. VA Medical Center | 4 |
| Milwaukee, WI | Milwaukee VA Clinic | outpatient | 3 | yes | Clement J. Zablocki Veterans' Administration Medical Center | 3 |
| Minneapolis, MN | Minneapolis VA Clinic | outpatient | 1 | yes | Minneapolis VA Medical Center | 5 |
| Missoula, MT | David J. Thatcher VA Clinic | outpatient | 3 | yes | Fort Harrison VA Medical Center | 93 |
| Mobile, AL | Mobile VA Clinic | outpatient | 6 | yes | Biloxi VA Medical Center | 53 |
| Morrisville, NC | Brier Creek VA Clinic | outpatient | 6 | yes | Durham VA Medical Center | 13 |
| Nashville, TN | Albion Street VA Clinic | outpatient | 1 | yes | Nashville VA Medical Center | 2 |
| New Orleans, LA | New Orleans VA Medical Center | hospital | 11 | yes | New Orleans VA Medical Center | 11 |
| Norfolk, VA | Portsmouth VA Clinic | outpatient | 7 | yes | Hampton VA Medical Center | 8 |
| North Kingstown, RI | Middletown VA Clinic | outpatient | 8 | yes | Providence VA Medical Center | 18 |
| North Platte, NE | North Platte VA Clinic | outpatient | 1 | yes | Cheyenne VA Medical Center | 210 |
| Odessa, TX | Wilson and Young Medal of Honor VA Clinic | outpatient | 4 | yes | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 57 |
| Oklahoma City, OK | Oklahoma City VA Medical Center | hospital | 1 | yes | Oklahoma City VA Medical Center | 1 |
| Omaha, NE | Omaha VA Medical Center | hospital | 4 | yes | Omaha VA Medical Center | 4 |
| Orlando, FL | Orlando 2 VA Mobile Clinic | outpatient | 3 | yes | Orlando VA Medical Center | 3 |
| Overland Park, KS | Overland Park VA Clinic | outpatient | 3 | yes | Kansas City VA Medical Center | 15 |
| Pace, FL | Pensacola VA Clinic | outpatient | 17 | yes | Biloxi VA Medical Center | 107 |
| Paterson, NJ | Paterson VA Clinic | outpatient | 1 | yes | East Orange VA Medical Center | 12 |
| Pensacola, FL | Pensacola VA Clinic | outpatient | 7 | yes | Biloxi VA Medical Center | 105 |
| Philadelphia, PA | Fourth Street VA Clinic | outpatient | 4 | yes | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 5 |
| Phoenix, AZ | Thunderbird VA Clinic | outpatient | 1 | yes | Carl T. Hayden Veterans' Administration Medical Center | 5 |
| Pierre, SD | Pierre VA Clinic | outpatient | 0 | yes | Fort Meade VA Medical Center | 156 |
| Pittsburgh, PA | Pittsburgh VA Medical Center-University Drive | hospital | 1 | yes | Pittsburgh VA Medical Center-University Drive | 1 |
| Portland, ME | Portland VA Clinic | outpatient | 4 | yes | Togus VA Medical Center | 51 |
| Portland, OR | Portland VA Clinic | outpatient | 2 | yes | Portland VA Medical Center | 3 |
| Providence, RI | Eagle Street VA Clinic | outpatient | 1 | yes | Providence VA Medical Center | 1 |
| Pueblo, CO | Pueblo VA Community Living Center | outpatient | 3 | yes | Rocky Mountain Regional VA Medical Center | 103 |
| Quincy, MA | Quincy VA Clinic | outpatient | 1 | yes | Jamaica Plain VA Medical Center | 7 |
| Raleigh, NC | Raleigh III VA Clinic | outpatient | 2 | yes | Durham VA Medical Center | 21 |
| Rapid City, SD | Rapid City VA Clinic | outpatient | 4 | yes | Fort Meade VA Medical Center | 27 |
| Reno, NV | North Reno VA Clinic | outpatient | 3 | yes | Ioannis A. Lougaris Veterans' Administration Medical Center | 4 |
| Rome, NY | Donald J. Mitchell Department of Veterans Affairs Outpatient Clinic | outpatient | 4 | yes | Wilkes-Barre VA Medical Center | 138 |
| Salt Lake City, UT | Salt Lake City VA Mobile Clinic | outpatient | 5 | yes | George E. Wahlen Department of Veterans Affairs Medical Center | 5 |
| San Antonio, TX | Balcones Heights VA Clinic | outpatient | 2 | yes | Audie L. Murphy Memorial Veterans' Hospital | 5 |
| San Diego, CA | Kearny Mesa VA Clinic | outpatient | 0 | yes | Jennifer Moreno Department of Veterans Affairs Medical Center | 7 |
| Savannah, GA | Savannah VA Clinic | outpatient | 3 | yes | Ralph H. Johnson Department of Veterans Affairs Medical Center | 90 |
| Scranton, PA | Wilkes-Barre VA Medical Center | hospital | 14 | yes | Wilkes-Barre VA Medical Center | 14 |
| Shreveport, LA | Overton Brooks Veterans' Administration Medical Center | hospital | 5 | yes | Overton Brooks Veterans' Administration Medical Center | 5 |
| Sierra Vista, AZ | Sierra Vista VA Clinic | outpatient | 2 | yes | Tucson VA Medical Center | 57 |
| Sioux Falls, SD | Royal C. Johnson Veterans' Memorial Hospital | hospital | 1 | yes | Royal C. Johnson Veterans' Memorial Hospital | 1 |
| Spokane, WA | East Front Avenue VA Clinic | outpatient | 2 | yes | Mann-Grandstaff Department of Veterans Affairs Medical Center | 3 |
| St. Charles, MO | St. Charles County VA Clinic | outpatient | 1 | yes | John J. Cochran Veterans Hospital | 19 |
| St. George, UT | St. George VA Clinic | outpatient | 1 | yes | North Las Vegas VA Medical Center | 100 |
| Syracuse, NY | Syracuse VA Medical Center | outpatient | 0 | yes | Wilkes-Barre VA Medical Center | 125 |
| Tucson, AZ | Tucson VA Mobile Clinic | outpatient | 6 | yes | Tucson VA Medical Center | 6 |
| Tullahoma, TN | Tullahoma VA Clinic | outpatient | 11 | yes | Nashville VA Medical Center | 62 |
| Tulsa, OK | Tulsa Eleventh Street VA Clinic | outpatient | 3 | yes | Jack C. Montgomery Department of Veterans Affairs Medical Center | 37 |
| Victorville, CA | Victorville VA Clinic | outpatient | 2 | yes | Jerry L. Pettis Memorial Veterans' Hospital | 33 |
| Virginia Beach, VA | Virginia Beach VA Clinic | outpatient | 9 | yes | Hampton VA Medical Center | 23 |
| Waltham, MA | Jamaica Plain VA Medical Center | hospital | 8 | yes | Jamaica Plain VA Medical Center | 8 |
| Warren, MI | Piquette Street VA Clinic | outpatient | 9 | yes | John D. Dingell Department of Veterans Affairs Medical Center | 10 |
| Warren, PA | Warren County VA Clinic | outpatient | 4 | yes | Erie VA Medical Center | 50 |
| Watertown, NY | Watertown VA Clinic | outpatient | 2 | yes | Buffalo VA Medical Center | 162 |
| Wichita, KS | Sedgwick County VA Clinic | outpatient | 4 | yes | Oklahoma City VA Medical Center | 153 |
| Wilmington, DE | Wilmington VA Medical Center | hospital | 4 | yes | Wilmington VA Medical Center | 4 |
| Yuba City, CA | Yuba City VA Clinic | outpatient | 1 | yes | Ioannis A. Lougaris Veterans' Administration Medical Center | 102 |
