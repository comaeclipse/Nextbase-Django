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

                for row_num, row in enumerate(reader, start=2):
                    try:
                        location_data = self.parse_row(row)

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
            if not value or value.strip() in ['', '?', 'NA']:
                return None
            return value.strip()

        def parse_int(value):
            value = clean_empty(value)
            if value is None:
                return None
            try:
                return int(value.replace(',', ''))
            except (ValueError, AttributeError):
                return None

        def parse_decimal(value):
            value = clean_empty(value)
            if value is None:
                return None
            try:
                return Decimal(value)
            except (InvalidOperation, ValueError):
                return None

        def parse_float(value):
            value = clean_empty(value)
            if value is None:
                return None
            try:
                return float(value)
            except (ValueError, AttributeError):
                return None

        def parse_bool(value):
            value = clean_empty(value)
            if value is None:
                return None
            return value.strip().lower() in ('y', 'yes', 'true', 't', '1')

        def parse_home_value(value):
            value = clean_empty(value)
            if value is None:
                return None
            try:
                return Decimal(value.replace('$', '').replace(',', ''))
            except (InvalidOperation, ValueError, AttributeError):
                return None

        raw_home_value = row.get('AvgHomeValue', '')

        data = {
            # Basic info
            'name': clean_empty(row.get('City', '')),
            'state': clean_empty(row.get('State', '')),
            'county': clean_empty(row.get('County')),

            'climate': clean_empty(row.get('Climate', '')) or '',
            'cost_of_living': 'Moderate',

            # Political info
            'state_party': clean_empty(row.get('StateParty')),
            'governor': clean_empty(row.get('Governor')),
            'city_politics': clean_empty(row.get('CityPolitics')),
            'election_2016': clean_empty(row.get('2016Election')),
            'election_2016_percent': parse_int(row.get('2016PresidentPercent')),
            'election_2024': clean_empty(row.get('2024 Election')),
            'election_2024_percent': parse_int(row.get('2024PresidentPercent')),

            # Demographics & Economics
            'population': clean_empty(row.get('Population')),
            'density': parse_int(row.get('Density')),
            'sales_tax': parse_decimal(row.get('SalesTax')),
            'income_tax': parse_decimal(row.get('Income')),
            'col_index': parse_int(row.get('CostOfLiving')),

            # Home value
            'avg_home_value': parse_home_value(raw_home_value),
            'avg_home_value_display': clean_empty(raw_home_value),

            # Veterans Affairs
            'has_va': parse_bool(row.get('VA')),
            'nearest_va': clean_empty(row.get('NearestVA')),
            'distance_to_va': clean_empty(row.get('DistanceToVA')),
            'veterans_benefits': clean_empty(row.get('Veterans Benefits')),

            # Safety & Social
            'crime': clean_empty(row.get('CrimeRating')),
            'marijuana_status': clean_empty(row.get('Marijuana')),
            'lgbtq_rating': clean_empty(row.get('LGBTQ')),

            # Economic hubs
            'tech_hub': parse_bool(row.get('TechHub')),
            'defense_hub': parse_bool(row.get('DefenseHub')),

            # Weather & Climate
            'snow_annual': parse_int(row.get('Snow')),
            'rain_annual': parse_int(row.get('Rain')),
            'sun_days': parse_int(row.get('SunnyDays')),
            'avg_low_winter': parse_int(row.get('AverageLowWinter')),
            'avg_high_summer': parse_int(row.get('AverageHighSummer')),
            'humidity_summer': parse_int(row.get('HumiditySummer')),

            # Other
            'gas_price': clean_empty(row.get('Gas')),
            'description': clean_empty(row.get('Description')),

            # Election trend
            'rep_vote_share_change_pp': parse_float(row.get('rep_vote_share_change_pp')),
            'dem_vote_share_change_pp': parse_float(row.get('dem_vote_share_change_pp')),

            # Display properties (keep defaults)
            'emoji': '📍',
            'gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'featured': False,
            'tags': [],
        }

        return data
