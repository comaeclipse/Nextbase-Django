import re
import json
from collections import Counter
from django.shortcuts import render
from django.db.models import Q, Case, When, IntegerField
from .models import Location, StateInfo


def home(request):
    """Render the homepage"""
    return render(request, 'locations/home.html')


def explore(request):
    """Render the explore/search page with locations from database"""
    locations = list(Location.objects.all())
    for loc in locations:
        loc.calculated_match_score = calculate_baseline_score(loc)
    locations.sort(key=lambda x: (-x.calculated_match_score, x.name))

    state_counts = dict(Counter(loc.state for loc in locations))

    context = {
        'total_results': len(locations),
        'locations': locations,
        'state_counts_json': json.dumps(state_counts),
    }
    return render(request, 'locations/explore.html', context)


# ============== Filter Helper Functions ==============

def parse_number(value):
    """Extract numeric value from string like '$385k', '3 miles', '$3.89'"""
    if not value:
        return None
    try:
        m = re.search(r"\d+(?:\.\d+)?", str(value))
        return float(m.group(0)) if m else None
    except Exception:
        return None


def clamp_score(value):
    """Clamp a numeric score to the 0-100 range."""
    return max(0, min(100, int(round(value))))


def parse_lgbtq_score(value):
    """Parse the stored 0-100 LGBTQ friendliness score."""
    score = parse_number(value)
    if score is None:
        return None
    return clamp_score(score)


def score_va_access(loc):
    """Score access to VA care based on local facility and distance."""
    if loc.has_va:
        return 100

    distance = parse_number(loc.distance_to_va)
    if distance is None:
        return 50
    if distance <= 5:
        return 95
    if distance <= 15:
        return 80
    if distance <= 30:
        return 65
    if distance <= 60:
        return 45
    return 25


def score_cost_of_living(loc):
    """Score affordability from COL index, falling back to the app category."""
    if loc.col_index is not None:
        if loc.col_index <= 90:
            return 100
        if loc.col_index <= 100:
            return 85
        if loc.col_index <= 110:
            return 70
        if loc.col_index <= 125:
            return 50
        return 30

    return {
        'low': 90,
        'moderate': 65,
        'high': 35,
    }.get((loc.cost_of_living or '').lower(), 60)


def score_home_value(loc):
    """Score home affordability using numeric or display home values."""
    price = location_home_value(loc)
    if price is None:
        return 60
    if price <= 250000:
        return 100
    if price <= 350000:
        return 85
    if price <= 450000:
        return 70
    if price <= 600000:
        return 50
    return 30


def score_crime_grade(loc):
    """Map the letter crime grade (A+..F) to a 0-100 safety score.

    The dataset stores a letter grade in ``crime``; ``tci`` is unpopulated.
    Returns None when no usable grade is present so callers can fall back.
    """
    if not loc.crime:
        return None

    grade = loc.crime.strip().upper()
    grade_scores = {
        'A+': 100, 'A': 96, 'A-': 92,
        'B+': 88, 'B': 82, 'B-': 76,
        'C+': 70, 'C': 62, 'C-': 54,
        'D+': 48, 'D': 42, 'D-': 36,
        'F': 20,
    }
    if grade in grade_scores:
        return grade_scores[grade]

    # Legacy free-text values (e.g. "Low") used before letter grades.
    return {'low': 90, 'moderate': 60, 'high': 30}.get(grade.lower())


def score_safety(loc):
    """Score safety from the crime grade, falling back to neutral when absent."""
    grade_score = score_crime_grade(loc)
    if grade_score is not None:
        return grade_score
    return 60


def calculate_baseline_score(loc):
    """
    Rank retirement fit using the explore-page factors.

    This is a fixed editorial "Fit" score, identical for every visitor (there is
    no per-user preference input). Weights, each 20%:
    LGBTQ friendliness, VA access, cost of living, home affordability, safety.
    """
    lgbtq_score = parse_lgbtq_score(loc.lgbtq_rating)
    if lgbtq_score is None:
        lgbtq_score = 50

    weighted = (
        lgbtq_score * 0.20
        + score_va_access(loc) * 0.20
        + score_cost_of_living(loc) * 0.20
        + score_home_value(loc) * 0.20
        + score_safety(loc) * 0.20
    )
    return clamp_score(weighted)


def location_matches_climate(loc, climate_types):
    """Check if location matches any of the selected climate categories (OR logic)"""
    types = [t.strip() for t in climate_types.split(',') if t.strip()]
    if not types:
        return True

    # Check if location's category matches any selected filter
    return loc.climate_category in types


def location_matches_lifestyle(loc, lifestyle_types):
    """Check if location matches any of the selected lifestyle types"""
    types = [t.strip() for t in lifestyle_types.split(',') if t.strip()]
    if not types:
        return True

    density = loc.density
    if density is None:
        return False

    for lifestyle in types:
        if lifestyle == 'urban' and density > 3000:
            return True
        elif lifestyle == 'suburban' and 1000 <= density <= 3000:
            return True
        elif lifestyle == 'rural' and density < 1000:
            return True
    return False


def location_matches_healthcare(loc, healthcare_types):
    """Check if location matches any of the selected healthcare criteria"""
    types = [t.strip() for t in healthcare_types.split(',') if t.strip()]
    if not types:
        return True

    for hc_type in types:
        # We only track whether a location has a local VA facility, so both the
        # hospital and clinic options resolve to that single signal.
        if hc_type in ('va_hospital', 'va_clinic'):
            if loc.has_va:
                return True
    return False


def location_matches_activities(loc, activity_types):
    """Check if location has any of the selected activity tags"""
    types = [t.strip().lower() for t in activity_types.split(',') if t.strip()]
    if not types:
        return True

    # Get tags from location (JSONField stores as list)
    tags = loc.tags or []
    if isinstance(tags, str):
        tags = [tags]
    tags_lower = [str(t).lower() for t in tags]

    # Map filter IDs to potential tag values
    activity_mappings = {
        'golf': ['golf', 'golfing'],
        'fishing': ['fishing', 'fish'],
        'hiking': ['hiking', 'hike', 'trails'],
        'culture': ['arts', 'culture', 'arts & culture', 'museums', 'theater'],
    }

    for activity in types:
        search_terms = activity_mappings.get(activity, [activity])
        for term in search_terms:
            if any(term in tag for tag in tags_lower):
                return True
    return False


def location_home_value(loc):
    """Return the location's home value in dollars, or None if unavailable."""
    if loc.avg_home_value is not None:
        return float(loc.avg_home_value)
    parsed = parse_number(loc.avg_home_value_display)
    if parsed is None:
        return None
    # Display values under 10k are shorthand thousands (e.g. "385" == $385k).
    return parsed * 1000 if parsed < 10000 else parsed


def location_in_price_range(loc, price_min, price_max):
    """Check if the location's home value is within the range (input in $k)."""
    price = location_home_value(loc)
    if price is None:
        return True  # Include locations without price data

    # Range inputs are in thousands (e.g. 50 = $50k).
    if price_min and price < price_min * 1000:
        return False
    if price_max and price > price_max * 1000:
        return False
    return True


def filter_locations(request):
    """Filter locations based on criteria and return partial HTML"""
    # Get all filter parameters
    snow_filter = request.GET.get('snow', None)
    no_awb = request.GET.get('no_awb', None)
    no_hcm = request.GET.get('no_hcm', None)
    state_filter = request.GET.get('state_filter', None)
    lgbtq_friendly = request.GET.get('lgbtq_friendly', None)
    climate_filter = request.GET.get('climate', None)
    cost_of_living_filter = request.GET.get('cost_of_living', None)
    price_min = request.GET.get('price_min', None)
    price_max = request.GET.get('price_max', None)
    lifestyle_filter = request.GET.get('lifestyle', None)
    healthcare_filter = request.GET.get('healthcare', None)
    activities_filter = request.GET.get('activities', None)
    sort = request.GET.get('sort', 'best')

    # Parse price range values
    price_min_val = int(price_min) if price_min and price_min.isdigit() else None
    price_max_val = int(price_max) if price_max and price_max.isdigit() else None

    # Start with all locations
    locations = Location.objects.all()

    # Build gun law state sets for the AWB / high-cap-mag exclusions
    awb_states = set(si.state for si in StateInfo.objects.filter(assault_weapons_ban=True))
    hcm_states = set(si.state for si in StateInfo.objects.filter(high_cap_mag_ban=True))

    # ============== Apply Filters ==============

    # Snow filter
    if snow_filter == 'zero':
        locations = locations.filter(Q(snow_annual=0) | Q(snow_annual__isnull=True))
    elif snow_filter == 'some':
        locations = locations.filter(snow_annual__gt=0, snow_annual__lte=20)
    elif snow_filter == 'lots':
        locations = locations.filter(snow_annual__gt=20)

    # AWB / High-Cap Mag filters
    if no_awb == 'true':
        locations = locations.exclude(state__in=awb_states)
    if no_hcm == 'true':
        locations = locations.exclude(state__in=hcm_states)

    # Map state filter
    if state_filter:
        locations = locations.filter(state=state_filter)

    # Cost of Living filter
    if cost_of_living_filter:
        col_map = {'low': 'Low', 'moderate': 'Moderate', 'high': 'High'}
        if cost_of_living_filter in col_map:
            locations = locations.filter(cost_of_living=col_map[cost_of_living_filter])

    # Convert to list for Python-side filtering
    locations_list = list(locations)

    # Climate filter (Python-side, OR logic)
    if climate_filter:
        locations_list = [loc for loc in locations_list if location_matches_climate(loc, climate_filter)]

    # Price range filter (Python-side)
    if price_min_val or price_max_val:
        locations_list = [loc for loc in locations_list if location_in_price_range(loc, price_min_val, price_max_val)]

    # Lifestyle filter (Python-side)
    if lifestyle_filter:
        locations_list = [loc for loc in locations_list if location_matches_lifestyle(loc, lifestyle_filter)]

    # Healthcare filter (Python-side)
    if healthcare_filter:
        locations_list = [loc for loc in locations_list if location_matches_healthcare(loc, healthcare_filter)]

    # Activities filter (Python-side)
    if activities_filter:
        locations_list = [loc for loc in locations_list if location_matches_activities(loc, activities_filter)]

    # LGBTQ friendly filter (Python-side)
    if lgbtq_friendly == 'true':
        filtered = []
        for loc in locations_list:
            lgbtq_score = parse_lgbtq_score(loc.lgbtq_rating)
            if lgbtq_score is not None and lgbtq_score >= 70:
                filtered.append(loc)
        locations_list = filtered

    # ============== Calculate Fit Scores ==============
    # Filters above already remove non-matches, so survivors are ranked by the
    # editorial baseline fit score rather than a redundant filter-satisfaction score.
    for loc in locations_list:
        loc.calculated_match_score = calculate_baseline_score(loc)

    # ============== Sorting ==============
    if sort == 'best':
        locations_list.sort(key=lambda x: (-x.calculated_match_score, x.name))
    elif sort in ('cost_asc', 'cost_desc'):
        cost_order = {'Low': 0, 'Moderate': 1, 'High': 2}
        reverse = (sort == 'cost_desc')
        locations_list.sort(key=lambda x: (cost_order.get(x.cost_of_living, 1), x.name), reverse=reverse)
    elif sort == 'climate':
        locations_list.sort(key=lambda x: (x.climate or '', x.name))
    elif sort == 'va':
        def va_sort_key(loc):
            has_va_nearby = bool(loc.has_va)
            distance = parse_number(loc.distance_to_va) or float('inf')
            return (0 if has_va_nearby else 1, distance, loc.name)
        locations_list.sort(key=va_sort_key)
    elif sort in ('gas_asc', 'gas_desc'):
        reverse = (sort == 'gas_desc')
        locations_list.sort(key=lambda x: (parse_number(x.gas_price) or float('inf'), x.name), reverse=reverse)

    context = {
        'locations': locations_list,
        'total_results': len(locations_list),
        'is_htmx': True,
    }
    return render(request, 'locations/partials/location_cards.html', context)

def sandbox(request):
    """Sandbox page for testing election trend visualizations"""
    # Get locations with election data
    locations = Location.objects.filter(
        election_change__isnull=False
    ).exclude(election_change='').order_by('name')

    context = {
        'locations': locations,
    }
    return render(request, 'locations/sandbox.html', context)
