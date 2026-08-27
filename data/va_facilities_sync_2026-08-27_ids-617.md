# VA facilities sync — 2026-08-27

Source: [VHA Medical Facilities (VAST / ArcGIS)](https://vha.maps.arcgis.com/home/item.html?id=c6821e66523a46f5b32893641b9bd0dd)
Distance method: great-circle miles from city centroid to facility LAT/LON.
Outpatient = nearest clinic/CBOC or medical center (Vet Centers excluded).
`has_va` = nearest outpatient-capable site within 25 miles (crow-fly).
Hospital = nearest parent facility (3-character STA_NO / VA medical center).
`nearest_va_kind` is the kind of that nearest outpatient-capable site.

| City | Outpatient | kind | mi | Hospital | mi |
| --- | --- | --- | ---: | --- | ---: |
| Midland, GA | Robert S. Poydasheff VA Clinic | outpatient | 10 | Central Alabama VA Medical Center-Montgomery | 84 |
