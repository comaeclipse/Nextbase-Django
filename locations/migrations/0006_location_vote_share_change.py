from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('locations', '0005_location_climate_category_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='rep_vote_share_change_pp',
            field=models.FloatField(blank=True, help_text='Republican vote share change 2016-2024 (percentage points)', null=True),
        ),
        migrations.AddField(
            model_name='location',
            name='dem_vote_share_change_pp',
            field=models.FloatField(blank=True, help_text='Democrat vote share change 2016-2024 (percentage points)', null=True),
        ),
    ]
