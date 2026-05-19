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
    locations = Location.objects.all()
    state_counts = dict(Counter(loc.state for loc in locations))

    context = {
        'total_results': locations.count(),
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

    density = parse_number(loc.density)
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
        if hc_type == 'va_hospital':
            # Has VA Hospital nearby
            if loc.has_va and str(loc.has_va).lower().startswith('y'):
                return True
        elif hc_type == 'va_clinic':
            # Any VA access
            if loc.has_va and loc.has_va.strip():
                return True
        elif hc_type == 'quality_care':
            # Low crime index as healthcare quality proxy
            if loc.tci and loc.tci < 200:
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


def location_in_price_range(loc, price_min, price_max):
    """Check if location's avg_price is within the specified range"""
    price = parse_number(loc.avg_price)
    if price is None:
        return True  # Include locations without price data

    # Prices in the input are in thousands (e.g., 50 = $50k)
    if price_min and price < price_min:
        return False
    if price_max and price > price_max:
        return False
    return True


def calculate_match_score(loc, filters, _state_info_dict=None):
    """Calculate how well a location matches the active filters (0-100)"""
    score = 0
    total = 0

    # Climate
    if filters.get('climate'):
        total += 1
        if location_matches_climate(loc, filters['climate']):
            score += 1

    # Cost of Living
    if filters.get('cost_of_living'):
        total += 1
        if loc.cost_of_living and loc.cost_of_living.lower() == filters['cost_of_living']:
            score += 1

    # Price Range
    if filters.get('price_min') or filters.get('price_max'):
        total += 1
        if location_in_price_range(loc, filters.get('price_min'), filters.get('price_max')):
            score += 1

    # Lifestyle
    if filters.get('lifestyle'):
        total += 1
        if location_matches_lifestyle(loc, filters['lifestyle']):
            score += 1

    # Healthcare
    if filters.get('healthcare'):
        total += 1
        if location_matches_healthcare(loc, filters['healthcare']):
            score += 1

    # Activities
    if filters.get('activities'):
        total += 1
        if location_matches_activities(loc, filters['activities']):
            score += 1

    # Snow
    if filters.get('snow'):
        total += 1
        snow = filters['snow']
        if snow == 'zero' and (loc.snow_annual is None or loc.snow_annual == 0):
            score += 1
        elif snow == 'some' and loc.snow_annual and 0 < loc.snow_annual <= 20:
            score += 1
        elif snow == 'lots' and loc.snow_annual and loc.snow_annual > 20:
            score += 1

    # No AWB
    if filters.get('no_awb'):
        total += 1
        awb_states = filters.get('awb_states', set())
        if loc.state not in awb_states:
            score += 1

    # No High-Cap Mag Ban
    if filters.get('no_hcm'):
        total += 1
        hcm_states = filters.get('hcm_states', set())
        if loc.state not in hcm_states:
            score += 1

    # LGBTQ Friendly
    if filters.get('lgbtq_friendly'):
        total += 1
        try:
            if loc.lgbtq_rating and float(loc.lgbtq_rating) < 50:
                score += 1
        except (ValueError, TypeError):
            pass

    return int((score / max(total, 1)) * 100)


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

    # Build active filters dict for match score calculation
    active_filters = {}
    if snow_filter:
        active_filters['snow'] = snow_filter
    if no_awb == 'true':
        active_filters['no_awb'] = True
    if no_hcm == 'true':
        active_filters['no_hcm'] = True
    if lgbtq_friendly == 'true':
        active_filters['lgbtq_friendly'] = True
    if climate_filter:
        active_filters['climate'] = climate_filter
    if cost_of_living_filter:
        active_filters['cost_of_living'] = cost_of_living_filter
    if price_min_val:
        active_filters['price_min'] = price_min_val
    if price_max_val:
        active_filters['price_max'] = price_max_val
    if lifestyle_filter:
        active_filters['lifestyle'] = lifestyle_filter
    if healthcare_filter:
        active_filters['healthcare'] = healthcare_filter
    if activities_filter:
        active_filters['activities'] = activities_filter

    # Start with all locations
    locations = Location.objects.all()

    # Build gun law state sets for filtering and match scoring
    awb_states = set(si.state for si in StateInfo.objects.filter(assault_weapons_ban=True))
    hcm_states = set(si.state for si in StateInfo.objects.filter(high_cap_mag_ban=True))
    if active_filters.get('no_awb'):
        active_filters['awb_states'] = awb_states
    if active_filters.get('no_hcm'):
        active_filters['hcm_states'] = hcm_states

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
            if loc.lgbtq_rating:
                try:
                    if float(loc.lgbtq_rating) < 50:
                        filtered.append(loc)
                except (ValueError, TypeError):
                    pass
        locations_list = filtered

    # ============== Calculate Match Scores ==============
    for loc in locations_list:
        loc.calculated_match_score = calculate_match_score(loc, active_filters, {})

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
            has_va_nearby = loc.has_va and str(loc.has_va).lower().startswith('y')
            distance = parse_number(loc.distance_to_va or loc.va_distance) or float('inf')
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
