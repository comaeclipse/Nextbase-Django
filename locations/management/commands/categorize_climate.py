from django.core.management.base import BaseCommand
from locations.models import Location


class Command(BaseCommand):
    help = 'Categorize all locations into climate categories'

    def classify_location(self, loc):
        """Apply decision tree to assign category"""
        # Rule 1: Cold/Snowy
        if (loc.snow_annual and loc.snow_annual >= 30) or \
           (loc.avg_low_winter and loc.avg_low_winter <= 25 and
            loc.snow_annual and loc.snow_annual >= 15):
            return 'cold_snowy'

        # Rule 2: Hot/Dry
        if (loc.avg_high_summer and loc.avg_high_summer >= 95 and
            loc.humidity_summer and loc.humidity_summer <= 45) or \
           (loc.rain_annual and loc.rain_annual <= 15 and
            loc.avg_high_summer and loc.avg_high_summer >= 88):
            return 'hot_dry'

        # Rule 3: Hot/Humid
        if (loc.avg_high_summer and loc.avg_high_summer >= 88 and
            loc.humidity_summer and loc.humidity_summer >= 60) or \
           (loc.avg_low_winter and loc.avg_low_winter >= 45 and
            loc.humidity_summer and loc.humidity_summer >= 65):
            return 'hot_humid'

        # Rule 4: Mild/Coastal (fallback)
        return 'mild_coastal'

    def handle(self, *args, **options):
        locations = Location.objects.all()
        categories = {'cold_snowy': 0, 'hot_humid': 0, 'hot_dry': 0, 'mild_coastal': 0}

        for loc in locations:
            category = self.classify_location(loc)
            loc.climate_category = category
            loc.save(update_fields=['climate_category'])
            categories[category] += 1
            self.stdout.write(f"{loc.name}, {loc.state}: {category}")

        self.stdout.write(self.style.SUCCESS(
            f'\nSuccessfully categorized {locations.count()} locations:'
        ))
        for cat, count in categories.items():
            self.stdout.write(f"  {cat}: {count}")
