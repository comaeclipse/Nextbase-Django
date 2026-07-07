"""Update normalized state-level gun law data."""
from django.core.management.base import BaseCommand

from locations.models import StateInfo


STATE_LAW_DATA = {
    "AK": ("No statewide magazine capacity limit", "N", False),
    "AL": ("No statewide magazine capacity limit", "N", False),
    "AR": ("No statewide magazine capacity limit", "N", False),
    "AZ": ("No statewide magazine capacity limit", "N", False),
    "CA": ("10 rounds", "Y", True),
    "CO": ("15 rounds", "Y", True),
    "CT": ("10 rounds", "Y", True),
    "DE": ("17 rounds", "Y", True),
    "FL": ("No statewide magazine capacity limit", "N", False),
    "GA": ("No statewide magazine capacity limit", "N", False),
    "HI": ("10 rounds for handguns", "Y", True),
    "IA": ("No statewide magazine capacity limit", "N", False),
    "ID": ("No statewide magazine capacity limit", "N", False),
    "IL": ("10 rounds for long guns; 15 rounds for handguns", "Y", True),
    "IN": ("No statewide magazine capacity limit", "N", False),
    "KS": ("No statewide magazine capacity limit", "N", False),
    "KY": ("No statewide magazine capacity limit", "N", False),
    "LA": ("No statewide magazine capacity limit", "N", False),
    "MA": ("10 rounds", "Y", True),
    "MD": ("10 rounds; no possession ban", "Y", True),
    "ME": ("No statewide magazine capacity limit", "Y", False),
    "MI": ("No statewide magazine capacity limit", "N", False),
    "MN": ("No statewide magazine capacity limit", "N", False),
    "MO": ("No statewide magazine capacity limit", "N", False),
    "MS": ("No statewide magazine capacity limit", "N", False),
    "MT": ("No statewide magazine capacity limit", "N", False),
    "NC": ("No statewide magazine capacity limit", "N", False),
    "ND": ("No statewide magazine capacity limit", "N", False),
    "NE": ("No statewide magazine capacity limit", "N", False),
    "NH": ("No statewide magazine capacity limit", "N", False),
    "NJ": ("10 rounds", "Y", True),
    "NM": ("No statewide magazine capacity limit", "N", False),
    "NV": ("No statewide magazine capacity limit", "Y", False),
    "NY": ("10 rounds", "Y", True),
    "OH": ("No statewide magazine capacity limit", "N", False),
    "OK": ("No statewide magazine capacity limit", "N", False),
    "OR": ("10 rounds", "Y", True),
    "PA": ("No statewide magazine capacity limit", "N", False),
    "RI": ("10 rounds", "Y", True),
    "SC": ("No statewide magazine capacity limit", "N", False),
    "SD": ("No statewide magazine capacity limit", "N", False),
    "TN": ("No statewide magazine capacity limit", "N", False),
    "TX": ("No statewide magazine capacity limit", "N", False),
    "UT": ("No statewide magazine capacity limit", "N", False),
    "VA": ("15 rounds; 2026 law under injunction", "Y", True),
    "VT": ("10 rounds for long guns; 15 rounds for handguns", "Y", True),
    "WA": ("10 rounds; no possession ban", "Y", True),
    "WI": ("No statewide magazine capacity limit", "N", False),
    "WV": ("No statewide magazine capacity limit", "N", False),
    "WY": ("No statewide magazine capacity limit", "N", False),
}


class Command(BaseCommand):
    help = "Update magazine limit, ghost gun ban, and high-cap magazine fields."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show rows that would change without writing to the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        updated = 0
        created = 0

        for state, (magazine_limit, ghost_gun_ban, high_cap_mag_ban) in sorted(STATE_LAW_DATA.items()):
            state_info, was_created = StateInfo.objects.get_or_create(state=state)
            changes = {}

            if state_info.magazine_limit != magazine_limit:
                changes["magazine_limit"] = magazine_limit
            if state_info.ghost_gun_ban != ghost_gun_ban:
                changes["ghost_gun_ban"] = ghost_gun_ban
            if state_info.high_cap_mag_ban != high_cap_mag_ban:
                changes["high_cap_mag_ban"] = high_cap_mag_ban

            if was_created:
                created += 1

            if not changes:
                continue

            for field, value in changes.items():
                setattr(state_info, field, value)

            updated += 1
            self.stdout.write(
                f"{state}: "
                + ", ".join(f"{field}={value}" for field, value in changes.items())
            )

            if not dry_run:
                state_info.save(update_fields=[*changes.keys(), "updated_at"])

        if dry_run:
            self.stdout.write(self.style.WARNING(f"Dry run: {updated} row(s) would change."))
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"State law data updated. Rows changed: {updated}. Rows created: {created}."
            )
        )
