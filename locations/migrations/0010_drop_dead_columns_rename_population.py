"""Drop dead/duplicate columns and rename population_raw -> population.

Removed columns:
- match_score: unused (always 0); ranking is computed at request time.
- avg_price: always blank; home price lives in avg_home_value/_display.
- va_distance: legacy duplicate of distance_to_va.
- climate_detailed: identical to climate for every row.
- pps: unused, undocumented metric.
- population (legacy formatted string): superseded by population_raw, which is
  renamed to population here so a single field holds the full number.
"""
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('locations', '0009_convert_flag_and_density_types'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='location',
            options={'ordering': ['-featured', 'name']},
        ),
        migrations.RemoveIndex(
            model_name='location',
            name='locations_l_match_s_54e83a_idx',
        ),
        migrations.RemoveField(model_name='location', name='match_score'),
        migrations.RemoveField(model_name='location', name='avg_price'),
        migrations.RemoveField(model_name='location', name='va_distance'),
        migrations.RemoveField(model_name='location', name='climate_detailed'),
        migrations.RemoveField(model_name='location', name='pps'),
        migrations.RemoveField(model_name='location', name='population'),
        migrations.RenameField(
            model_name='location',
            old_name='population_raw',
            new_name='population',
        ),
    ]
