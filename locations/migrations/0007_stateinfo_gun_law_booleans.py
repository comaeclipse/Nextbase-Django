from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('locations', '0006_location_vote_share_change'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='stateinfo',
            name='assault_weapon_ban',
        ),
        migrations.AddField(
            model_name='stateinfo',
            name='assault_weapons_ban',
            field=models.BooleanField(blank=True, help_text='State has an assault weapons ban', null=True),
        ),
        migrations.AddField(
            model_name='stateinfo',
            name='high_cap_mag_ban',
            field=models.BooleanField(blank=True, help_text='State has a high-capacity magazine ban', null=True),
        ),
    ]
