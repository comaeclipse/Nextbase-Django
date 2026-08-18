# Median rent match report

- Generated: 2026-08-18
- Source: US Census ACS 2024 5-year estimates, table B25064_001E (median gross rent)
- API: https://api.census.gov/data/2024/acs/acs5
- Gross rent includes utilities, which is what the cost model expects.

Place-level 134, county fallback 4, unmatched 0.

## Place-level matches

| City | Median gross rent |
| --- | --- |
| Akron, OH | $955 |
| Albany, NY | $1216 |
| Albuquerque, NM | $1145 |
| Amarillo, TX | $1092 |
| Anchorage, AK | $1489 |
| Asheville, NC | $1402 |
| Ashville, OH | $999 |
| Atlanta, GA | $1711 |
| Baltimore, MD | $1331 |
| Bangor, ME | $1055 |
| Bath, ME | $1044 |
| Bellevue, WA | $2572 |
| Bend, OR | $1883 |
| Billings, MT | $1138 |
| Binghamton, NY | $870 |
| Boise, ID | $1446 |
| Boston, MA | $2147 |
| Boulder, CO | $2018 |
| Bowling Green, KY | $998 |
| Bremerton, WA | $1641 |
| Bridgeport, CT | $1450 |
| Broomfield, CO | $2126 |
| Burlington, VT | $1649 |
| Burnsville, MN | $1513 |
| Camden, AR | $768 |
| Carroll, IA | $722 |
| Casper, WY | $1009 |
| Chantilly, VA | $2312 |
| Charleston, WV | $908 |
| Cheyenne, WY | $1118 |
| Chicago, IL | $1440 |
| Cincinnati, OH | $1001 |
| Cody, WY | $1051 |
| Colorado Springs, CO | $1648 |
| Columbus, OH | $1295 |
| Columbus, GA | $1106 |
| Costa Mesa, CA | $2446 |
| Crestview, FL | $1366 |
| Dallas, TX | $1472 |
| Danville, IL | $846 |
| Decorah, IA | $853 |
| Des Moines, IA | $1090 |
| El Paso, TX | $1073 |
| Elko, NV | $1267 |
| Eureka, CA | $1195 |
| Fargo, ND | $946 |
| Fayetteville, NC | $1250 |
| Florence, AL | $820 |
| Forest, MS | $900 |
| Fort Collins, CO | $1690 |
| Fort Stockton, TX | $974 |
| Fort Wayne, IN | $999 |
| Fresno, CA | $1421 |
| Gilbert, AZ | $2110 |
| Goleta, CA | $2437 |
| Grand Forks, ND | $980 |
| Grand Junction, CO | $1142 |
| Great Falls, MT | $900 |
| Greenville, SC | $1312 |
| Honolulu, HI | $1823 |
| Houston, TX | $1361 |
| Hudson, NH | $1722 |
| Huntsville, AL | $1171 |
| Indian Trail, NC | $2077 |
| Indianopolis, IN | $1156 |
| Irmo, SC | $1477 |
| Irvine, CA | $2997 |
| Ithaca, NY | $1447 |
| Jackson, MS | $1055 |
| Jamestown, ND | $773 |
| King of Prussia, PA | $2077 |
| Kuna, ID | $1774 |
| Lake Forest, CA | $2672 |
| Las Vegas, NV | $1563 |
| Lexington, MA | $2891 |
| Little Rock, AR | $1106 |
| Louisville, KY | $1120 |
| Manchester, NH | $1564 |
| Marietta, GA | $1586 |
| Memphis, TN | $1181 |
| Milwaukee, WI | $1059 |
| Minneapolis, MN | $1371 |
| Missoula, MT | $1189 |
| Mobile, AL | $1068 |
| Morrisville, NC | $1858 |
| Nashville, TN | $1586 |
| New Orleans, LA | $1251 |
| Norfolk, VA | $1321 |
| North Platte, NE | $921 |
| Odessa, TX | $1315 |
| Oklahoma City, OK | $1130 |
| Omaha, NE | $1187 |
| Orlando, FL | $1747 |
| Overland Park, KS | $1515 |
| Pace, FL | $1282 |
| Paterson, NJ | $1548 |
| Pensacola, FL | $1322 |
| Philadelphia, PA | $1397 |
| Phoenix, AZ | $1582 |
| Pierre, SD | $983 |
| Pittsburgh, PA | $1261 |
| Portland, ME | $1577 |
| Portland, OR | $1655 |
| Providence, RI | $1408 |
| Pueblo, CO | $1082 |
| Quincy, MA | $2118 |
| Raleigh, NC | $1572 |
| Rapid City, SD | $1109 |
| Reno, NV | $1556 |
| Rome, NY | $909 |
| Salt Lake City, UT | $1414 |
| San Antonio, TX | $1324 |
| San Diego, CA | $2313 |
| Savannah, GA | $1382 |
| Scranton, PA | $1048 |
| Shreveport, LA | $987 |
| Sierra Vista, AZ | $1150 |
| Sioux Falls, SD | $1035 |
| Spokane, WA | $1215 |
| St. Charles, MO | $1251 |
| St. George, UT | $1545 |
| Syracuse, NY | $1039 |
| Tucson, AZ | $1145 |
| Tullahoma, TN | $886 |
| Tulsa, OK | $1052 |
| Victorville, CA | $1618 |
| Virginia Beach, VA | $1714 |
| Waltham, MA | $2268 |
| Warren, MI | $1225 |
| Warren, PA | $771 |
| Watertown, NY | $967 |
| Wichita, KS | $975 |
| Wilmington, DE | $1224 |
| Yuba City, CA | $1454 |

## County fallback (approximate)

These cities have no usable ACS place-level B25064 value. County median
gross rent is used instead; that is coarser and typically pulled by the
rest of the county. Each fallback was reviewed against the ACS place file.

| City | County used | Median gross rent | Why place-level was unavailable |
| --- | --- | --- | --- |
| Hamilton, WA | Skagit | $1536 | ACS place row exists (Hamilton town) but B25064 is suppressed; population 297 is below the ACS disclosure threshold. |
| Malabar, FL | Brevard | $1556 | ACS place row exists (Malabar town) but B25064 is suppressed for this small Brevard County town. |
| McHenry, MS | Stone | $936 | Unincorporated community with no Census place geography in the ACS place file. |
| North Kingstown, RI | Washington | $1327 | New England town published as a county subdivision, not a Census place. The RI ACS place file has 36 CDPs/cities; Kingston CDP is a different place in South Kingstown and must not be substituted. |

## Unmatched

None.
