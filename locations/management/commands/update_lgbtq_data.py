"""Update LGBTQ friendliness scores for retirement locations."""
import io
import json
import re
from decimal import Decimal

import requests
from django.core.management.base import BaseCommand, CommandError

from locations.models import Location


MAP_EQUALITY_URL = "https://mapresearch.org/equality/"
HRC_SCORECARD_BASE = (
    "https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/"
    "MEI-Scorecard-Assets/MEI-25-Scorecards/MEI-2025-{city}-{state}.pdf"
)

STATE_NAMES = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New-Hampshire",
    "NJ": "New-Jersey",
    "NM": "New-Mexico",
    "NY": "New-York",
    "NC": "North-Carolina",
    "ND": "North-Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode-Island",
    "SC": "South-Carolina",
    "SD": "South-Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West-Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming",
}

CITY_ALIASES = {
    "Honolulu": ["Honolulu-County"],
    "Indianopolis": ["Indianapolis"],
    "St. Charles": ["St-Charles", "Saint-Charles"],
}

EXACT_HRC_URLS = {
    ("Salt Lake City", "UT"): (
        "https://hrc-prod-requests.s3-us-west-2.amazonaws.com/files/documents/"
        "MEI-Scorecard-Assets/MEI-25-Scorecards/Salt-Lake-City-UT.pdf"
    ),
}

POLITICAL_PROXY_SCORES = {
    "strong left": 88,
    "moderate left": 76,
    "center": 60,
    "moderate right": 45,
    "strong right": 35,
}


def slugify_city(value):
    return re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-")


def city_variants(city):
    values = [city, *CITY_ALIASES.get(city, [])]
    values.extend(
        [
            city.replace(".", ""),
            city.replace(".", "").replace("St ", "St-"),
            city.replace(".", "").replace("St ", "Saint-"),
        ]
    )

    seen = []
    for value in values:
        slug = slugify_city(value)
        if slug and slug not in seen:
            seen.append(slug)
    return seen


def clamp_score(value):
    return max(0, min(100, int(round(value))))


def normalize_map_policy_score(value):
    # MAP's 2026 overall policy score is out of 49 and may be negative.
    return max(0, min(100, ((float(value) + 15) / 64) * 100))


def city_proxy_score(location):
    politics = (location.city_politics or "").strip().lower()
    return POLITICAL_PROXY_SCORES.get(politics, 55)


def extract_hrc_final_score(pdf_content):
    try:
        from pdfminer.high_level import extract_text
    except ImportError as exc:
        raise CommandError("pdfminer.six is required to read HRC scorecard PDFs.") from exc

    text = extract_text(io.BytesIO(pdf_content))
    match = re.search(r"Final\s*Score\s*(\d{1,3})", text, re.IGNORECASE)
    if not match:
        return None
    return clamp_score(int(match.group(1)))


def fetch_map_state_scores(session):
    response = session.get(MAP_EQUALITY_URL, timeout=30)
    response.raise_for_status()

    match = re.search(r"var\s+dataForMapSVG\w+\s*=\s*(\{\"regions\":.*?\});", response.text)
    if not match:
        raise CommandError("Could not find MAP state score data on the equality page.")

    payload = json.loads(match.group(1))
    scores = {}
    for region in payload["regions"]:
        state_match = re.match(r"US-([A-Z]{2})$", region.get("id", ""))
        score_match = re.search(
            r"Overall Policy Score\s+(-?\d+(?:\.\d+)?)/49",
            region.get("description", ""),
        )
        if state_match and score_match:
            scores[state_match.group(1)] = Decimal(score_match.group(1))

    if len(scores) < 50:
        raise CommandError(f"Expected at least 50 MAP state scores, found {len(scores)}.")
    return scores


def fetch_hrc_score(session, location):
    exact_url = EXACT_HRC_URLS.get((location.name, location.state))
    candidate_urls = [exact_url] if exact_url else []

    state_name = STATE_NAMES.get(location.state)
    if state_name:
        candidate_urls.extend(
            HRC_SCORECARD_BASE.format(city=city, state=state_name)
            for city in city_variants(location.name)
        )

    for url in candidate_urls:
        if not url:
            continue
        response = session.get(url, timeout=30)
        if response.status_code != 200:
            continue
        content_type = response.headers.get("content-type", "").lower()
        if "pdf" not in content_type:
            continue
        score = extract_hrc_final_score(response.content)
        if score is not None:
            return score, url

    return None, None


def calculate_lgbtq_score(location, mei_score, state_policy_score):
    normalized_state_score = normalize_map_policy_score(state_policy_score)
    if mei_score is not None:
        return clamp_score((mei_score * 0.65) + (normalized_state_score * 0.35))
    return clamp_score((city_proxy_score(location) * 0.55) + (normalized_state_score * 0.45))


class Command(BaseCommand):
    help = "Research and update LGBTQ friendliness scores from HRC MEI and MAP Equality data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show updates without writing to the database.",
        )
        parser.add_argument(
            "--skip-hrc",
            action="store_true",
            help="Use only MAP state scores and local politics proxy values.",
        )

    def handle(self, *args, **options):
        session = requests.Session()
        state_scores = fetch_map_state_scores(session)

        changed = 0
        for location in Location.objects.order_by("state", "name"):
            state_policy_score = state_scores.get(location.state)
            if state_policy_score is None:
                self.stdout.write(self.style.WARNING(f"{location}: no MAP state score; skipped"))
                continue

            mei_score = None
            mei_url = None
            if not options["skip_hrc"]:
                mei_score, mei_url = fetch_hrc_score(session, location)

            final_score = calculate_lgbtq_score(location, mei_score, state_policy_score)
            source = (
                f"HRC MEI 2025 + MAP overall policy score; {mei_url}"
                if mei_score is not None
                else "MAP overall policy score + city politics proxy"
            )

            updates = {
                "lgbtq_rating": str(final_score),
                "lgbtq_mei_score": mei_score,
                "lgbtq_state_policy_score": state_policy_score,
                "lgbtq_score_source": source,
            }

            has_changes = any(getattr(location, field) != value for field, value in updates.items())
            if not has_changes:
                continue

            changed += 1
            self.stdout.write(
                f"{location.name}, {location.state}: score={final_score}, "
                f"mei={mei_score if mei_score is not None else 'proxy'}, "
                f"map={state_policy_score}/49"
            )

            if not options["dry_run"]:
                for field, value in updates.items():
                    setattr(location, field, value)
                location.save(update_fields=[*updates.keys(), "updated_at"])

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING(f"Dry run: {changed} location(s) would change."))
            return

        self.stdout.write(self.style.SUCCESS(f"LGBTQ data updated for {changed} location(s)."))
