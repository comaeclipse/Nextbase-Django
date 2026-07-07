from django.urls import path, include

# Admin panel removed 2026-07-07 (see locations/admin.py).
urlpatterns = [
    path('', include('locations.urls')),
]
