"""
Management command to import state information from CSV file.
Usage: python manage.py import_state_info <path_to_csv>
"""
import csv
from django.core.management.base import BaseCommand
from locations.models import StateInfo


class Command(BaseCommand):
    help = 'Import state information data from CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_path',
            type=str,
            help='Path to the CSV file to import'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing state info before import'
        )

    def handle(self, *args, **options):
        csv_path = options['csv_path']

        if options['clear']:
            self.stdout.write('Clearing existing state info...')
            StateInfo.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared!'))

        self.stdout.write(f'Importing state info from: {csv_path}')

        try:
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)

                created_count = 0
                updated_count = 0
                error_count = 0

                for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                    try:
                        state_data = self.parse_row(row)

                        if not state_data['state']:
                            # Skip rows without a state
                            continue

                        # Update or create state info
                        state_info, created = StateInfo.objects.update_or_create(
                            state=state_data['state'],
                            defaults=state_data
                        )

                        if created:
                            created_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"  + Created: {state_info.state}"
                                )
                            )
                        else:
                            updated_count += 1
                            self.stdout.write(
                                f"  ~ Updated: {state_info.state}"
                            )

                    except Exception as e:
                        error_count += 1
                        self.stdout.write(
                            self.style.ERROR(
                                f"  X Error on row {row_num}: {str(e)}"
                            )
                        )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'\nImport complete! Created: {created_count}, '
                        f'Updated: {updated_count}, Errors: {error_count}'
                    )
                )

        except FileNotFoundError:
            self.stdout.write(
                self.style.ERROR(f'File not found: {csv_path}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Import failed: {str(e)}')
            )

    def parse_row(self, row):
        """Parse a CSV row into StateInfo model fields"""

        def clean_empty(value):
            """Convert empty strings to None"""
            if not value or value.strip() in ['', '?', 'NA']:
                return None
            return value.strip()

        # Build state info data dictionary
        data = {
            'state': clean_empty(row.get('State', '')),
            'magazine_limit': clean_empty(row.get('MagazineLimit')),
            'gifford_score': clean_empty(row.get('GiffordScore')),
            'ghost_gun_ban': clean_empty(row.get('GhostGunBan')),
            'assault_weapon_ban': clean_empty(row.get('AssaultWeaponBan')),
        }

        return data
