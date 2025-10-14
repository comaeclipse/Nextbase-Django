from django.shortcuts import render
from django.db.models import Q, Case, When, IntegerField
from .models import Location, StateInfo

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
    gun_laws_filter = request.GET.get('gun_laws', None)
    sort = request.GET.get('sort', 'best')

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

    # Apply gun laws filter if present
    if gun_laws_filter:
        # Get all state info with gifford scores
        state_info_dict = {si.state: si.gifford_score for si in StateInfo.objects.all() if si.gifford_score}

        # Categorize states based on Giffords score
        relaxed_states = []
        some_states = []
        strict_states = []

        for state_abbr, score in state_info_dict.items():
            score_upper = score.upper().strip()
            # Extract letter grade (ignore +/-)
            if score_upper.startswith('A') or score_upper.startswith('B'):
                strict_states.append(state_abbr)
            elif score_upper.startswith('C'):
                some_states.append(state_abbr)
            elif score_upper.startswith('D') or score_upper.startswith('F'):
                relaxed_states.append(state_abbr)

        # Filter based on selected category
        if gun_laws_filter == 'relaxed':
            locations = locations.filter(state__in=relaxed_states)
        elif gun_laws_filter == 'some':
            locations = locations.filter(state__in=some_states)
        elif gun_laws_filter == 'strict':
            locations = locations.filter(state__in=strict_states)
    
    # Sorting
    if sort == 'best':
        locations = locations.order_by('-match_score', 'name')
    elif sort in ('cost_asc', 'cost_desc'):
        cost_rank = Case(
            When(cost_of_living='Low', then=0),
            When(cost_of_living='Moderate', then=1),
            When(cost_of_living='High', then=2),
            default=1,
            output_field=IntegerField(),
        )
        locations = locations.annotate(cost_rank=cost_rank)
        locations = locations.order_by(('cost_rank' if sort == 'cost_asc' else '-cost_rank'), 'name')
    elif sort == 'climate':
        locations = locations.order_by('climate', 'name')
    elif sort == 'va':
        # Primary: has VA first; we'll refine by distance in Python
        locations = locations.order_by('-has_va', 'name')
        # Python-side stable sort by parsed distance (smaller first)
        def parse_distance(value: str) -> float:
            if not value:
                return float('inf')
            # Try distance_to_va first (may be like '3 miles'), else va_distance
            text = value
            try:
                # Extract first number (int/float)
                import re
                m = re.search(r"\d+(?:\.\d+)?", str(text))
                return float(m.group(0)) if m else float('inf')
            except Exception:
                return float('inf')
        locations = sorted(list(locations), key=lambda loc: (0 if (loc.has_va and str(loc.has_va).lower().startswith('y')) else 1, parse_distance(loc.distance_to_va or loc.va_distance)))
    elif sort in ('gas_asc', 'gas_desc'):
        # Parse gas price like '$3.89' -> 3.89
        def parse_gas_price(value: str) -> float:
            if not value:
                return float('inf')
            try:
                import re
                m = re.search(r"\d+(?:\.\d+)?", str(value))
                return float(m.group(0)) if m else float('inf')
            except Exception:
                return float('inf')
        reverse = (sort == 'gas_desc')
        locations = sorted(list(locations), key=lambda loc: parse_gas_price(loc.gas_price), reverse=reverse)

    context = {
        'locations': locations,
    }
    return render(request, 'locations/partials/location_cards.html', context)
