from django.shortcuts import render
from django.db.models import Q
from .models import Location

def home(request):
    """Render the homepage"""
    return render(request, 'locations/home.html')

def explore(request):
    """Render the explore/search page with locations from database"""
    # Query all locations from database (ordered by match_score descending)
    locations = Location.objects.all()

    context = {
        'total_results': locations.count(),
        'locations': locations,
    }
    return render(request, 'locations/explore.html', context)

def filter_locations(request):
    """Filter locations based on criteria and return partial HTML"""
    snow_filter = request.GET.get('snow', None)
    
    # Start with all locations
    locations = Location.objects.all()
    
    # Apply snow filter if present
    if snow_filter == 'zero':
        # Zero snow: 0 inches or null
        locations = locations.filter(Q(snow_annual=0) | Q(snow_annual__isnull=True))
    elif snow_filter == 'some':
        # Some snow: 1-20 inches
        locations = locations.filter(snow_annual__gt=0, snow_annual__lte=20)
    elif snow_filter == 'lots':
        # Lots of snow: >20 inches
        locations = locations.filter(snow_annual__gt=20)
    
    context = {
        'locations': locations,
    }
    return render(request, 'locations/partials/location_cards.html', context)
