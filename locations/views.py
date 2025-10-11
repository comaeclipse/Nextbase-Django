from django.shortcuts import render

def home(request):
    """Render the homepage"""
    return render(request, 'locations/home.html')

def explore(request):
    """Render the explore/search page"""
    context = {
        'total_results': 47,
        'locations': [
            {
                'name': 'Sarasota',
                'state': 'Florida',
                'match_score': 94,
                'avg_price': '$385k',
                'climate': 'Warm',
                'cost_of_living': 'Moderate',
                'population': '58k',
                'tags': ['Beaches', 'Golf', 'Fishing', 'Low Taxes'],
                'va_distance': '3 miles',
                'emoji': '🏖️',
                'gradient': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'featured': True,
            },
            {
                'name': 'Asheville',
                'state': 'North Carolina',
                'match_score': 91,
                'avg_price': '$425k',
                'climate': '4 Seasons',
                'cost_of_living': 'Moderate',
                'population': '94k',
                'tags': ['Mountains', 'Hiking', 'Arts', 'Breweries'],
                'va_distance': '5 miles',
                'emoji': '🏔️',
                'gradient': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'featured': False,
            },
            {
                'name': 'Tucson',
                'state': 'Arizona',
                'match_score': 89,
                'avg_price': '$295k',
                'climate': 'Hot & Dry',
                'cost_of_living': 'Low',
                'population': '545k',
                'tags': ['Desert', 'Golf', 'Affordable', 'Outdoor'],
                'va_distance': '2 miles',
                'emoji': '🌵',
                'gradient': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                'featured': False,
            },
            {
                'name': 'Portland',
                'state': 'Maine',
                'match_score': 87,
                'avg_price': '$465k',
                'climate': 'Cool',
                'cost_of_living': 'Moderate',
                'population': '67k',
                'tags': ['Coastal', 'Historic', 'Fishing', 'Seafood'],
                'va_distance': '4 miles',
                'emoji': '🌲',
                'gradient': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                'featured': False,
            },
            {
                'name': 'Charleston',
                'state': 'South Carolina',
                'match_score': 92,
                'avg_price': '$415k',
                'climate': 'Warm',
                'cost_of_living': 'Moderate',
                'population': '151k',
                'tags': ['Historic', 'Beaches', 'Culture', 'Food'],
                'va_distance': '6 miles',
                'emoji': '🏛️',
                'gradient': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                'featured': False,
            },
            {
                'name': 'Nashville',
                'state': 'Tennessee',
                'match_score': 88,
                'avg_price': '$375k',
                'climate': 'Mild',
                'cost_of_living': 'Moderate',
                'population': '694k',
                'tags': ['Music', 'No State Tax', 'Urban', 'Culture'],
                'va_distance': '4 miles',
                'emoji': '🎸',
                'gradient': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                'featured': False,
            },
        ]
    }
    return render(request, 'locations/explore.html', context)
