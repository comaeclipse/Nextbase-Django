from django.shortcuts import render
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
