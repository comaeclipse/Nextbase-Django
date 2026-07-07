"""Convert stringly-typed flags and density to real Boolean/Integer columns.

The DB stores has_va as "Yes"/"No", tech_hub/defense_hub as "Y"/"N", and density
as a comma-formatted string ("1,802"). These are converted in place with explicit
USING casts so existing data is preserved, using SeparateDatabaseAndState so Django's
model state tracks the new field types.
"""
from django.db import migrations, models


# Forward DB casts. NULLs pass through; anything starting with y/t/1 becomes true.
BOOL_FORWARD = (
    "ALTER TABLE locations_location "
    "ALTER COLUMN {col} DROP DEFAULT, "
    "ALTER COLUMN {col} TYPE boolean "
    "USING (lower({col}) IN ('yes', 'y', 'true', 't', '1'))"
)
BOOL_REVERSE = (
    "ALTER TABLE locations_location "
    "ALTER COLUMN {col} TYPE varchar(10) "
    "USING (CASE WHEN {col} IS NULL THEN NULL WHEN {col} THEN 'Yes' ELSE 'No' END)"
)

DENSITY_FORWARD = (
    "ALTER TABLE locations_location "
    "ALTER COLUMN density TYPE integer "
    "USING NULLIF(regexp_replace(density, '\\D', '', 'g'), '')::integer"
)
DENSITY_REVERSE = (
    "ALTER TABLE locations_location "
    "ALTER COLUMN density TYPE varchar(50) "
    "USING (CASE WHEN density IS NULL THEN NULL ELSE to_char(density, 'FM999,999,999') END)"
)


def bool_op(col, help_text):
    return migrations.SeparateDatabaseAndState(
        database_operations=[
            migrations.RunSQL(
                sql=BOOL_FORWARD.format(col=col),
                reverse_sql=BOOL_REVERSE.format(col=col),
            )
        ],
        state_operations=[
            migrations.AlterField(
                model_name='location',
                name=col,
                field=models.BooleanField(null=True, blank=True, help_text=help_text),
            )
        ],
    )


class Migration(migrations.Migration):

    dependencies = [
        ('locations', '0008_location_lgbtq_mei_score_location_lgbtq_score_source_and_more'),
    ]

    operations = [
        bool_op('has_va', 'Has a local VA facility'),
        bool_op('tech_hub', 'Technology hub'),
        bool_op('defense_hub', 'Defense/military hub'),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(sql=DENSITY_FORWARD, reverse_sql=DENSITY_REVERSE)
            ],
            state_operations=[
                migrations.AlterField(
                    model_name='location',
                    name='density',
                    field=models.IntegerField(
                        null=True, blank=True, help_text='Population density per sq mi'
                    ),
                )
            ],
        ),
    ]
