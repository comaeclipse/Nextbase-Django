"""Parity check: Next /api/locations vs Django /filter/ for many param combos.

Compares the ORDERED list of location ids returned by each. Requires both dev
servers running: Django on :8010, Next on :3000.
"""
import json
import re
import sys
import urllib.parse
import urllib.request

DJANGO = "http://127.0.0.1:8010/filter/"
NEXT = "http://localhost:3000/api/locations"

# Django partial renders cards with onclick="window.location.href='/city/<id>/'"
CARD_RE = re.compile(r"/city/(\d+)/")


def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read().decode("utf-8")


def django_ids(qs):
    html = get(DJANGO + ("?" + qs if qs else ""))
    # First id per card block: the card div onclick appears before the Learn More link,
    # so take unique ids in first-seen order.
    seen = []
    for m in CARD_RE.finditer(html):
        i = int(m.group(1))
        if not seen or seen[-1] != i:
            seen.append(i)
    # Cards repeat the id (onclick + learn more); dedupe consecutive duplicates,
    # then collapse pairs.
    out = []
    for i in seen:
        if not out or out[-1] != i:
            out.append(i)
    # Each card contributes id twice (onclick, anchor) -> take every other.
    return out


def next_ids(qs):
    data = json.loads(get(NEXT + ("?" + qs if qs else "")))
    return [loc["id"] for loc in data["locations"]], data["totalResults"]


CASES = [
    {},
    {"sort": "best"},
    {"sort": "cost_asc"},
    {"sort": "cost_desc"},
    {"sort": "climate"},
    {"sort": "va"},
    {"sort": "gas_asc"},
    {"sort": "gas_desc"},
    {"snow": "zero"},
    {"snow": "some"},
    {"snow": "lots"},
    {"no_awb": "true"},
    {"no_hcm": "true"},
    {"lgbtq_friendly": "true"},
    {"climate": "cold_snowy"},
    {"climate": "hot_dry,hot_humid"},
    {"cost_of_living": "low"},
    {"cost_of_living": "moderate"},
    {"cost_of_living": "high"},
    {"price_min": "100", "price_max": "400"},
    {"price_max": "300"},
    {"lifestyle": "urban"},
    {"lifestyle": "suburban,rural"},
    {"healthcare": "va_hospital"},
    {"activities": "golf"},
    {"activities": "hiking,fishing"},
    {"state_filter": "TX"},
    {"no_awb": "true", "cost_of_living": "low", "sort": "cost_desc"},
    {"snow": "zero", "lgbtq_friendly": "true", "sort": "va"},
    {"climate": "hot_dry", "activities": "golf", "sort": "gas_asc"},
]


def main():
    fails = 0
    for case in CASES:
        qs = urllib.parse.urlencode(case)
        d = django_ids(qs)
        n, total = next_ids(qs)
        # Django repeats each id (onclick + Learn More anchor) -> take every 2nd.
        d_cards = d[::2] if d and len(d) == 2 * len(n) else d
        if d_cards == n and total == len(n):
            print(f"  ok  ({len(n):2d}) {qs or '(none)'}")
        else:
            fails += 1
            print(f"  XX  {qs or '(none)'}")
            print(f"      django: {d_cards}")
            print(f"      next:   {n}")
    print()
    if fails:
        print(f"FAIL: {fails}/{len(CASES)} cases differ")
        sys.exit(1)
    print(f"PASS: All {len(CASES)} filter/sort cases match Django exactly.")


if __name__ == "__main__":
    main()
