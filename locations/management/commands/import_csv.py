"""
Management command to import location data from CSV file.
Usage: python manage.py import_csv <path_to_csv>
"""
import csv
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand
from locations.models import Location


class Command(BaseCommand):
    help = 'Import location data from CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            'csv_path',
            type=str,
            help='Path to the CSV file to import'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing locations before import'
        )

    def handle(self, *args, **options):
        csv_path = options['csv_path']

        if options['clear']:
            self.stdout.write('Clearing existing locations...')
            Location.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared!'))

        self.stdout.write(f'Importing locations from: {csv_path}')

        try:
            with open(csv_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)

                created_count = 0
                updated_count = 0
                error_count = 0

                for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                    try:
                        location_data = self.parse_row(row)

                        # Try to find existing location by city and state
                        location, created = Location.objects.update_or_create(
                            name=location_data['name'],
                            state=location_data['state'],
                            defaults=location_data
                        )

                        if created:
                            created_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f"  + Created: {location.name}, {location.state}"
                                )
                            )
                        else:
                            updated_count += 1
                            self.stdout.write(
                                f"  ~ Updated: {location.name}, {location.state}"
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
        """Parse a CSV row into Location model fields"""

        def clean_empty(value):
            """Convert empty, '?', 'NA' to None"""
            if not value or value.strip() in ['', '?', 'NA']:
                return None
            return value.strip()

        def parse_int(value):
            """Parse integer, handling commas and empty values"""
            value = clean_empty(value)
            if value is None:
                return None
            try:
                # Remove commas from numbers
                return int(value.replace(',', ''))
            except (ValueError, AttributeError):
                return None

        def parse_decimal(value):
            """Parse decimal value"""
            value = clean_empty(value)
            if value is None:
                return None
            try:
                return Decimal(value)
            except (InvalidOperation, ValueError):
                return None

        # Build location data dictionary
        data = {
            # Basic info
            'name': clean_empty(row.get('City', '')),
            'state': clean_empty(row.get('State', '')),
            'county': clean_empty(row.get('County')),

            # Keep old fields empty for now (user can calculate/set later)
            'match_score': 0,
            'avg_price': '',
            'climate': clean_empty(row.get('Climate', '')) or '',
            'cost_of_living': 'Moderate',  # Default
            'population': '',
            'va_distance': clean_empty(row.get('DistanceToVA', '')) or 'NA',

            # Political info
            'state_party': clean_empty(row.get('StateParty')),
            'governor': clean_empty(row.get('Governor')),
            'city_politics': clean_empty(row.get('CityPolitics')),
            'election_2016': clean_empty(row.get('2016Election')),
            'election_2016_percent': parse_int(row.get('2016PresidentPercent')),
            'election_2024': clean_empty(row.get('2024 Election')),
            'election_2024_percent': parse_int(row.get('2024PresidentPercent')),
            'election_change': clean_empty(row.get('ElectionChange')),

            # Demographics & Economics
            'population_raw': clean_empty(row.get('Population')),
            'density': clean_empty(row.get('Density')),
            'sales_tax': parse_decimal(row.get('Sales Tax')),
            'income_tax': parse_decimal(row.get('Income')),
            'col_index': parse_int(row.get('COL')),

            # Veterans Affairs
            'has_va': clean_empty(row.get('VA')),
            'nearest_va': clean_empty(row.get('NearestVA')),
            'distance_to_va': clean_empty(row.get('DistanceToVA')),
            'veterans_benefits': clean_empty(row.get('Veterans Benefits')),

            # Safety & Social
            'tci': parse_int(row.get('TCI')),
            'marijuana_status': clean_empty(row.get('Marijuana')),
            'lgbtq_rating': clean_empty(row.get('LGBTQ')),

            # Economic hubs
            'tech_hub': clean_empty(row.get('TechHub')),
            'defense_hub': clean_empty(row.get('DefenseHub')),

            # Weather & Climate
            'snow_annual': parse_int(row.get('Snow')),
            'rain_annual': parse_int(row.get('Rain')),
            'sun_days': parse_int(row.get('Sun')),
            'avg_low_winter': parse_int(row.get('ALW')),
            'avg_high_summer': parse_int(row.get('AHS')),
            'humidity_summer': parse_int(row.get('HumiditySummer')),
            'climate_detailed': clean_empty(row.get('Climate')),

            # Other
            'gas_price': clean_empty(row.get('Gas')),
            'description': clean_empty(row.get('Description')),

            # Display properties (keep defaults for now)
            'emoji': '📍',
            'gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'featured': False,
            'tags': [],
        }

        return data
