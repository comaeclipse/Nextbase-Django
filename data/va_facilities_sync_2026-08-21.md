# VA facilities sync — 2026-08-21

Source: [VHA Medical Facilities (VAST / ArcGIS)](https://vha.maps.arcgis.com/home/item.html?id=c6821e66523a46f5b32893641b9bd0dd)
Distance method: great-circle miles from city centroid to facility LAT/LON.
Outpatient = nearest clinic/CBOC or medical center (Vet Centers excluded).
`has_va` = nearest outpatient-capable site within 25 miles (crow-fly).
Hospital = nearest parent facility (3-character STA_NO / VA medical center).
`nearest_va_kind` is the kind of that nearest outpatient-capable site.

| City | Outpatient | kind | mi | Hospital | mi |
| --- | --- | --- | ---: | --- | ---: |
| Akron, OH | Summit County VA Clinic | outpatient | 1 | Louis Stokes Cleveland Department of Veterans Affairs Medical Center | 30 |
| Albany, NY | Samuel S. Stratton Department of Veterans Affairs Medical Center | outpatient | 2 | Edward P. Boland Department of Veterans Affairs Medical Center | 61 |
| Albuquerque, NM | Raymond G. Murphy Department of Veterans Affairs Medical Center | hospital | 5 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 5 |
| Amarillo, TX | Amarillo VA Mobile Clinic | outpatient | 4 | Thomas E. Creek Department of Veterans Affairs Medical Center | 4 |
| Anchorage, AK | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | hospital | 16 | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | 16 |
| Asheville, NC | Charles George Department of Veterans Affairs Medical Center | hospital | 4 | Charles George Department of Veterans Affairs Medical Center | 4 |
| Ashville, OH | Grove City VA Clinic | outpatient | 11 | Chillicothe VA Medical Center | 23 |
| Atlanta, GA | Fort McPherson VA Clinic | outpatient | 4 | Joseph Maxwell Cleland Atlanta VA Medical Center | 7 |
| Baltimore, MD | Baltimore VA Clinic | outpatient | 1 | Baltimore VA Medical Center | 1 |
| Bangor, ME | Bangor VA Clinic | outpatient | 3 | Togus VA Medical Center | 59 |
| Bath, ME | Lewiston VA Clinic | outpatient | 20 | Togus VA Medical Center | 25 |
| Battle Creek, MI | Battle Creek VA Medical Center | hospital | 5 | Battle Creek VA Medical Center | 5 |
| Bellevue, WA | Seattle VA Mobile Clinic | outpatient | 7 | Seattle VA Medical Center | 8 |
| Bend, OR | Robert D. Maxwell Department of Veterans Affairs Clinic | outpatient | 2 | Roseburg VA Medical Center | 118 |
| Billings, MT | Benjamin Charles Steele VA Clinic | outpatient | 4 | Sheridan VA Medical Center | 101 |
| Binghamton, NY | Binghamton VA Clinic | outpatient | 0 | Wilkes-Barre VA Medical Center | 59 |
| Boise, ID | Boise VA Medical Center | hospital | 2 | Boise VA Medical Center | 2 |
| Boston, MA | Causeway VA Clinic | outpatient | 3 | Jamaica Plain VA Medical Center | 5 |
| Boulder, CO | Golden VA Clinic | outpatient | 20 | Rocky Mountain Regional VA Medical Center | 30 |
| Bowling Green, KY | Bowling Green VA Clinic | outpatient | 1 | Nashville VA Medical Center | 61 |
| Bozeman, MT | Travis W. Atkins Department of Veterans Affairs Clinic | outpatient | 2 | Fort Harrison VA Medical Center | 82 |
| Bremerton, WA | Silverdale VA Clinic | outpatient | 8 | Seattle VA Medical Center | 19 |
| Bridgeport, CT | Orange VA Clinic | outpatient | 11 | West Haven VA Medical Center | 14 |
| Broomfield, CO | York Street VA Clinic | outpatient | 14 | Rocky Mountain Regional VA Medical Center | 19 |
| Burlington, VT | Burlington Lakeside VA Clinic | outpatient | 2 | White River Junction VA Medical Center | 73 |
| Burnsville, MN | Richfield VA Clinic | outpatient | 8 | Minneapolis VA Medical Center | 10 |
| Camden, AR | El Dorado VA Clinic | outpatient | 26 | John L. McClellan Memorial Veterans' Hospital | 87 |
| Carroll, IA | Carroll VA Clinic | outpatient | 1 | Omaha VA Medical Center | 81 |
| Casper, WY | Casper VA Clinic | outpatient | 4 | Sheridan VA Medical Center | 141 |
| Chantilly, VA | Montgomery County VA Clinic | outpatient | 21 | Washington VA Medical Center | 23 |
| Charleston, SC | Ralph H. Johnson Department of Veterans Affairs Medical Center | hospital | 3 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 3 |
| Charleston, WV | Charleston VA Clinic | outpatient | 7 | Beckley VA Medical Center | 47 |
| Cheyenne, WY | Cheyenne VA Medical Center | hospital | 1 | Cheyenne VA Medical Center | 1 |
| Chicago, IL | Chicago VA Clinic | outpatient | 2 | Jesse Brown Department of Veterans Affairs Medical Center | 2 |
| Cincinnati, OH | Cincinnati 1 VA Mobile Clinic | outpatient | 0 | Cincinnati VA Medical Center | 0 |
| Cody, WY | Cody VA Clinic | outpatient | 0 | Sheridan VA Medical Center | 104 |
| Colorado Springs, CO | Union Boulevard VA Clinic | outpatient | 2 | Rocky Mountain Regional VA Medical Center | 61 |
| Columbus, GA | Columbus Downtown VA Clinic | outpatient | 6 | Central Alabama VA Medical Center-Montgomery | 80 |
| Columbus, OH | Columbus VA Clinic | outpatient | 3 | Chillicothe VA Medical Center | 41 |
| Costa Mesa, CA | Santa Ana VA Clinic | outpatient | 5 | Tibor Rubin VA Medical Center | 14 |
| Crestview, FL | Eglin Air Force Base VA Clinic | outpatient | 20 | Central Alabama VA Medical Center-Montgomery | 114 |
| Dallas, TX | Dallas VA Medical Center | hospital | 7 | Dallas VA Medical Center | 7 |
| Danville, IL | Danville VA Medical Center | hospital | 1 | Danville VA Medical Center | 1 |
| Decorah, IA | Decorah VA Clinic | outpatient | 1 | Tomah VA Medical Center | 81 |
| Des Moines, IA | Des Moines VA Clinic | outpatient | 2 | Omaha VA Medical Center | 125 |
| El Paso, TX | El Paso Northeast VA Clinic | outpatient | 2 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 222 |
| Elko, NV | Elko VA Clinic | outpatient | 1 | Boise VA Medical Center | 193 |
| Eureka, CA | Eureka VA Clinic | outpatient | 2 | White City VA Medical Center | 132 |
| Fargo, ND | North Fargo VA Clinic | outpatient | 2 | Fargo VA Medical Center | 4 |
| Fayetteville, NC | Raeford Road VA Clinic | outpatient | 3 | Fayetteville VA Medical Center | 5 |
| Florence, AL | Florence VA Clinic | outpatient | 6 | Nashville VA Medical Center | 103 |
| Forest, MS | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | hospital | 40 | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | 40 |
| Fort Collins, CO | Fort Collins VA Clinic | outpatient | 1 | Cheyenne VA Medical Center | 44 |
| Fort Stockton, TX | Fort Stockton VA Clinic | outpatient | 1 | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 124 |
| Fort Wayne, IN | Fort Wayne VA Medical Center | outpatient | 2 | Marion VA Medical Center | 47 |
| Fresno, CA | Fresno VA Medical Center | hospital | 1 | Fresno VA Medical Center | 1 |
| Gilbert, AZ | Staff Sergeant Alexander W. Conrad Veterans Affairs Health Care Clinic | outpatient | 1 | Carl T. Hayden Veterans' Administration Medical Center | 23 |
| Goleta, CA | Santa Barbara VA Clinic | outpatient | 5 | West Los Angeles VA Medical Center | 84 |
| Grand Forks, ND | Grand Forks VA Clinic | outpatient | 2 | Fargo VA Medical Center | 72 |
| Grand Junction, CO | Western Colorado VA Mobile Clinic | outpatient | 2 | Grand Junction VA Medical Center | 2 |
| Great Falls, MT | Great Falls VA Clinic | outpatient | 2 | Fort Harrison VA Medical Center | 72 |
| Green Bay, WI | Milo C. Huempfner Department of Veterans Affairs Outpatient Clinic | outpatient | 2 | Oscar G. Johnson Department of Veterans Affairs Medical Facility | 89 |
| Greenville, SC | Lance Corporal Dana Cornell Darnell VA Clinic | outpatient | 3 | Charles George Department of Veterans Affairs Medical Center | 52 |
| Hamilton, WA | Mount Vernon VA Clinic | outpatient | 17 | Seattle VA Medical Center | 68 |
| Hartford, CT | Newington VA Clinic | outpatient | 5 | West Haven VA Medical Center | 36 |
| Honolulu, HI | Spark M. Matsunaga Department of Veterans Affairs Medical Center | hospital | 4 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 4 |
| Houston, TX | Houston Webster VA Clinic | outpatient | 3 | Michael E. DeBakey Department of Veterans Affairs Medical Center | 6 |
| Hudson, NH | Lowell VA Clinic | outpatient | 12 | Manchester VA Medical Center | 17 |
| Huntsville, AL | Huntsville VA Clinic | outpatient | 4 | Birmingham VA Medical Center | 83 |
| Idaho Falls, ID | Idaho Falls VA Clinic | outpatient | 2 | George E. Wahlen Department of Veterans Affairs Medical Center | 189 |
| Indian Trail, NC | North Charlotte VA Clinic | outpatient | 16 | W.G. (Bill) Hefner Salisbury Department of Veterans Affairs Medical Center | 43 |
| Indianapolis, IN | Indianapolis VA Clinic | outpatient | 1 | Richard L. Roudebush Veterans' Administration Medical Center | 2 |
| Irmo, SC | Wm. Jennings Bryan Dorn Department of Veterans Affairs Medical Center | hospital | 16 | Wm. Jennings Bryan Dorn Department of Veterans Affairs Medical Center | 16 |
| Irvine, CA | Laguna Hills VA Clinic | outpatient | 5 | Tibor Rubin VA Medical Center | 21 |
| Ithaca, NY | Tompkins County VA Clinic | outpatient | 3 | Wilkes-Barre VA Medical Center | 89 |
| Jackson, MS | Jackson 2 VA Mobile Clinic | outpatient | 3 | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | 3 |
| Jacksonville, FL | Jacksonville 1 VA Clinic | outpatient | 0 | Malcom Randall Department of Veterans Affairs Medical Center | 63 |
| Jamestown, ND | Jamestown VA Clinic | outpatient | 3 | Fargo VA Medical Center | 91 |
| Kenosha, WI | Kenosha VA Clinic | outpatient | 3 | Captain James A. Lovell Federal Health Care Center | 19 |
| King of Prussia, PA | West Norriton VA Clinic | outpatient | 2 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 14 |
| Kuna, ID | Boise VA Medical Center | hospital | 13 | Boise VA Medical Center | 13 |
| Kāneʻohe, HI | Windward VA Clinic | outpatient | 1 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 7 |
| Lake Forest, CA | Laguna Hills VA Clinic | outpatient | 4 | Tibor Rubin VA Medical Center | 27 |
| Las Vegas, NV | Northwest Las Vegas VA Clinic | outpatient | 2 | North Las Vegas VA Medical Center | 10 |
| Lexington, MA | Edith Nourse Rogers Memorial Veterans' Hospital | hospital | 5 | Edith Nourse Rogers Memorial Veterans' Hospital | 5 |
| Little Rock, AR | Little Rock 2 VA Mobile Clinic | outpatient | 3 | John L. McClellan Memorial Veterans' Hospital | 3 |
| Louisville, KY | Newburg VA Clinic | outpatient | 4 | Robley Rex Department of Veterans Affairs Medical Center | 4 |
| Lynchburg, VA | Private First Class Desmond T. Doss VA Clinic | outpatient | 0 | Salem VA Medical Center | 46 |
| Malabar, FL | Palm Bay VA Clinic | outpatient | 3 | Orlando VA Medical Center | 50 |
| Manchester, NH | Manchester West VA Clinic | outpatient | 2 | Manchester VA Medical Center | 2 |
| Marietta, GA | Cobb County VA Clinic | outpatient | 2 | Joseph Maxwell Cleland Atlanta VA Medical Center | 17 |
| Medford, OR | White City VA Medical Center | hospital | 7 | White City VA Medical Center | 7 |
| Memphis, TN | Nonconnah Boulevard VA Clinic | outpatient | 3 | Lt. Col. Luke Weathers, Jr. VA Medical Center | 4 |
| Milwaukee, WI | Milwaukee VA Clinic | outpatient | 3 | Clement J. Zablocki Veterans' Administration Medical Center | 3 |
| Minneapolis, MN | Minneapolis VA Clinic | outpatient | 1 | Minneapolis VA Medical Center | 5 |
| Missoula, MT | David J. Thatcher VA Clinic | outpatient | 3 | Fort Harrison VA Medical Center | 93 |
| Mobile, AL | Mobile VA Clinic | outpatient | 6 | Biloxi VA Medical Center | 53 |
| Morgantown, WV | Monongalia County VA Clinic | outpatient | 2 | Louis A. Johnson Veterans' Administration Medical Center | 34 |
| Morrisville, NC | Brier Creek VA Clinic | outpatient | 6 | Durham VA Medical Center | 13 |
| Nashville, TN | Albion Street VA Clinic | outpatient | 1 | Nashville VA Medical Center | 2 |
| New Orleans, LA | New Orleans VA Medical Center | hospital | 11 | New Orleans VA Medical Center | 11 |
| Norfolk, VA | Portsmouth VA Clinic | outpatient | 7 | Hampton VA Medical Center | 8 |
| North Kingstown, RI | Middletown VA Clinic | outpatient | 8 | Providence VA Medical Center | 18 |
| North Platte, NE | North Platte VA Clinic | outpatient | 1 | Cheyenne VA Medical Center | 210 |
| Odessa, TX | Wilson and Young Medal of Honor VA Clinic | outpatient | 4 | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 57 |
| Oklahoma City, OK | Oklahoma City VA Medical Center | hospital | 1 | Oklahoma City VA Medical Center | 1 |
| Omaha, NE | Omaha VA Medical Center | hospital | 4 | Omaha VA Medical Center | 4 |
| Orlando, FL | Orlando 2 VA Mobile Clinic | outpatient | 3 | Orlando VA Medical Center | 3 |
| Overland Park, KS | Overland Park VA Clinic | outpatient | 3 | Kansas City VA Medical Center | 15 |
| Pace, FL | Pensacola VA Clinic | outpatient | 17 | Biloxi VA Medical Center | 107 |
| Paterson, NJ | Paterson VA Clinic | outpatient | 1 | East Orange VA Medical Center | 12 |
| Pensacola, FL | Pensacola VA Clinic | outpatient | 7 | Biloxi VA Medical Center | 105 |
| Peoria, IL | Bob Michel Department of Veterans Affairs Outpatient Clinic | outpatient | 4 | Danville VA Medical Center | 115 |
| Philadelphia, PA | Fourth Street VA Clinic | outpatient | 4 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 5 |
| Phoenix, AZ | Thunderbird VA Clinic | outpatient | 1 | Carl T. Hayden Veterans' Administration Medical Center | 5 |
| Pierre, SD | Pierre VA Clinic | outpatient | 0 | Fort Meade VA Medical Center | 156 |
| Pittsburgh, PA | Pittsburgh VA Medical Center-University Drive | hospital | 1 | Pittsburgh VA Medical Center-University Drive | 1 |
| Portland, ME | Portland VA Clinic | outpatient | 4 | Togus VA Medical Center | 51 |
| Portland, OR | Portland VA Clinic | outpatient | 2 | Portland VA Medical Center | 3 |
| Providence, RI | Eagle Street VA Clinic | outpatient | 1 | Providence VA Medical Center | 1 |
| Pueblo, CO | Pueblo VA Community Living Center | outpatient | 3 | Rocky Mountain Regional VA Medical Center | 103 |
| Quincy, MA | Quincy VA Clinic | outpatient | 1 | Jamaica Plain VA Medical Center | 7 |
| Raleigh, NC | Raleigh III VA Clinic | outpatient | 2 | Durham VA Medical Center | 21 |
| Rapid City, SD | Rapid City VA Clinic | outpatient | 4 | Fort Meade VA Medical Center | 27 |
| Reno, NV | North Reno VA Clinic | outpatient | 3 | Ioannis A. Lougaris Veterans' Administration Medical Center | 4 |
| Rome, NY | Donald J. Mitchell Department of Veterans Affairs Outpatient Clinic | outpatient | 4 | Wilkes-Barre VA Medical Center | 138 |
| Salt Lake City, UT | Salt Lake City VA Mobile Clinic | outpatient | 5 | George E. Wahlen Department of Veterans Affairs Medical Center | 5 |
| San Antonio, TX | Balcones Heights VA Clinic | outpatient | 2 | Audie L. Murphy Memorial Veterans' Hospital | 5 |
| San Diego, CA | Kearny Mesa VA Clinic | outpatient | 0 | Jennifer Moreno Department of Veterans Affairs Medical Center | 7 |
| Savannah, GA | Savannah VA Clinic | outpatient | 3 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 90 |
| Scranton, PA | Wilkes-Barre VA Medical Center | hospital | 14 | Wilkes-Barre VA Medical Center | 14 |
| Shreveport, LA | Overton Brooks Veterans' Administration Medical Center | hospital | 5 | Overton Brooks Veterans' Administration Medical Center | 5 |
| Sierra Vista, AZ | Sierra Vista VA Clinic | outpatient | 2 | Tucson VA Medical Center | 57 |
| Sioux Falls, SD | Royal C. Johnson Veterans' Memorial Hospital | hospital | 1 | Royal C. Johnson Veterans' Memorial Hospital | 1 |
| Spokane, WA | East Front Avenue VA Clinic | outpatient | 2 | Mann-Grandstaff Department of Veterans Affairs Medical Center | 3 |
| St. Charles, MO | St. Charles County VA Clinic | outpatient | 1 | John J. Cochran Veterans Hospital | 19 |
| St. George, UT | St. George VA Clinic | outpatient | 1 | North Las Vegas VA Medical Center | 100 |
| Syracuse, NY | Syracuse VA Medical Center | outpatient | 0 | Wilkes-Barre VA Medical Center | 125 |
| Tucson, AZ | Tucson VA Mobile Clinic | outpatient | 6 | Tucson VA Medical Center | 6 |
| Tullahoma, TN | Tullahoma VA Clinic | outpatient | 11 | Nashville VA Medical Center | 62 |
| Tulsa, OK | Tulsa Eleventh Street VA Clinic | outpatient | 3 | Jack C. Montgomery Department of Veterans Affairs Medical Center | 37 |
| Valdosta, GA | Valdosta VA Clinic | outpatient | 3 | Malcom Randall Department of Veterans Affairs Medical Center | 101 |
| Victorville, CA | Victorville VA Clinic | outpatient | 2 | Jerry L. Pettis Memorial Veterans' Hospital | 33 |
| Virginia Beach, VA | Virginia Beach VA Clinic | outpatient | 9 | Hampton VA Medical Center | 23 |
| Waltham, MA | Jamaica Plain VA Medical Center | hospital | 8 | Jamaica Plain VA Medical Center | 8 |
| Warren, MI | Piquette Street VA Clinic | outpatient | 9 | John D. Dingell Department of Veterans Affairs Medical Center | 10 |
| Warren, PA | Warren County VA Clinic | outpatient | 4 | Erie VA Medical Center | 50 |
| Watertown, NY | Watertown VA Clinic | outpatient | 2 | Buffalo VA Medical Center | 162 |
| Wichita, KS | Sedgwick County VA Clinic | outpatient | 4 | Oklahoma City VA Medical Center | 153 |
| Wilmington, DE | Wilmington VA Medical Center | hospital | 4 | Wilmington VA Medical Center | 4 |
| Yakima, WA | Yakima Valley VA Clinic | outpatient | 4 | Seattle VA Medical Center | 107 |
| Yuba City, CA | Yuba City VA Clinic | outpatient | 1 | Ioannis A. Lougaris Veterans' Administration Medical Center | 102 |
