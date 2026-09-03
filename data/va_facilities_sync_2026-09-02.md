# VA facilities sync — 2026-09-02

Source: [VHA Medical Facilities (VAST / ArcGIS)](https://vha.maps.arcgis.com/home/item.html?id=c6821e66523a46f5b32893641b9bd0dd)
Distance method: great-circle miles from city centroid to facility LAT/LON.
Outpatient = nearest clinic/CBOC or medical center (Vet Centers excluded).
`has_va` = nearest outpatient-capable site within 25 miles (crow-fly).
Hospital = nearest parent facility (3-character STA_NO / VA medical center).
`nearest_va_kind` is the kind of that nearest outpatient-capable site.

| City | Outpatient | kind | mi | Hospital | mi |
| --- | --- | --- | ---: | --- | ---: |
| Aberdeen, MD | Perry Point VA Medical Center | outpatient | 6 | Baltimore VA Medical Center | 29 |
| Abilene, TX | Abilene VA Clinic | outpatient | 3 | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 102 |
| Abingdon, MD | Perry Point VA Medical Center | outpatient | 13 | Baltimore VA Medical Center | 22 |
| Adelphi, MD | Franklin Street VA Clinic | outpatient | 5 | Washington VA Medical Center | 5 |
| Aguadilla, PR | Mayaguez VA Clinic | outpatient | 18 | San Juan VA Medical Center | 71 |
| Aiea, HI | Spark M. Matsunaga Department of Veterans Affairs Medical Center | hospital | 3 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 3 |
| Akron, OH | Summit County VA Clinic | outpatient | 1 | Louis Stokes Cleveland Department of Veterans Affairs Medical Center | 30 |
| Alamogordo, NM | Alamogordo VA Clinic | outpatient | 2 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 153 |
| Albany, GA | Albany VA Clinic | outpatient | 7 | Carl Vinson Veterans' Administration Medical Center | 98 |
| Albany, NY | Samuel S. Stratton Department of Veterans Affairs Medical Center | outpatient | 2 | Edward P. Boland Department of Veterans Affairs Medical Center | 61 |
| Albany, OR | Salem VA Clinic | outpatient | 20 | Portland VA Medical Center | 63 |
| Albuquerque, NM | Raymond G. Murphy Department of Veterans Affairs Medical Center | hospital | 5 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 5 |
| Alexandria, LA | Alexandria VA Mobile Clinic | outpatient | 5 | Alexandria VA Medical Center | 5 |
| Alexandria, VA | Southeast Washington VA Clinic | outpatient | 5 | Washington VA Medical Center | 9 |
| Allentown, PA | Allentown VA Clinic | outpatient | 2 | Coatesville VA Medical Center | 44 |
| Alpharetta, GA | Northeast Cobb County VA Clinic | outpatient | 14 | Joseph Maxwell Cleland Atlanta VA Medical Center | 19 |
| Altus, OK | Altus VA Clinic | outpatient | 1 | Oklahoma City VA Medical Center | 119 |
| Amarillo, TX | Amarillo VA Mobile Clinic | outpatient | 4 | Thomas E. Creek Department of Veterans Affairs Medical Center | 4 |
| Anaheim, CA | Placentia VA Clinic | outpatient | 7 | Tibor Rubin VA Medical Center | 21 |
| Anchorage, AK | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | hospital | 16 | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | 16 |
| Andover, MA | Haverhill VA Clinic | outpatient | 9 | Edith Nourse Rogers Memorial Veterans' Hospital | 12 |
| Andrews Afb, MD | Southern Prince George's County VA Clinic | outpatient | 2 | Washington VA Medical Center | 11 |
| Ann Arbor, MI | Lieutenant Colonel Charles S. Kettles VA Medical Center | hospital | 1 | Lieutenant Colonel Charles S. Kettles VA Medical Center | 1 |
| Annapolis, MD | Glen Burnie VA Clinic | outpatient | 14 | Baltimore VA Medical Center | 23 |
| Annapolis Junction, MD | Glen Burnie VA Clinic | outpatient | 14 | Baltimore VA Medical Center | 23 |
| Anniston, AL | Oxford VA Clinic | outpatient | 4 | Birmingham VA Medical Center | 58 |
| Archbald, PA | Wayne County VA Clinic | outpatient | 15 | Wilkes-Barre VA Medical Center | 23 |
| Arlington, TX | Grand Prairie VA Clinic | outpatient | 5 | Dallas VA Medical Center | 19 |
| Arlington, VA | Washington VA Medical Center | hospital | 6 | Washington VA Medical Center | 6 |
| Arnold, MO | St. Louis VA Medical Center-Jefferson Barracks | outpatient | 7 | John J. Cochran Veterans Hospital | 17 |
| Ashaway, RI | John J. McGuirk Department of Veterans Affairs Outpatient Clinic | outpatient | 17 | Providence VA Medical Center | 33 |
| Ashburn, VA | Montgomery County VA Clinic | outpatient | 16 | Washington VA Medical Center | 26 |
| Asheville, NC | Charles George Department of Veterans Affairs Medical Center | hospital | 4 | Charles George Department of Veterans Affairs Medical Center | 4 |
| Ashville, OH | Grove City VA Clinic | outpatient | 11 | Chillicothe VA Medical Center | 23 |
| Atlanta, GA | Fort McPherson VA Clinic | outpatient | 4 | Joseph Maxwell Cleland Atlanta VA Medical Center | 7 |
| Auburn, WA | Renton VA Clinic | outpatient | 12 | Seattle VA Medical Center | 18 |
| Augusta, GA | Augusta VA Medical Center-Uptown | outpatient | 8 | Charlie Norwood Department of Veterans Affairs Medical Center | 9 |
| Aurora, CO | Lieutenant Colonel John W. Mosley VA Clinic | outpatient | 5 | Rocky Mountain Regional VA Medical Center | 6 |
| Aurora, IL | Aurora VA Clinic | outpatient | 3 | Edward Hines Junior Hospital | 24 |
| Austin, TX | Austin VA Mobile Clinic | outpatient | 7 | Olin E. Teague Veterans' Center | 59 |
| Baltimore, MD | Baltimore VA Clinic | outpatient | 1 | Baltimore VA Medical Center | 1 |
| Bangor, ME | Bangor VA Clinic | outpatient | 3 | Togus VA Medical Center | 59 |
| Barstow, CA | Victorville VA Clinic | outpatient | 29 | Jerry L. Pettis Memorial Veterans' Hospital | 58 |
| Bath, ME | Lewiston VA Clinic | outpatient | 20 | Togus VA Medical Center | 25 |
| Baton Rouge, LA | Baton Rouge VA Clinic | outpatient | 3 | New Orleans VA Medical Center | 71 |
| Battle Creek, MI | Battle Creek VA Medical Center | hospital | 5 | Battle Creek VA Medical Center | 5 |
| Beale Afb, CA | Yuba City VA Clinic | outpatient | 14 | Ioannis A. Lougaris Veterans' Administration Medical Center | 88 |
| Beaufort, SC | Beaufort VA Clinic | outpatient | 5 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 50 |
| Beavercreek, OH | Wright-Patterson VA Clinic | outpatient | 5 | Dayton VA Medical Center | 10 |
| Bedford, MA | Edith Nourse Rogers Memorial Veterans' Hospital | hospital | 1 | Edith Nourse Rogers Memorial Veterans' Hospital | 1 |
| Bellevue, IA | Dubuque VA Clinic | outpatient | 21 | William S. Middleton Memorial Veterans' Hospital | 76 |
| Bellevue, NE | Sarpy County VA Clinic | outpatient | 5 | Omaha VA Medical Center | 7 |
| Bellevue, WA | Seattle VA Mobile Clinic | outpatient | 7 | Seattle VA Medical Center | 8 |
| Bend, OR | Robert D. Maxwell Department of Veterans Affairs Clinic | outpatient | 2 | Roseburg VA Medical Center | 118 |
| Bethesda, MD | Washington VA Medical Center | hospital | 7 | Washington VA Medical Center | 7 |
| Bethlehem, PA | Allentown VA Clinic | outpatient | 8 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 48 |
| Big Rapids, MI | Clare VA Clinic | outpatient | 37 | Aleda E. Lutz Department of Veterans Affairs Medical Center | 78 |
| Billings, MT | Benjamin Charles Steele VA Clinic | outpatient | 4 | Sheridan VA Medical Center | 101 |
| Binghamton, NY | Binghamton VA Clinic | outpatient | 0 | Wilkes-Barre VA Medical Center | 59 |
| Bismarck, ND | Bismarck VA Clinic | outpatient | 2 | Fargo VA Medical Center | 190 |
| Bloomington, IN | Monroe County VA Clinic | outpatient | 1 | Richard L. Roudebush Veterans' Administration Medical Center | 46 |
| Bohemia, NY | Bay Shore VA Clinic | outpatient | 7 | Northport VA Medical Center | 13 |
| Boise, ID | Boise VA Medical Center | hospital | 2 | Boise VA Medical Center | 2 |
| Boston, MA | Causeway VA Clinic | outpatient | 3 | Jamaica Plain VA Medical Center | 5 |
| Bothell, WA | Edmonds VA Clinic | outpatient | 6 | Seattle VA Medical Center | 15 |
| Boulder, CO | Golden VA Clinic | outpatient | 20 | Rocky Mountain Regional VA Medical Center | 30 |
| Bowling Green, KY | Bowling Green VA Clinic | outpatient | 1 | Nashville VA Medical Center | 61 |
| Bozeman, MT | Travis W. Atkins Department of Veterans Affairs Clinic | outpatient | 2 | Fort Harrison VA Medical Center | 82 |
| Bremerton, WA | Silverdale VA Clinic | outpatient | 8 | Seattle VA Medical Center | 19 |
| Bridgeport, CT | Orange VA Clinic | outpatient | 11 | West Haven VA Medical Center | 14 |
| Bridgeport, WV | Louis A. Johnson Veterans' Administration Medical Center | hospital | 7 | Louis A. Johnson Veterans' Administration Medical Center | 7 |
| Bristol, PA | Burlington County VA Clinic | outpatient | 14 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 21 |
| Broomfield, CO | York Street VA Clinic | outpatient | 14 | Rocky Mountain Regional VA Medical Center | 19 |
| Brunswick, GA | Brunswick VA Clinic | outpatient | 5 | Malcom Randall Department of Veterans Affairs Medical Center | 116 |
| Buckhannon, WV | Louis A. Johnson Veterans' Administration Medical Center | hospital | 20 | Louis A. Johnson Veterans' Administration Medical Center | 20 |
| Buckley Sfb, CO | Jewell VA Clinic | outpatient | 4 | Rocky Mountain Regional VA Medical Center | 5 |
| Buffalo, NY | Packard VA Clinic | outpatient | 1 | Buffalo VA Medical Center | 5 |
| Burlington, VT | Burlington Lakeside VA Clinic | outpatient | 2 | White River Junction VA Medical Center | 73 |
| Burnsville, MN | Richfield VA Clinic | outpatient | 8 | Minneapolis VA Medical Center | 10 |
| California, MD | Lexington Park VA Clinic | outpatient | 5 | Washington VA Medical Center | 52 |
| Cambridge, MA | Causeway VA Clinic | outpatient | 3 | Jamaica Plain VA Medical Center | 3 |
| Camden, AR | El Dorado VA Clinic | outpatient | 26 | John L. McClellan Memorial Veterans' Hospital | 87 |
| Camden, NJ | Camden VA Clinic | outpatient | 1 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 5 |
| Camp Springs, MD | Southern Prince George's County VA Clinic | outpatient | 1 | Washington VA Medical Center | 10 |
| Canoga Park, CA | Sepulveda VA Medical Center | outpatient | 7 | West Los Angeles VA Medical Center | 13 |
| Cape Canaveral, FL | Viera VA Clinic | outpatient | 13 | Orlando VA Medical Center | 41 |
| Carbondale, IL | Carbondale VA Clinic | outpatient | 2 | John J. Cochran Veterans Hospital | 84 |
| Carlisle, PA | Cumberland County VA Clinic | outpatient | 12 | Lebanon VA Medical Center | 42 |
| Carlsbad, CA | Oceanside VA Clinic | outpatient | 6 | Jennifer Moreno Department of Veterans Affairs Medical Center | 18 |
| Carlstadt, NJ | Hackensack VA Clinic | outpatient | 5 | Margaret Cochran Corbin VA Campus | 8 |
| Carroll, IA | Carroll VA Clinic | outpatient | 1 | Omaha VA Medical Center | 81 |
| Carson City, NV | Carson Valley VA Clinic | outpatient | 15 | Ioannis A. Lougaris Veterans' Administration Medical Center | 25 |
| Casper, WY | Casper VA Clinic | outpatient | 4 | Sheridan VA Medical Center | 141 |
| Cedar Rapids, IA | Cedar Rapids VA Clinic | outpatient | 2 | William S. Middleton Memorial Veterans' Hospital | 138 |
| Centennial, CO | Jewell VA Clinic | outpatient | 7 | Rocky Mountain Regional VA Medical Center | 11 |
| Chambersburg, PA | Hagerstown VA Clinic | outpatient | 21 | Martinsburg VA Medical Center | 38 |
| Chandler, AZ | Staff Sergeant Alexander W. Conrad Veterans Affairs Health Care Clinic | outpatient | 6 | Carl T. Hayden Veterans' Administration Medical Center | 19 |
| Chantilly, VA | Montgomery County VA Clinic | outpatient | 21 | Washington VA Medical Center | 23 |
| Charleston, SC | Ralph H. Johnson Department of Veterans Affairs Medical Center | hospital | 3 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 3 |
| Charleston, WV | Charleston VA Clinic | outpatient | 7 | Beckley VA Medical Center | 47 |
| Charleston AFB, SC | Ralph H. Johnson Department of Veterans Affairs Medical Center | hospital | 2 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 2 |
| Charlotte, NC | South Charlotte VA Clinic | outpatient | 5 | W.G. (Bill) Hefner Salisbury Department of Veterans Affairs Medical Center | 38 |
| Charlottesville, VA | Charlottesville VA Clinic | outpatient | 3 | Richmond VA Medical Center | 67 |
| Cherry Point, NC | Cherry Point VA Clinic | outpatient | 2 | Fayetteville VA Medical Center | 114 |
| Chesapeake, VA | Chesapeake VA Clinic | outpatient | 8 | Hampton VA Medical Center | 23 |
| Cheshire, CT | Waterbury VA Clinic | outpatient | 8 | West Haven VA Medical Center | 15 |
| Cheyenne, WY | Cheyenne VA Medical Center | hospital | 1 | Cheyenne VA Medical Center | 1 |
| Chicago, IL | Chicago VA Clinic | outpatient | 2 | Jesse Brown Department of Veterans Affairs Medical Center | 2 |
| Chula Vista, CA | Chula Vista VA Clinic | outpatient | 4 | Jennifer Moreno Department of Veterans Affairs Medical Center | 21 |
| Cincinnati, OH | Cincinnati 1 VA Mobile Clinic | outpatient | 0 | Cincinnati VA Medical Center | 0 |
| Clarksburg, WV | Louis A. Johnson Veterans' Administration Medical Center | hospital | 0 | Louis A. Johnson Veterans' Administration Medical Center | 0 |
| Clayville, NY | Donald J. Mitchell Department of Veterans Affairs Outpatient Clinic | outpatient | 18 | Wilkes-Barre VA Medical Center | 123 |
| Clearfield, UT | Ogden VA Clinic | outpatient | 7 | George E. Wahlen Department of Veterans Affairs Medical Center | 25 |
| Cleveland, OH | Cleveland VA Clinic-Euclid | outpatient | 3 | Louis Stokes Cleveland Department of Veterans Affairs Medical Center | 4 |
| Clifton, NJ | Paterson VA Clinic | outpatient | 3 | East Orange VA Medical Center | 8 |
| Clinton, MD | Southern Prince George's County VA Clinic | outpatient | 4 | Washington VA Medical Center | 14 |
| Clovis, NM | Clovis VA Clinic | outpatient | 2 | Thomas E. Creek Department of Veterans Affairs Medical Center | 92 |
| Cody, WY | Cody VA Clinic | outpatient | 0 | Sheridan VA Medical Center | 104 |
| College Park, GA | South Fulton County VA Clinic | outpatient | 2 | Joseph Maxwell Cleland Atlanta VA Medical Center | 14 |
| Collinsville, IL | St. Clair County VA Clinic | outpatient | 8 | John J. Cochran Veterans Hospital | 12 |
| Colorado Springs, CO | Union Boulevard VA Clinic | outpatient | 2 | Rocky Mountain Regional VA Medical Center | 61 |
| Columbia, MD | Fort Meade VA Clinic | outpatient | 10 | Baltimore VA Medical Center | 14 |
| Columbia, SC | Wm. Jennings Bryan Dorn Department of Veterans Affairs Medical Center | hospital | 5 | Wm. Jennings Bryan Dorn Department of Veterans Affairs Medical Center | 5 |
| Columbus, GA | Columbus Downtown VA Clinic | outpatient | 6 | Central Alabama VA Medical Center-Montgomery | 80 |
| Columbus, MS | Columbus VA Clinic | outpatient | 3 | Tuscaloosa VA Medical Center | 57 |
| Columbus, OH | Columbus VA Clinic | outpatient | 3 | Chillicothe VA Medical Center | 41 |
| Concord, MA | Bedford VA Clinic | outpatient | 5 | Edith Nourse Rogers Memorial Veterans' Hospital | 5 |
| Concord, NH | Manchester VA Medical Center | hospital | 14 | Manchester VA Medical Center | 14 |
| Coralville, IA | Coralville VA Clinic | outpatient | 1 | William S. Middleton Memorial Veterans' Hospital | 146 |
| Corinne, UT | Cache Valley VA Clinic | outpatient | 22 | George E. Wahlen Department of Veterans Affairs Medical Center | 57 |
| Corpus Christi, TX | Corpus Christi VA Clinic | outpatient | 5 | Audie L. Murphy Memorial Veterans' Hospital | 138 |
| Costa Mesa, CA | Santa Ana VA Clinic | outpatient | 5 | Tibor Rubin VA Medical Center | 14 |
| Cranberry Township, PA | Cranberry Township VA Clinic | outpatient | 2 | Pittsburgh VA Medical Center-University Drive | 20 |
| Crestview, FL | Eglin Air Force Base VA Clinic | outpatient | 20 | Central Alabama VA Medical Center-Montgomery | 114 |
| Cypress, CA | Tibor Rubin VA Medical Center | hospital | 6 | Tibor Rubin VA Medical Center | 6 |
| Dahlgren, VA | Charlotte Hall VA Clinic | outpatient | 18 | Washington VA Medical Center | 41 |
| Dallas, TX | Dallas VA Medical Center | hospital | 7 | Dallas VA Medical Center | 7 |
| Danville, IL | Danville VA Medical Center | hospital | 1 | Danville VA Medical Center | 1 |
| Dayton, OH | Dayton VA Medical Center | hospital | 3 | Dayton VA Medical Center | 3 |
| Daytona Beach, FL | Westside Pavilion VA Clinic | outpatient | 2 | Orlando VA Medical Center | 58 |
| Dearborn, MI | Piquette Street VA Clinic | outpatient | 8 | John D. Dingell Department of Veterans Affairs Medical Center | 8 |
| Decorah, IA | Decorah VA Clinic | outpatient | 1 | Tomah VA Medical Center | 81 |
| Dededo, GU | Guam VA Clinic | outpatient | 7 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 3795 |
| Del Rio, TX | Kerrville VA Medical Center | outpatient | 115 | Audie L. Murphy Memorial Veterans' Hospital | 139 |
| Denver, CO | Rocky Mountain Regional VA Medical Center | hospital | 3 | Rocky Mountain Regional VA Medical Center | 3 |
| Des Moines, IA | Des Moines VA Clinic | outpatient | 2 | Omaha VA Medical Center | 125 |
| Des Moines, WA | Renton VA Clinic | outpatient | 8 | Seattle VA Medical Center | 12 |
| Des Plaines, IL | Evanston VA Clinic | outpatient | 10 | Edward Hines Junior Hospital | 13 |
| Detroit, MI | Piquette Street VA Clinic | outpatient | 2 | John D. Dingell Department of Veterans Affairs Medical Center | 3 |
| Dulles, VA | Montgomery County VA Clinic | outpatient | 19 | Washington VA Medical Center | 24 |
| Duluth, MN | Twin Ports VA Clinic | outpatient | 6 | St. Cloud VA Medical Center | 130 |
| Durham, NC | Durham VA Medical Center | hospital | 3 | Durham VA Medical Center | 3 |
| Durham, NH | Portsmouth VA Clinic | outpatient | 7 | Manchester VA Medical Center | 28 |
| Eagan, MN | Fort Snelling VA Clinic | outpatient | 6 | Minneapolis VA Medical Center | 6 |
| East Granby, CT | Springfield VA Clinic | outpatient | 15 | Edward P. Boland Department of Veterans Affairs Medical Center | 29 |
| East Hartford, CT | Newington VA Clinic | outpatient | 8 | West Haven VA Medical Center | 38 |
| East Pensacola Heights, FL | Pensacola VA Clinic | outpatient | 5 | Biloxi VA Medical Center | 103 |
| Easton, PA | Northampton County VA Clinic | outpatient | 13 | Wilkes-Barre VA Medical Center | 50 |
| Edwards Afb, CA | Antelope Valley VA Clinic | outpatient | 18 | West Los Angeles VA Medical Center | 66 |
| Egg Harbor City, NJ | Atlantic County VA Clinic | outpatient | 14 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 42 |
| Egg Harbor Township, NJ | Atlantic County VA Clinic | outpatient | 3 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 50 |
| Eglin Air Force Base, FL | Eglin Air Force Base VA Clinic | outpatient | 17 | Central Alabama VA Medical Center-Montgomery | 122 |
| Eielson Afb, AK | Fairbanks VA Clinic | outpatient | 24 | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | 252 |
| El Dorado Hills, CA | Sacramento VA Medical Center | outpatient | 15 | Ioannis A. Lougaris Veterans' Administration Medical Center | 89 |
| El Paso, TX | El Paso Northeast VA Clinic | outpatient | 2 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 222 |
| El Segundo, CA | Gardena VA Clinic | outpatient | 8 | West Los Angeles VA Medical Center | 10 |
| Elko, NV | Elko VA Clinic | outpatient | 1 | Boise VA Medical Center | 193 |
| Elkton, MD | Perry Point VA Medical Center | outpatient | 13 | Wilmington VA Medical Center | 15 |
| Ellsworth AFB, SD | Rapid City VA Clinic | outpatient | 12 | Fort Meade VA Medical Center | 26 |
| Endicott, NY | Binghamton VA Clinic | outpatient | 8 | Wilkes-Barre VA Medical Center | 60 |
| Englewood, CO | Valor Point VA Domiciliary | outpatient | 5 | Rocky Mountain Regional VA Medical Center | 11 |
| Enid, OK | Enid VA Clinic | outpatient | 1 | Oklahoma City VA Medical Center | 67 |
| Erie, PA | Erie VA Medical Center | hospital | 1 | Erie VA Medical Center | 1 |
| Eureka, CA | Eureka VA Clinic | outpatient | 2 | White City VA Medical Center | 132 |
| Everett, WA | Everett VA Clinic | outpatient | 2 | Seattle VA Medical Center | 28 |
| Fairbanks, AK | Fairbanks VA Clinic | outpatient | 2 | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | 257 |
| Fairfield, CA | Fairfield VA Clinic | outpatient | 4 | San Francisco VA Medical Center | 42 |
| Fall River, MA | New Bedford VA Clinic | outpatient | 10 | Providence VA Medical Center | 19 |
| Fallon, NV | Lahontan Valley VA Clinic | outpatient | 1 | Ioannis A. Lougaris Veterans' Administration Medical Center | 55 |
| Falls Church, VA | Washington VA Medical Center | hospital | 9 | Washington VA Medical Center | 9 |
| Fargo, ND | North Fargo VA Clinic | outpatient | 2 | Fargo VA Medical Center | 4 |
| Farmington, CT | Newington VA Clinic | outpatient | 5 | West Haven VA Medical Center | 31 |
| Farmington, MN | Richfield VA Clinic | outpatient | 16 | Minneapolis VA Medical Center | 17 |
| Farmington, NM | Farmington VA Clinic | outpatient | 2 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 148 |
| Fayetteville, NC | Raeford Road VA Clinic | outpatient | 3 | Fayetteville VA Medical Center | 5 |
| Federal Way, WA | Renton VA Clinic | outpatient | 13 | Seattle VA Medical Center | 17 |
| Flagstaff, AZ | Flagstaff VA Clinic | outpatient | 3 | Bob Stump Department of Veterans Affairs Medical Center | 64 |
| Florence, AL | Florence VA Clinic | outpatient | 6 | Nashville VA Medical Center | 103 |
| Foley, AL | Naval Hospital Pensacola VA Clinic | outpatient | 22 | Biloxi VA Medical Center | 76 |
| Forest, MS | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | hospital | 40 | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | 40 |
| Forest, VA | Private First Class Desmond T. Doss VA Clinic | outpatient | 5 | Salem VA Medical Center | 41 |
| Fort Belvoir, VA | Fort Belvoir VA Clinic | outpatient | 1 | Washington VA Medical Center | 17 |
| Fort Benning, GA | Fort Moore VA Clinic | outpatient | 5 | Central Alabama VA Medical Center-Montgomery | 84 |
| Fort Bliss, TX | El Paso Northeast VA Clinic | outpatient | 4 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 222 |
| Fort Campbell, KY | Taylor VA Clinic | outpatient | 8 | Nashville VA Medical Center | 54 |
| Fort Collins, CO | Fort Collins VA Clinic | outpatient | 1 | Cheyenne VA Medical Center | 44 |
| Fort George G Meade, MD | Fort Meade VA Clinic | outpatient | 1 | Baltimore VA Medical Center | 14 |
| Fort Greely, AK | Fairbanks VA Clinic | outpatient | 87 | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | 228 |
| Fort Lauderdale, FL | William "Bill" Kling Department of Veterans Affairs Outpatient Clinic | outpatient | 9 | Bruce W. Carter Department of Veterans Affairs Medical Center | 25 |
| Fort Lewis, WA | American Lake VA Medical Center | outpatient | 3 | Seattle VA Medical Center | 34 |
| Fort Meade, MD | Fort Meade VA Clinic | outpatient | 1 | Baltimore VA Medical Center | 14 |
| Fort Novosel, AL | Wiregrass VA Clinic | outpatient | 6 | Central Alabama VA Medical Center-Montgomery | 73 |
| Fort Riley, KS | Junction City VA Clinic | outpatient | 7 | Kansas City VA Medical Center | 123 |
| Fort Shafter, HI | Spark M. Matsunaga Department of Veterans Affairs Medical Center | hospital | 1 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 1 |
| Fort Stockton, TX | Fort Stockton VA Clinic | outpatient | 1 | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 124 |
| Fort Walton Beach, FL | Eglin Air Force Base VA Clinic | outpatient | 5 | Central Alabama VA Medical Center-Montgomery | 137 |
| Fort Wayne, IN | Fort Wayne VA Medical Center | outpatient | 2 | Marion VA Medical Center | 47 |
| Fort Worth, TX | Fort Worth New York VA Clinic | outpatient | 3 | Dallas VA Medical Center | 33 |
| Framingham, MA | Framingham VA Clinic | outpatient | 2 | Edith Nourse Rogers Memorial Veterans' Hospital | 16 |
| Frankfort, KY | Lexington VA Mobile Clinic | outpatient | 19 | Franklin R. Sousley Campus | 20 |
| Franklin, LA | Franklin VA Clinic | outpatient | 1 | New Orleans VA Medical Center | 86 |
| Frederick, MD | Fort Detrick VA Clinic | outpatient | 0 | Martinsburg VA Medical Center | 27 |
| Freer, TX | Laredo VA Clinic | outpatient | 58 | Audie L. Murphy Memorial Veterans' Hospital | 112 |
| Fremont, CA | Fremont VA Clinic | outpatient | 4 | Palo Alto VA Medical Center | 13 |
| Fresno, CA | Fresno VA Medical Center | hospital | 1 | Fresno VA Medical Center | 1 |
| Ft George G Meade, MD | Fort Meade VA Clinic | outpatient | 1 | Baltimore VA Medical Center | 14 |
| Fullerton, CA | Placentia VA Clinic | outpatient | 3 | Tibor Rubin VA Medical Center | 13 |
| Fulton, MD | Fort Meade VA Clinic | outpatient | 11 | Washington VA Medical Center | 16 |
| Gainesville, FL | Malcom Randall Department of Veterans Affairs Medical Center | hospital | 3 | Malcom Randall Department of Veterans Affairs Medical Center | 3 |
| Gaithersburg, MD | Montgomery County VA Clinic | outpatient | 2 | Washington VA Medical Center | 18 |
| Gardena, CA | Gardena VA Clinic | outpatient | 3 | Tibor Rubin VA Medical Center | 14 |
| Gibsonia, PA | Cranberry Township VA Clinic | outpatient | 8 | Pittsburgh VA Medical Center-University Drive | 13 |
| Gilbert, AZ | Staff Sergeant Alexander W. Conrad Veterans Affairs Health Care Clinic | outpatient | 1 | Carl T. Hayden Veterans' Administration Medical Center | 23 |
| Glastonbury, CT | Newington VA Clinic | outpatient | 8 | West Haven VA Medical Center | 30 |
| Glendale, AZ | Thunderbird VA Clinic | outpatient | 5 | Carl T. Hayden Veterans' Administration Medical Center | 8 |
| Goldsboro, NC | Johnson Air Force Base VA Clinic | outpatient | 2 | Fayetteville VA Medical Center | 54 |
| Goleta, CA | Santa Barbara VA Clinic | outpatient | 5 | West Los Angeles VA Medical Center | 84 |
| Goodfellow AFB, TX | Colonel Charles and JoAnne Powell VA Clinic | outpatient | 5 | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 84 |
| Goose Creek, SC | Goose Creek VA Clinic | outpatient | 3 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 15 |
| Grand Forks, ND | Grand Forks VA Clinic | outpatient | 2 | Fargo VA Medical Center | 72 |
| Grand Island, NE | Grand Island VA Medical Center | outpatient | 1 | Omaha VA Medical Center | 125 |
| Grand Junction, CO | Western Colorado VA Mobile Clinic | outpatient | 2 | Grand Junction VA Medical Center | 2 |
| Grand Prairie, TX | Grand Prairie VA Clinic | outpatient | 4 | Dallas VA Medical Center | 13 |
| Grand Rapids, MI | Century Avenue VA Clinic | outpatient | 1 | Battle Creek VA Medical Center | 46 |
| Great Falls, MT | Great Falls VA Clinic | outpatient | 2 | Fort Harrison VA Medical Center | 72 |
| Great Lakes, IL | Captain James A. Lovell Federal Health Care Center | hospital | 1 | Captain James A. Lovell Federal Health Care Center | 1 |
| Green Bay, WI | Milo C. Huempfner Department of Veterans Affairs Outpatient Clinic | outpatient | 2 | Oscar G. Johnson Department of Veterans Affairs Medical Facility | 89 |
| Greenbelt, MD | Franklin Street VA Clinic | outpatient | 7 | Washington VA Medical Center | 8 |
| Greenlawn, NY | Northport VA Medical Center | hospital | 4 | Northport VA Medical Center | 4 |
| Greenville, SC | Lance Corporal Dana Cornell Darnell VA Clinic | outpatient | 3 | Charles George Department of Veterans Affairs Medical Center | 52 |
| Greenville, TX | Greenville VA Clinic | outpatient | 4 | Dallas VA Medical Center | 50 |
| Groton, CT | John J. McGuirk Department of Veterans Affairs Outpatient Clinic | outpatient | 2 | West Haven VA Medical Center | 46 |
| Haltom City, TX | Fort Worth New York VA Clinic | outpatient | 6 | Dallas VA Medical Center | 29 |
| Hamilton, WA | Mount Vernon VA Clinic | outpatient | 17 | Seattle VA Medical Center | 68 |
| Hammond, LA | Hammond VA Clinic | outpatient | 2 | New Orleans VA Medical Center | 44 |
| Hampton, VA | Hampton 1 VA Mobile Clinic | outpatient | 3 | Hampton VA Medical Center | 3 |
| Hanover, MD | Glen Burnie VA Clinic | outpatient | 5 | Baltimore VA Medical Center | 10 |
| Harrisburg, PA | Cumberland County VA Clinic | outpatient | 7 | Lebanon VA Medical Center | 25 |
| Harrison Township, MI | Detroit VA Medical Center-Valor Center | outpatient | 20 | John D. Dingell Department of Veterans Affairs Medical Center | 20 |
| Hartford, CT | Newington VA Clinic | outpatient | 5 | West Haven VA Medical Center | 36 |
| Hazel Green, AL | Huntsville VA Clinic | outpatient | 14 | Nashville VA Medical Center | 85 |
| Herndon, VA | Montgomery County VA Clinic | outpatient | 15 | Washington VA Medical Center | 20 |
| Hertford, NC | Albemarle VA Clinic | outpatient | 14 | Hampton VA Medical Center | 58 |
| Hickam AFB, HI | Spark M. Matsunaga Department of Veterans Affairs Medical Center | hospital | 4 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 4 |
| Highlands Ranch, CO | Valor Point VA Domiciliary | outpatient | 10 | Rocky Mountain Regional VA Medical Center | 16 |
| Hill Air Force Base, UT | Ogden VA Clinic | outpatient | 6 | George E. Wahlen Department of Veterans Affairs Medical Center | 25 |
| Hilliard, FL | St. Marys VA Clinic | outpatient | 21 | Malcom Randall Department of Veterans Affairs Medical Center | 77 |
| Hilton Head Island, SC | Beaufort VA Clinic | outpatient | 14 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 61 |
| Holt, MI | Lansing VA Clinic | outpatient | 2 | Battle Creek VA Medical Center | 44 |
| Homestead, FL | Homestead VA Clinic | outpatient | 2 | Bruce W. Carter Department of Veterans Affairs Medical Center | 26 |
| Honolulu, HI | Spark M. Matsunaga Department of Veterans Affairs Medical Center | hospital | 4 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 4 |
| Houston, TX | Houston Webster VA Clinic | outpatient | 3 | Michael E. DeBakey Department of Veterans Affairs Medical Center | 6 |
| Hudson, NH | Lowell VA Clinic | outpatient | 12 | Manchester VA Medical Center | 17 |
| Huntington, WV | Huntington Ninth Street VA Clinic | outpatient | 1 | Hershel "Woody" Williams VA Medical Center | 5 |
| Huntsville, AL | Huntsville VA Clinic | outpatient | 4 | Birmingham VA Medical Center | 83 |
| Hurlburt Field, FL | Eglin Air Force Base VA Clinic | outpatient | 10 | Biloxi VA Medical Center | 133 |
| Idaho Falls, ID | Idaho Falls VA Clinic | outpatient | 2 | George E. Wahlen Department of Veterans Affairs Medical Center | 189 |
| Independence, MO | Honor VA Clinic | outpatient | 6 | Kansas City VA Medical Center | 9 |
| Indian Springs, NV | Pahrump VA Clinic | outpatient | 30 | North Las Vegas VA Medical Center | 40 |
| Indian Trail, NC | North Charlotte VA Clinic | outpatient | 16 | W.G. (Bill) Hefner Salisbury Department of Veterans Affairs Medical Center | 43 |
| Indianapolis, IN | Indianapolis VA Clinic | outpatient | 1 | Richard L. Roudebush Veterans' Administration Medical Center | 2 |
| Irmo, SC | Wm. Jennings Bryan Dorn Department of Veterans Affairs Medical Center | hospital | 16 | Wm. Jennings Bryan Dorn Department of Veterans Affairs Medical Center | 16 |
| Irvine, CA | Laguna Hills VA Clinic | outpatient | 5 | Tibor Rubin VA Medical Center | 21 |
| Irving, TX | Grand Prairie VA Clinic | outpatient | 10 | Dallas VA Medical Center | 15 |
| Ithaca, NY | Tompkins County VA Clinic | outpatient | 3 | Wilkes-Barre VA Medical Center | 89 |
| Iuka, MS | Savannah VA Clinic | outpatient | 29 | Lt. Col. Luke Weathers, Jr. VA Medical Center | 106 |
| JBER, AK | Joint Base Elmendorf-Richardson VA Medical Center | outpatient | 3 | Colonel Mary Louise Rasmuson Campus of the Alaska VA Healthcare System | 3 |
| Jackson, MI | Jackson VA Clinic | outpatient | 4 | Lieutenant Colonel Charles S. Kettles VA Medical Center | 35 |
| Jackson, MS | Jackson 2 VA Mobile Clinic | outpatient | 3 | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | 3 |
| Jackson, TN | Jackson VA Clinic | outpatient | 0 | Lt. Col. Luke Weathers, Jr. VA Medical Center | 76 |
| Jacksonville, FL | Jacksonville 1 VA Clinic | outpatient | 0 | Malcom Randall Department of Veterans Affairs Medical Center | 63 |
| Jacksonville, NC | Jacksonville 3 VA Clinic | outpatient | 2 | Fayetteville VA Medical Center | 86 |
| Jamaica, NY | Thomas P. Noonan Jr. Department of Veterans Affairs Outpatient Clinic | outpatient | 4 | Margaret Cochran Corbin VA Campus | 9 |
| Jamestown, ND | Jamestown VA Clinic | outpatient | 3 | Fargo VA Medical Center | 91 |
| Jamestown, NY | Jamestown VA Clinic | outpatient | 1 | Erie VA Medical Center | 42 |
| Jefferson City, MO | Jefferson City VA Clinic | outpatient | 4 | John J. Cochran Veterans Hospital | 105 |
| John C Stennis Space Center, MS | Biloxi VA Medical Center | hospital | 24 | Biloxi VA Medical Center | 24 |
| Johnston, IA | Des Moines VA Medical Center | outpatient | 6 | Omaha VA Medical Center | 121 |
| Junction City, KS | Junction City VA Clinic | outpatient | 2 | Kansas City VA Medical Center | 124 |
| Jupiter, FL | Thomas H. Corey VA Medical Center | hospital | 9 | Thomas H. Corey VA Medical Center | 9 |
| Kahului, HI | Maui VA Clinic | outpatient | 1 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 98 |
| Kalamazoo, MI | Battle Creek VA Medical Center | hospital | 16 | Battle Creek VA Medical Center | 16 |
| Kansas City, MO | Kansas City VA Medical Center | hospital | 4 | Kansas City VA Medical Center | 4 |
| Kenosha, WI | Kenosha VA Clinic | outpatient | 3 | Captain James A. Lovell Federal Health Care Center | 19 |
| Key West, FL | Key West VA Clinic | outpatient | 2 | Bruce W. Carter Department of Veterans Affairs Medical Center | 130 |
| Keyport, WA | Silverdale VA Clinic | outpatient | 4 | Seattle VA Medical Center | 17 |
| Killeen, TX | Killeen VA Clinic | outpatient | 1 | Olin E. Teague Veterans' Center | 22 |
| King of Prussia, PA | West Norriton VA Clinic | outpatient | 2 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 14 |
| Kingsport, TN | Johnson City VA Clinic | outpatient | 17 | James H. Quillen Department of Veterans Affairs Medical Center | 17 |
| Kingsville, TX | South Enterprize VA Clinic | outpatient | 30 | Audie L. Murphy Memorial Veterans' Hospital | 145 |
| Kuna, ID | Boise VA Medical Center | hospital | 13 | Boise VA Medical Center | 13 |
| Kāneʻohe, HI | Windward VA Clinic | outpatient | 1 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 7 |
| Lafayette, CO | York Street VA Clinic | outpatient | 17 | Rocky Mountain Regional VA Medical Center | 22 |
| Lafayette, LA | Lafayette Campus B VA Clinic | outpatient | 1 | Alexandria VA Medical Center | 83 |
| Lake Charles, LA | Douglas Fournet Department of Veterans Affairs Clinic | outpatient | 2 | Alexandria VA Medical Center | 92 |
| Lake Forest, CA | Laguna Hills VA Clinic | outpatient | 4 | Tibor Rubin VA Medical Center | 27 |
| Lakewood, CA | Tibor Rubin VA Medical Center | hospital | 5 | Tibor Rubin VA Medical Center | 5 |
| Lancaster, PA | Lancaster County VA Clinic | outpatient | 4 | Lebanon VA Medical Center | 20 |
| Langley Afb, VA | Langley VA Clinic | outpatient | 1 | Hampton VA Medical Center | 5 |
| Lansing, MI | Lansing VA Clinic | outpatient | 3 | Battle Creek VA Medical Center | 45 |
| Largo, FL | C.W. Bill Young Department of Veterans Affairs Medical Center | hospital | 7 | C.W. Bill Young Department of Veterans Affairs Medical Center | 7 |
| Las Cruces, NM | Las Cruces VA Clinic | outpatient | 2 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 189 |
| Las Vegas, NV | Northwest Las Vegas VA Clinic | outpatient | 2 | North Las Vegas VA Medical Center | 10 |
| Laurel, MD | Fort Meade VA Clinic | outpatient | 7 | Washington VA Medical Center | 14 |
| Lawrence, KS | Lawrence VA Clinic | outpatient | 2 | Kansas City VA Medical Center | 40 |
| Lawton, OK | Lawton VA Clinic | outpatient | 4 | Oklahoma City VA Medical Center | 79 |
| Lenexa, KS | Shawnee VA Clinic | outpatient | 4 | Kansas City VA Medical Center | 16 |
| Lexington, KY | Troy Bowling Campus | outpatient | 1 | Franklin R. Sousley Campus | 3 |
| Lexington, MA | Edith Nourse Rogers Memorial Veterans' Hospital | hospital | 5 | Edith Nourse Rogers Memorial Veterans' Hospital | 5 |
| Lexington Park, MD | Lexington Park VA Clinic | outpatient | 2 | Washington VA Medical Center | 56 |
| Libby, MT | Libby VA Clinic | outpatient | 1 | Mann-Grandstaff Department of Veterans Affairs Medical Center | 100 |
| Lincoln, NE | Lincoln VA Clinic | outpatient | 2 | Omaha VA Medical Center | 47 |
| Linthicum, MD | Glen Burnie VA Clinic | outpatient | 4 | Baltimore VA Medical Center | 6 |
| Linthicum Heights, MD | Glen Burnie VA Clinic | outpatient | 4 | Baltimore VA Medical Center | 6 |
| Little Rock, AR | Little Rock 2 VA Mobile Clinic | outpatient | 3 | John L. McClellan Memorial Veterans' Hospital | 3 |
| Littleton, CO | Valor Point VA Domiciliary | outpatient | 6 | Rocky Mountain Regional VA Medical Center | 15 |
| Livermore, CA | Palo Alto VA Medical Center-Livermore | outpatient | 4 | Palo Alto VA Medical Center | 29 |
| Liverpool, NY | Erie West VA Clinic | outpatient | 5 | Wilkes-Barre VA Medical Center | 130 |
| Lompoc, CA | Santa Maria VA Clinic | outpatient | 20 | West Los Angeles VA Medical Center | 122 |
| Londonderry, NH | Manchester VA Medical Center | hospital | 12 | Manchester VA Medical Center | 12 |
| Long Beach, MS | Biloxi VA Medical Center | hospital | 13 | Biloxi VA Medical Center | 13 |
| Longmont, CO | Loveland VA Clinic | outpatient | 18 | Rocky Mountain Regional VA Medical Center | 33 |
| Lorton, VA | Fort Belvoir VA Clinic | outpatient | 4 | Washington VA Medical Center | 19 |
| Los Angeles, CA | Greater Los Angeles VA Mobile Clinic | outpatient | 3 | West Los Angeles VA Medical Center | 4 |
| Louisville, KY | Newburg VA Clinic | outpatient | 4 | Robley Rex Department of Veterans Affairs Medical Center | 4 |
| Loveland, CO | Loveland VA Clinic | outpatient | 3 | Rocky Mountain Regional VA Medical Center | 48 |
| Lubbock, TX | Lubbock VA Clinic | outpatient | 2 | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 95 |
| Lynchburg, VA | Private First Class Desmond T. Doss VA Clinic | outpatient | 0 | Salem VA Medical Center | 46 |
| Lynnwood, WA | Edmonds VA Clinic | outpatient | 2 | Seattle VA Medical Center | 18 |
| Madison, WI | William S. Middleton Memorial Veterans' Hospital | hospital | 1 | William S. Middleton Memorial Veterans' Hospital | 1 |
| Magna, UT | South Jordan VA Clinic | outpatient | 18 | George E. Wahlen Department of Veterans Affairs Medical Center | 18 |
| Malabar, FL | Palm Bay VA Clinic | outpatient | 3 | Orlando VA Medical Center | 50 |
| Manassas, VA | Fort Belvoir VA Clinic | outpatient | 19 | Washington VA Medical Center | 28 |
| Manchester, IA | Linn County VA Clinic | outpatient | 34 | William S. Middleton Memorial Veterans' Hospital | 110 |
| Manchester, NH | Manchester West VA Clinic | outpatient | 2 | Manchester VA Medical Center | 2 |
| Manhattan Beach, CA | Gardena VA Clinic | outpatient | 7 | West Los Angeles VA Medical Center | 12 |
| Maple Grove, MN | Northwest Metro VA Clinic | outpatient | 8 | Minneapolis VA Medical Center | 19 |
| Marana, AZ | Northwest Tucson VA Clinic | outpatient | 8 | Tucson VA Medical Center | 22 |
| Marietta, GA | Cobb County VA Clinic | outpatient | 2 | Joseph Maxwell Cleland Atlanta VA Medical Center | 17 |
| Marlborough, MA | Framingham VA Clinic | outpatient | 8 | Edith Nourse Rogers Memorial Veterans' Hospital | 18 |
| Marysville, CA | Yuba City VA Clinic | outpatient | 2 | Ioannis A. Lougaris Veterans' Administration Medical Center | 99 |
| Mason, OH | Middletown VA Clinic | outpatient | 10 | Cincinnati VA Medical Center | 19 |
| McClellan Park, CA | McClellan VA Clinic | outpatient | 1 | San Francisco VA Medical Center | 85 |
| McHenry, MS | Biloxi VA Medical Center | hospital | 24 | Biloxi VA Medical Center | 24 |
| McLean, VA | Washington VA Medical Center | hospital | 10 | Washington VA Medical Center | 10 |
| Mcalester, OK | McAlester VA Clinic | outpatient | 1 | Jack C. Montgomery Department of Veterans Affairs Medical Center | 61 |
| Mckinney, TX | U.S. Congressman Sam Johnson Memorial VA Clinic | outpatient | 14 | Dallas VA Medical Center | 36 |
| Mechanicsburg, PA | Cumberland County VA Clinic | outpatient | 2 | Lebanon VA Medical Center | 32 |
| Medford, OR | White City VA Medical Center | hospital | 7 | White City VA Medical Center | 7 |
| Medley, FL | Bruce W. Carter Department of Veterans Affairs Medical Center | hospital | 10 | Bruce W. Carter Department of Veterans Affairs Medical Center | 10 |
| Melbourne, FL | Palm Bay VA Clinic | outpatient | 7 | Orlando VA Medical Center | 41 |
| Memphis, TN | Nonconnah Boulevard VA Clinic | outpatient | 3 | Lt. Col. Luke Weathers, Jr. VA Medical Center | 4 |
| Meridian, ID | Boise VA Medical Center | hospital | 11 | Boise VA Medical Center | 11 |
| Meridian, MS | Meridian VA Clinic | outpatient | 1 | G.V. (Sonny) Montgomery Department of Veterans Affairs Medical Center | 86 |
| Merrimack, NH | Manchester West VA Clinic | outpatient | 10 | Manchester VA Medical Center | 10 |
| Merritt Island, FL | Viera VA Clinic | outpatient | 5 | Orlando VA Medical Center | 37 |
| Mesa, AZ | Mesa VA Clinic | outpatient | 5 | Carl T. Hayden Veterans' Administration Medical Center | 21 |
| Miamisburg, OH | Dayton VA Medical Center | hospital | 8 | Dayton VA Medical Center | 8 |
| Middletown, CT | Newington VA Clinic | outpatient | 11 | West Haven VA Medical Center | 24 |
| Middletown, NY | Goshen VA Clinic | outpatient | 6 | Franklin Delano Roosevelt Hospital | 29 |
| Middletown, PA | Cumberland County VA Clinic | outpatient | 13 | Lebanon VA Medical Center | 19 |
| Middletown, RI | Middletown VA Clinic | outpatient | 1 | Providence VA Medical Center | 21 |
| Midland, GA | Robert S. Poydasheff VA Clinic | outpatient | 10 | Central Alabama VA Medical Center-Montgomery | 84 |
| Milford, MI | Howell VA Clinic | outpatient | 15 | Lieutenant Colonel Charles S. Kettles VA Medical Center | 22 |
| Millersville, MD | Fort Meade VA Clinic | outpatient | 5 | Baltimore VA Medical Center | 16 |
| Millington, TN | Covington VA Clinic | outpatient | 8 | Lt. Col. Luke Weathers, Jr. VA Medical Center | 15 |
| Milwaukee, WI | Milwaukee VA Clinic | outpatient | 3 | Clement J. Zablocki Veterans' Administration Medical Center | 3 |
| Minneapolis, MN | Minneapolis VA Clinic | outpatient | 1 | Minneapolis VA Medical Center | 5 |
| Minot, ND | Minot VA Clinic | outpatient | 3 | Fargo VA Medical Center | 229 |
| Miramar, FL | Pembroke Pines VA Clinic | outpatient | 8 | Bruce W. Carter Department of Veterans Affairs Medical Center | 15 |
| Missoula, MT | David J. Thatcher VA Clinic | outpatient | 3 | Fort Harrison VA Medical Center | 93 |
| Mobile, AL | Mobile VA Clinic | outpatient | 6 | Biloxi VA Medical Center | 53 |
| Monroe, NC | North Charlotte VA Clinic | outpatient | 22 | W.G. (Bill) Hefner Salisbury Department of Veterans Affairs Medical Center | 47 |
| Monterey, CA | Major General William H. Gourley VA-DoD Outpatient Clinic | outpatient | 6 | Palo Alto VA Medical Center | 57 |
| Montgomery, AL | Central Alabama VA Medical Center-Montgomery | hospital | 3 | Central Alabama VA Medical Center-Montgomery | 3 |
| Moorestown, NJ | Burlington County VA Clinic | outpatient | 4 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 14 |
| Morgantown, WV | Monongalia County VA Clinic | outpatient | 2 | Louis A. Johnson Veterans' Administration Medical Center | 34 |
| Morrisville, NC | Brier Creek VA Clinic | outpatient | 6 | Durham VA Medical Center | 13 |
| Muskegon, MI | Muskegon VA Clinic | outpatient | 4 | Battle Creek VA Medical Center | 78 |
| Nashua, NH | Lowell VA Clinic | outpatient | 13 | Manchester VA Medical Center | 18 |
| Nashville, TN | Albion Street VA Clinic | outpatient | 1 | Nashville VA Medical Center | 2 |
| Natick, MA | Framingham VA Clinic | outpatient | 4 | Jamaica Plain VA Medical Center | 12 |
| Nellis Afb, NV | North Las Vegas VA Medical Center | hospital | 3 | North Las Vegas VA Medical Center | 3 |
| New Kent, VA | Richmond 1 VA Mobile Clinic | outpatient | 26 | Richmond VA Medical Center | 27 |
| New Orleans, LA | New Orleans VA Medical Center | hospital | 11 | New Orleans VA Medical Center | 11 |
| New York, NY | Margaret Cochran Corbin VA Campus | hospital | 5 | Margaret Cochran Corbin VA Campus | 5 |
| Newark, NJ | East Orange VA Medical Center | hospital | 4 | East Orange VA Medical Center | 4 |
| Newport, RI | Middletown VA Clinic | outpatient | 4 | Providence VA Medical Center | 25 |
| Newport News, VA | Langley VA Clinic | outpatient | 9 | Hampton VA Medical Center | 11 |
| Niagara Falls, NY | Niagara Falls VA Clinic | outpatient | 2 | Buffalo VA Medical Center | 14 |
| Norco, CA | Corona VA Clinic | outpatient | 3 | Jerry L. Pettis Memorial Veterans' Hospital | 19 |
| Norfolk, VA | Portsmouth VA Clinic | outpatient | 7 | Hampton VA Medical Center | 8 |
| North Amityville, NY | East Meadow VA Clinic | outpatient | 8 | Northport VA Medical Center | 15 |
| North Berwick, ME | Somersworth VA Clinic | outpatient | 9 | Manchester VA Medical Center | 41 |
| North Charleston, SC | North Charleston VA Clinic | outpatient | 2 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 11 |
| North Fort Lewis, WA | American Lake VA Medical Center | outpatient | 2 | Seattle VA Medical Center | 33 |
| North Kingstown, RI | Middletown VA Clinic | outpatient | 8 | Providence VA Medical Center | 18 |
| North Las Vegas, NV | Southern Nevada VA Mobile Clinic | outpatient | 0 | North Las Vegas VA Medical Center | 0 |
| North Logan, UT | Cache Valley VA Clinic | outpatient | 1 | George E. Wahlen Department of Veterans Affairs Medical Center | 71 |
| North Platte, NE | North Platte VA Clinic | outpatient | 1 | Cheyenne VA Medical Center | 210 |
| Northampton, MA | Edward P. Boland Department of Veterans Affairs Medical Center | hospital | 2 | Edward P. Boland Department of Veterans Affairs Medical Center | 2 |
| Norton Shores, MI | Muskegon VA Clinic | outpatient | 5 | Battle Creek VA Medical Center | 74 |
| Oak Ridge, TN | Kingston Pike VA Clinic | outpatient | 13 | Charles George Department of Veterans Affairs Medical Center | 105 |
| Oakland, CA | Twenty-First Street VA Clinic | outpatient | 4 | San Francisco VA Medical Center | 15 |
| Ocean Springs, MS | Gulf Coast West VA Mobile Medical Unit-Clinic | outpatient | 9 | Biloxi VA Medical Center | 9 |
| Oceanside, CA | Oceanside VA Clinic | outpatient | 1 | Jennifer Moreno Department of Veterans Affairs Medical Center | 24 |
| Odenton, MD | Fort Meade VA Clinic | outpatient | 3 | Baltimore VA Medical Center | 16 |
| Odessa, TX | Wilson and Young Medal of Honor VA Clinic | outpatient | 4 | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 57 |
| Offutt Air Force Base, NE | Papillion VA Community Living Center | outpatient | 6 | Omaha VA Medical Center | 8 |
| Ogden, UT | Ogden VA Clinic | outpatient | 3 | George E. Wahlen Department of Veterans Affairs Medical Center | 33 |
| Oklahoma City, OK | Oklahoma City VA Medical Center | hospital | 1 | Oklahoma City VA Medical Center | 1 |
| Olathe, KS | Lenexa VA Clinic | outpatient | 4 | Kansas City VA Medical Center | 20 |
| Olympia, WA | Olympia VA Clinic | outpatient | 3 | Seattle VA Medical Center | 45 |
| Omaha, NE | Omaha VA Medical Center | hospital | 4 | Omaha VA Medical Center | 4 |
| Ontario, CA | Rancho Cucamonga VA Clinic | outpatient | 6 | Jerry L. Pettis Memorial Veterans' Hospital | 20 |
| Opa Locka, FL | Bruce W. Carter Department of Veterans Affairs Medical Center | hospital | 8 | Bruce W. Carter Department of Veterans Affairs Medical Center | 8 |
| Orange, VA | Charlottesville VA Clinic | outpatient | 24 | Richmond VA Medical Center | 63 |
| Orlando, FL | Orlando 2 VA Mobile Clinic | outpatient | 3 | Orlando VA Medical Center | 3 |
| Overland Park, KS | Overland Park VA Clinic | outpatient | 3 | Kansas City VA Medical Center | 15 |
| Owego, NY | Sayre VA Clinic | outpatient | 17 | Wilkes-Barre VA Medical Center | 63 |
| Oxnard, CA | Captain Rosemary Bryant Mariner Outpatient Clinic | outpatient | 4 | West Los Angeles VA Medical Center | 44 |
| Pace, FL | Pensacola VA Clinic | outpatient | 17 | Biloxi VA Medical Center | 107 |
| Palm Bay, FL | Palm Bay VA Clinic | outpatient | 5 | Orlando VA Medical Center | 47 |
| Palmdale, CA | Antelope Valley VA Clinic | outpatient | 8 | West Los Angeles VA Medical Center | 42 |
| Palo Alto, CA | Palo Alto VA Medical Center | hospital | 0 | Palo Alto VA Medical Center | 0 |
| Panama City, FL | Panama City Beach VA Clinic | outpatient | 13 | Central Alabama VA Medical Center-Montgomery | 155 |
| Parkersburg, WV | Wood County VA Clinic | outpatient | 1 | Louis A. Johnson Veterans' Administration Medical Center | 63 |
| Pasadena, CA | San Gabriel Valley VA Clinic | outpatient | 6 | West Los Angeles VA Medical Center | 20 |
| Pascagoula, MS | Gulf Coast West VA Mobile Medical Unit-Clinic | outpatient | 24 | Biloxi VA Medical Center | 24 |
| Paterson, NJ | Paterson VA Clinic | outpatient | 1 | East Orange VA Medical Center | 12 |
| Patrick Air Force Base, FL | Viera VA Clinic | outpatient | 8 | Orlando VA Medical Center | 42 |
| Patuxent River, MD | Lexington Park VA Clinic | outpatient | 2 | Washington VA Medical Center | 55 |
| Pearl Harbor, HI | Spark M. Matsunaga Department of Veterans Affairs Medical Center | hospital | 4 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 4 |
| Pelham, NH | Lowell VA Clinic | outpatient | 8 | Edith Nourse Rogers Memorial Veterans' Hospital | 16 |
| Pensacola, FL | Pensacola VA Clinic | outpatient | 7 | Biloxi VA Medical Center | 105 |
| Peoria, IL | Bob Michel Department of Veterans Affairs Outpatient Clinic | outpatient | 4 | Danville VA Medical Center | 115 |
| Petersburg, VA | Richmond 1 VA Mobile Clinic | outpatient | 19 | Richmond VA Medical Center | 19 |
| Peterson Afb, CO | Space Center VA Clinic | outpatient | 2 | Rocky Mountain Regional VA Medical Center | 64 |
| Philadelphia, PA | Fourth Street VA Clinic | outpatient | 4 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 5 |
| Phoenix, AZ | Thunderbird VA Clinic | outpatient | 1 | Carl T. Hayden Veterans' Administration Medical Center | 5 |
| Picatinny Arsenal, NJ | Morristown VA Clinic | outpatient | 9 | East Orange VA Medical Center | 21 |
| Pierre, SD | Pierre VA Clinic | outpatient | 0 | Fort Meade VA Medical Center | 156 |
| Pittsburgh, PA | Pittsburgh VA Medical Center-University Drive | hospital | 1 | Pittsburgh VA Medical Center-University Drive | 1 |
| Pittsfield, MA | Pittsfield VA Clinic | outpatient | 0 | Edward P. Boland Department of Veterans Affairs Medical Center | 30 |
| Plano, TX | U.S. Congressman Sam Johnson Memorial VA Clinic | outpatient | 2 | Dallas VA Medical Center | 25 |
| Plymouth, MI | Major General Oliver W. Dillard VA Clinic | outpatient | 4 | Lieutenant Colonel Charles S. Kettles VA Medical Center | 14 |
| Plymouth, MN | Minneapolis VA Clinic | outpatient | 10 | Minneapolis VA Medical Center | 15 |
| Pontiac, MI | Pontiac VA Clinic | outpatient | 3 | John D. Dingell Department of Veterans Affairs Medical Center | 23 |
| Port Hueneme, CA | Captain Rosemary Bryant Mariner Outpatient Clinic | outpatient | 7 | West Los Angeles VA Medical Center | 43 |
| Port Huron, MI | Yale VA Clinic | outpatient | 20 | John D. Dingell Department of Veterans Affairs Medical Center | 54 |
| Portland, ME | Portland VA Clinic | outpatient | 4 | Togus VA Medical Center | 51 |
| Portland, OR | Portland VA Clinic | outpatient | 2 | Portland VA Medical Center | 3 |
| Portsmouth, RI | Middletown VA Clinic | outpatient | 1 | Providence VA Medical Center | 23 |
| Portsmouth, VA | Portsmouth VA Clinic | outpatient | 4 | Hampton VA Medical Center | 11 |
| Poulsbo, WA | Silverdale VA Clinic | outpatient | 6 | Seattle VA Medical Center | 20 |
| Premont, TX | South Enterprize VA Clinic | outpatient | 49 | Audie L. Murphy Memorial Veterans' Hospital | 151 |
| Princeton, NJ | Hamilton VA Clinic | outpatient | 7 | East Orange VA Medical Center | 36 |
| Providence, RI | Eagle Street VA Clinic | outpatient | 1 | Providence VA Medical Center | 1 |
| Pueblo, CO | Pueblo VA Community Living Center | outpatient | 3 | Rocky Mountain Regional VA Medical Center | 103 |
| Quincy, MA | Quincy VA Clinic | outpatient | 1 | Jamaica Plain VA Medical Center | 7 |
| Raleigh, NC | Raleigh III VA Clinic | outpatient | 2 | Durham VA Medical Center | 21 |
| Rancho Cordova, CA | Sacramento VA Medical Center | outpatient | 3 | San Francisco VA Medical Center | 88 |
| Rapid City, SD | Rapid City VA Clinic | outpatient | 4 | Fort Meade VA Medical Center | 27 |
| Reading, PA | Berks County VA Clinic | outpatient | 4 | Coatesville VA Medical Center | 25 |
| Redmond, WA | Seattle VA Mobile Clinic | outpatient | 12 | Seattle VA Medical Center | 12 |
| Redondo Beach, CA | Gardena VA Clinic | outpatient | 6 | West Los Angeles VA Medical Center | 14 |
| Reno, NV | North Reno VA Clinic | outpatient | 3 | Ioannis A. Lougaris Veterans' Administration Medical Center | 4 |
| Reston, VA | Montgomery County VA Clinic | outpatient | 14 | Washington VA Medical Center | 18 |
| Richardson, TX | Garland VA Medical Center | outpatient | 5 | Dallas VA Medical Center | 20 |
| Richmond, VA | Richmond VA Medical Center | hospital | 2 | Richmond VA Medical Center | 2 |
| Ridgecrest, CA | Antelope Valley VA Clinic | outpatient | 69 | Jerry L. Pettis Memorial Veterans' Hospital | 112 |
| Rio Rancho, NM | Northwest Metro VA Clinic | outpatient | 5 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 17 |
| Riverside, CA | Corona VA Clinic | outpatient | 8 | Jerry L. Pettis Memorial Veterans' Hospital | 11 |
| Robins AFB, GA | Robins VA Clinic | outpatient | 0 | Carl Vinson Veterans' Administration Medical Center | 38 |
| Rochester, NY | Rochester Clinton Crossings VA Clinic | outpatient | 4 | Buffalo VA Medical Center | 62 |
| Rock Island, IL | Davenport VA Clinic | outpatient | 4 | William S. Middleton Memorial Veterans' Hospital | 126 |
| Rockford, IL | Rockford VA Clinic | outpatient | 4 | William S. Middleton Memorial Veterans' Hospital | 59 |
| Rockville, MD | Montgomery County VA Clinic | outpatient | 3 | Washington VA Medical Center | 13 |
| Rockwall, TX | Garland VA Medical Center | outpatient | 13 | Dallas VA Medical Center | 26 |
| Rolling Meadows, IL | Hoffman Estates VA Clinic | outpatient | 9 | Captain James A. Lovell Federal Health Care Center | 18 |
| Rome, NY | Donald J. Mitchell Department of Veterans Affairs Outpatient Clinic | outpatient | 4 | Wilkes-Barre VA Medical Center | 138 |
| Roseville, CA | McClellan VA Clinic | outpatient | 8 | San Francisco VA Medical Center | 94 |
| Sacramento, CA | McClellan VA Clinic | outpatient | 8 | San Francisco VA Medical Center | 78 |
| Saginaw, MI | Aleda E. Lutz Department of Veterans Affairs Medical Center | hospital | 2 | Aleda E. Lutz Department of Veterans Affairs Medical Center | 2 |
| Salem, OR | Salem VA Clinic | outpatient | 2 | Portland VA Medical Center | 42 |
| Salt Lake City, UT | Salt Lake City VA Mobile Clinic | outpatient | 5 | George E. Wahlen Department of Veterans Affairs Medical Center | 5 |
| San Angelo, TX | Colonel Charles and JoAnne Powell VA Clinic | outpatient | 3 | George H. O'Brien, Jr., Department of Veterans Affairs Medical Center | 81 |
| San Antonio, TX | Balcones Heights VA Clinic | outpatient | 2 | Audie L. Murphy Memorial Veterans' Hospital | 5 |
| San Diego, CA | Kearny Mesa VA Clinic | outpatient | 0 | Jennifer Moreno Department of Veterans Affairs Medical Center | 7 |
| San Dimas, CA | San Gabriel Valley VA Clinic | outpatient | 13 | Tibor Rubin VA Medical Center | 29 |
| San Francisco, CA | San Francisco VA Mobile Clinic | outpatient | 29 | San Francisco VA Medical Center | 29 |
| San Jose, CA | San Jose VA Clinic | outpatient | 2 | Palo Alto VA Medical Center | 19 |
| San Juan, PR | San Juan 1 VA Mobile Clinic | outpatient | 2 | San Juan VA Medical Center | 2 |
| San Marcos, TX | New Braunfels VA Clinic | outpatient | 13 | Audie L. Murphy Memorial Veterans' Hospital | 46 |
| San Miguel, CA | Martinez VA Medical Center | outpatient | 9 | San Francisco VA Medical Center | 27 |
| Santa Ana, CA | West Santa Ana VA Clinic | outpatient | 1 | Tibor Rubin VA Medical Center | 14 |
| Santa Clara, CA | Palo Alto VA Medical Center | hospital | 10 | Palo Alto VA Medical Center | 10 |
| Santa Fe Springs, CA | Santa Fe Springs VA Clinic | outpatient | 1 | Tibor Rubin VA Medical Center | 11 |
| Santa Isabel, PR | Eurípides Rubio Department of Veterans Affairs Outpatient Clinic | outpatient | 13 | San Juan VA Medical Center | 36 |
| Santa Rita, GU | Guam VA Clinic | outpatient | 8 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 3808 |
| Savannah, GA | Savannah VA Clinic | outpatient | 3 | Ralph H. Johnson Department of Veterans Affairs Medical Center | 90 |
| Scott AFB, IL | Scott Air Force Base VA Clinic | outpatient | 1 | John J. Cochran Veterans Hospital | 22 |
| Scott Air Force Base, IL | Scott Air Force Base VA Clinic | outpatient | 1 | John J. Cochran Veterans Hospital | 22 |
| Scottsdale, AZ | Northeast Phoenix VA Clinic | outpatient | 7 | Carl T. Hayden Veterans' Administration Medical Center | 17 |
| Scranton, PA | Wilkes-Barre VA Medical Center | hospital | 14 | Wilkes-Barre VA Medical Center | 14 |
| Seaside, CA | Major General William H. Gourley VA-DoD Outpatient Clinic | outpatient | 3 | Palo Alto VA Medical Center | 56 |
| Seattle, WA | Seattle VA Mobile Clinic | outpatient | 4 | Seattle VA Medical Center | 4 |
| Seven Fields, PA | Cranberry Township VA Clinic | outpatient | 2 | Pittsburgh VA Medical Center-University Drive | 18 |
| Shalimar, FL | Eglin Air Force Base VA Clinic | outpatient | 2 | Central Alabama VA Medical Center-Montgomery | 135 |
| Shreveport, LA | Overton Brooks Veterans' Administration Medical Center | hospital | 5 | Overton Brooks Veterans' Administration Medical Center | 5 |
| Sierra Vista, AZ | Sierra Vista VA Clinic | outpatient | 2 | Tucson VA Medical Center | 57 |
| Silverdale, WA | Silverdale VA Clinic | outpatient | 1 | Seattle VA Medical Center | 19 |
| Simpsonville, SC | Lance Corporal Dana Cornell Darnell VA Clinic | outpatient | 11 | Charles George Department of Veterans Affairs Medical Center | 61 |
| Sioux Falls, SD | Royal C. Johnson Veterans' Memorial Hospital | hospital | 1 | Royal C. Johnson Veterans' Memorial Hospital | 1 |
| South Burlington, VT | Burlington Lakeside VA Clinic | outpatient | 2 | White River Junction VA Medical Center | 69 |
| South Plainfield, NJ | Piscataway VA Clinic | outpatient | 4 | East Orange VA Medical Center | 16 |
| Southfield, MI | Pontiac VA Clinic | outpatient | 10 | John D. Dingell Department of Veterans Affairs Medical Center | 13 |
| Sparks, NV | North Reno VA Clinic | outpatient | 5 | Ioannis A. Lougaris Veterans' Administration Medical Center | 6 |
| Spokane, WA | East Front Avenue VA Clinic | outpatient | 2 | Mann-Grandstaff Department of Veterans Affairs Medical Center | 3 |
| Spokane Valley, WA | Spokane Valley VA Clinic | outpatient | 2 | Mann-Grandstaff Department of Veterans Affairs Medical Center | 12 |
| Springdale, AR | Sunbridge VA Clinic | outpatient | 6 | Fayetteville VA Medical Center | 8 |
| Springfield, IL | Springfield VA Clinic | outpatient | 1 | John J. Cochran Veterans Hospital | 85 |
| Springfield, MO | Gene Taylor Veterans' Outpatient Clinic | outpatient | 4 | Fayetteville VA Medical Center | 91 |
| Springfield, VA | Fort Belvoir VA Clinic | outpatient | 6 | Washington VA Medical Center | 14 |
| St Louis Park, MN | Minneapolis VA Clinic | outpatient | 4 | Minneapolis VA Medical Center | 8 |
| St Petersburg, FL | St. Petersburg VA Clinic | outpatient | 1 | C.W. Bill Young Department of Veterans Affairs Medical Center | 9 |
| St. Augustine, FL | Leo C. Chase Jr. VA Clinic | outpatient | 3 | Malcom Randall Department of Veterans Affairs Medical Center | 65 |
| St. Charles, MO | St. Charles County VA Clinic | outpatient | 1 | John J. Cochran Veterans Hospital | 19 |
| St. George, UT | St. George VA Clinic | outpatient | 1 | North Las Vegas VA Medical Center | 100 |
| St. Louis, MO | Olive Street VA Clinic | outpatient | 1 | John J. Cochran Veterans Hospital | 1 |
| St. Paul, MN | Fort Snelling VA Clinic | outpatient | 6 | Minneapolis VA Medical Center | 6 |
| Stafford, VA | Fredericksburg VA Clinic | outpatient | 10 | Washington VA Medical Center | 42 |
| Stamford, CT | Stamford VA Clinic | outpatient | 1 | Northport VA Medical Center | 17 |
| State College, PA | State College VA Clinic | outpatient | 4 | James E. Van Zandt Veterans' Administration Medical Center | 35 |
| Stennis Space Center, MS | Biloxi VA Medical Center | hospital | 24 | Biloxi VA Medical Center | 24 |
| Sterling, VA | Montgomery County VA Clinic | outpatient | 14 | Washington VA Medical Center | 22 |
| Sterling Heights, MI | Pontiac VA Clinic | outpatient | 13 | John D. Dingell Department of Veterans Affairs Medical Center | 16 |
| Stratford, CT | Orange VA Clinic | outpatient | 8 | West Haven VA Medical Center | 10 |
| Suffolk, VA | Portsmouth VA Clinic | outpatient | 21 | Hampton VA Medical Center | 28 |
| Suitland, MD | Southern Prince George's County VA Clinic | outpatient | 3 | Washington VA Medical Center | 7 |
| Sunrise, FL | William "Bill" Kling Department of Veterans Affairs Outpatient Clinic | outpatient | 2 | Bruce W. Carter Department of Veterans Affairs Medical Center | 26 |
| Sykesville, MD | Baltimore VA Medical Center | hospital | 19 | Baltimore VA Medical Center | 19 |
| Syracuse, NY | Syracuse VA Medical Center | outpatient | 0 | Wilkes-Barre VA Medical Center | 125 |
| Tacoma, WA | American Lake VA Medical Center | outpatient | 9 | Seattle VA Medical Center | 23 |
| Tallahassee, FL | Sergeant Ernest I. "Boots" Thomas VA Clinic | outpatient | 3 | Malcom Randall Department of Veterans Affairs Medical Center | 127 |
| Tampa, FL | Sabal Park VA Clinic | outpatient | 7 | James A. Haley Veterans' Hospital | 8 |
| Tehachapi, CA | Antelope Valley VA Clinic | outpatient | 35 | West Los Angeles VA Medical Center | 75 |
| Tempe, AZ | Phoenix 32nd Street VA Clinic | outpatient | 6 | Carl T. Hayden Veterans' Administration Medical Center | 11 |
| Terre Haute, IN | Terre Haute VA Clinic | outpatient | 3 | Danville VA Medical Center | 48 |
| Tewksbury, MA | Lowell VA Clinic | outpatient | 2 | Edith Nourse Rogers Memorial Veterans' Hospital | 9 |
| The Woodlands, TX | Conroe VA Clinic | outpatient | 8 | Michael E. DeBakey Department of Veterans Affairs Medical Center | 33 |
| Tinker Afb, OK | Tinker VA Clinic | outpatient | 1 | Oklahoma City VA Medical Center | 8 |
| Toledo, OH | Toledo VA Clinic | outpatient | 3 | Lieutenant Colonel Charles S. Kettles VA Medical Center | 43 |
| Torrance, CA | Gardena VA Clinic | outpatient | 4 | Tibor Rubin VA Medical Center | 14 |
| Totowa, NJ | Paterson VA Clinic | outpatient | 3 | East Orange VA Medical Center | 10 |
| Traverse City, MI | Colonel Demas T. Craw VA Clinic | outpatient | 6 | Aleda E. Lutz Department of Veterans Affairs Medical Center | 122 |
| Trenton, NJ | Hamilton VA Clinic | outpatient | 5 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 30 |
| Troy, AL | Wiregrass VA Clinic | outpatient | 36 | Central Alabama VA Medical Center-Montgomery | 43 |
| Troy, OH | Wright-Patterson VA Clinic | outpatient | 19 | Dayton VA Medical Center | 20 |
| Tucson, AZ | Tucson VA Mobile Clinic | outpatient | 6 | Tucson VA Medical Center | 6 |
| Tukwila, WA | Renton VA Clinic | outpatient | 3 | Seattle VA Medical Center | 6 |
| Tullahoma, TN | Tullahoma VA Clinic | outpatient | 11 | Nashville VA Medical Center | 62 |
| Tulsa, OK | Tulsa Eleventh Street VA Clinic | outpatient | 3 | Jack C. Montgomery Department of Veterans Affairs Medical Center | 37 |
| Twentynine Palms, CA | Sy Kaplan VA Clinic | outpatient | 30 | Jerry L. Pettis Memorial Veterans' Hospital | 68 |
| Tyler, TX | Tyler Broadway VA Clinic | outpatient | 4 | Dallas VA Medical Center | 90 |
| Union, WV | Greenbrier County VA Clinic | outpatient | 13 | Salem VA Medical Center | 36 |
| Uniontown, OH | Akron VA Clinic | outpatient | 8 | Louis Stokes Cleveland Department of Veterans Affairs Medical Center | 40 |
| Valdosta, GA | Valdosta VA Clinic | outpatient | 3 | Malcom Randall Department of Veterans Affairs Medical Center | 101 |
| Vancouver, WA | Vancouver VA Medical Center | outpatient | 3 | Portland VA Medical Center | 11 |
| Victorville, CA | Victorville VA Clinic | outpatient | 2 | Jerry L. Pettis Memorial Veterans' Hospital | 33 |
| Vienna, VA | Washington VA Medical Center | hospital | 13 | Washington VA Medical Center | 13 |
| Virgin, UT | St. George VA Clinic | outpatient | 21 | North Las Vegas VA Medical Center | 122 |
| Virginia Beach, VA | Virginia Beach VA Clinic | outpatient | 9 | Hampton VA Medical Center | 23 |
| Vista, CA | Oceanside VA Clinic | outpatient | 4 | Jennifer Moreno Department of Veterans Affairs Medical Center | 22 |
| Waco, TX | Doris Miller Department of Veterans Affairs Medical Center | outpatient | 4 | Olin E. Teague Veterans' Center | 34 |
| Wahiawa, HI | Daniel Kahikina Akaka VA Clinic | outpatient | 12 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 13 |
| Walled Lake, MI | Pontiac VA Clinic | outpatient | 12 | Lieutenant Colonel Charles S. Kettles VA Medical Center | 21 |
| Waltham, MA | Jamaica Plain VA Medical Center | hospital | 8 | Jamaica Plain VA Medical Center | 8 |
| Warner Robins, GA | Robins VA Clinic | outpatient | 2 | Carl Vinson Veterans' Administration Medical Center | 40 |
| Warren, MI | Piquette Street VA Clinic | outpatient | 9 | John D. Dingell Department of Veterans Affairs Medical Center | 10 |
| Warren, PA | Warren County VA Clinic | outpatient | 4 | Erie VA Medical Center | 50 |
| Warrenton, VA | Fredericksburg VA Clinic | outpatient | 33 | Washington VA Medical Center | 45 |
| Washington, DC | Washington VA Medical Center | hospital | 2 | Washington VA Medical Center | 2 |
| Washington D.C., DC | Washington VA Medical Center | hospital | 3 | Washington VA Medical Center | 3 |
| Washington Navy Yard, DC | Washington VA Medical Center | hospital | 3 | Washington VA Medical Center | 3 |
| Watertown, NY | Watertown VA Clinic | outpatient | 2 | Buffalo VA Medical Center | 162 |
| Wayne, NJ | Paterson VA Clinic | outpatient | 5 | East Orange VA Medical Center | 13 |
| Waynesboro, VA | Staunton VA Clinic | outpatient | 11 | Salem VA Medical Center | 82 |
| Webster, TX | Texas City VA Clinic | outpatient | 11 | Michael E. DeBakey Department of Veterans Affairs Medical Center | 20 |
| West Des Moines, IA | Des Moines VA Clinic | outpatient | 8 | Omaha VA Medical Center | 116 |
| West Palm Beach, FL | Thomas H. Corey VA Medical Center | hospital | 3 | Thomas H. Corey VA Medical Center | 3 |
| West Valley City, UT | South Jordan VA Clinic | outpatient | 10 | George E. Wahlen Department of Veterans Affairs Medical Center | 10 |
| Westford, MA | Lowell VA Clinic | outpatient | 7 | Edith Nourse Rogers Memorial Veterans' Hospital | 10 |
| Westminster, CO | York Street VA Clinic | outpatient | 9 | Rocky Mountain Regional VA Medical Center | 15 |
| White Sands, NM | Las Cruces VA Clinic | outpatient | 17 | Raymond G. Murphy Department of Veterans Affairs Medical Center | 185 |
| Whitehall, OH | Chalmers P. Wylie Veterans Outpatient Clinic | outpatient | 2 | Chillicothe VA Medical Center | 41 |
| Whiteman AFB, MO | Warrensburg VA Clinic | outpatient | 9 | Kansas City VA Medical Center | 57 |
| Wichita, KS | Sedgwick County VA Clinic | outpatient | 4 | Oklahoma City VA Medical Center | 153 |
| Wichita Falls, TX | Wichita Falls VA Clinic | outpatient | 3 | Oklahoma City VA Medical Center | 124 |
| Williamsport, PA | Williamsport VA Clinic | outpatient | 3 | Wilkes-Barre VA Medical Center | 62 |
| Wilmington, DE | Wilmington VA Medical Center | hospital | 4 | Wilmington VA Medical Center | 4 |
| Wilmington, MA | Edith Nourse Rogers Memorial Veterans' Hospital | hospital | 7 | Edith Nourse Rogers Memorial Veterans' Hospital | 7 |
| Wilson, NC | Goldsboro VA Clinic | outpatient | 23 | Durham VA Medical Center | 60 |
| Wilsonville, OR | West Linn VA Clinic | outpatient | 6 | Portland VA Medical Center | 14 |
| Windsor Locks, CT | Springfield VA Clinic | outpatient | 13 | Edward P. Boland Department of Veterans Affairs Medical Center | 29 |
| Winston-Salem, NC | Kernersville VA Clinic | outpatient | 12 | W.G. (Bill) Hefner Salisbury Department of Veterans Affairs Medical Center | 32 |
| Woburn, MA | Edith Nourse Rogers Memorial Veterans' Hospital | hospital | 6 | Edith Nourse Rogers Memorial Veterans' Hospital | 6 |
| Worcester, MA | Plantation Street VA Clinic | outpatient | 2 | Edith Nourse Rogers Memorial Veterans' Hospital | 32 |
| Wright-Patterson Afb, OH | Wright-Patterson VA Clinic | outpatient | 1 | Dayton VA Medical Center | 12 |
| Wrightstown, NJ | Hamilton VA Clinic | outpatient | 16 | Corporal Michael J. Crescenz Department of Veterans Affairs Medical Center | 31 |
| Yakima, WA | Yakima Valley VA Clinic | outpatient | 4 | Seattle VA Medical Center | 107 |
| Yigo, GU | Guam VA Clinic | outpatient | 11 | Spark M. Matsunaga Department of Veterans Affairs Medical Center | 3791 |
| Yorba Linda, CA | Placentia VA Clinic | outpatient | 7 | Tibor Rubin VA Medical Center | 21 |
| York, NE | Grand Island VA Medical Center | outpatient | 40 | Omaha VA Medical Center | 88 |
| York, PA | York VA Clinic | outpatient | 3 | Lebanon VA Medical Center | 30 |
| Yorktown, VA | Langley VA Clinic | outpatient | 14 | Hampton VA Medical Center | 18 |
| Youngstown, OH | Carl Nunziato VA Clinic | outpatient | 2 | Pittsburgh VA Medical Center-University Drive | 58 |
| Yuba City, CA | Yuba City VA Clinic | outpatient | 1 | Ioannis A. Lougaris Veterans' Administration Medical Center | 102 |
| Yuma, AZ | Yuma VA Clinic | outpatient | 12 | Carl T. Hayden Veterans' Administration Medical Center | 158 |
