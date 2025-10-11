from django.db import models


class StateInfo(models.Model):
    """State-level information (gun laws, regulations, etc.)"""

    # Primary key
    state = models.CharField(
        max_length=2,
        primary_key=True,
        help_text="Two-letter state abbreviation"
    )

    # Gun Laws & Regulations
    magazine_limit = models.TextField(
        null=True,
        blank=True,
        help_text="Magazine capacity restrictions"
    )
    gifford_score = models.CharField(
        max_length=5,
        null=True,
        blank=True,
        help_text="Giffords Law Center grade (A-F with +/-)"
    )
    ghost_gun_ban = models.CharField(
        max_length=5,
        null=True,
        blank=True,
        help_text="Ghost gun ban status (Y/N)"
    )
    assault_weapon_ban = models.CharField(
        max_length=5,
        null=True,
        blank=True,
        help_text="Assault weapon ban status (Y/N)"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['state']
        verbose_name = 'State Information'
        verbose_name_plural = 'State Information'

    def __str__(self):
        return f"{self.state} - Gifford Score: {self.gifford_score or 'N/A'}"


class Location(models.Model):
    """Model representing a retirement location"""

    # Basic information
    name = models.CharField(max_length=100, help_text="City or town name")
    state = models.CharField(max_length=50, help_text="State name")
    county = models.CharField(max_length=100, null=True, blank=True, help_text="County name")

    # Metrics
    match_score = models.IntegerField(
        default=0,
        help_text="Match score from 0-100"
    )
    avg_price = models.CharField(
        max_length=20,
        help_text="Average home price (formatted, e.g., '$385k')"
    )
    climate = models.CharField(
        max_length=50,
        help_text="Climate description (e.g., 'Warm', '4 Seasons')"
    )
    cost_of_living = models.CharField(
        max_length=20,
        choices=[
            ('Low', 'Low'),
            ('Moderate', 'Moderate'),
            ('High', 'High'),
        ],
        default='Moderate'
    )
    population = models.CharField(
        max_length=20,
        help_text="Population (formatted, e.g., '58k')"
    )

    # Features and amenities
    tags = models.JSONField(
        default=list,
        help_text="List of activity/feature tags"
    )

    # VA facility information
    va_distance = models.CharField(
        max_length=50,
        help_text="Distance to nearest VA facility (e.g., '3 miles')"
    )

    # ===== NEW CSV DATA FIELDS =====
    # See SCHEMA.md for detailed field descriptions

    # Political Information
    state_party = models.CharField(max_length=10, null=True, blank=True, help_text="State political party (R/D)")
    governor = models.CharField(max_length=10, null=True, blank=True, help_text="Governor's party (R/D)")
    city_politics = models.CharField(max_length=100, null=True, blank=True, help_text="City political leaning")
    election_2016 = models.CharField(max_length=50, null=True, blank=True, help_text="2016 presidential winner")
    election_2016_percent = models.IntegerField(null=True, blank=True, help_text="2016 winner percentage")
    election_2024 = models.CharField(max_length=50, null=True, blank=True, help_text="2024 presidential winner")
    election_2024_percent = models.IntegerField(null=True, blank=True, help_text="2024 winner percentage")
    election_change = models.CharField(max_length=100, null=True, blank=True, help_text="Voting shift 2016-2024")

    # Demographics & Economics
    population_raw = models.CharField(max_length=50, null=True, blank=True, help_text="Population (raw from CSV)")
    density = models.CharField(max_length=50, null=True, blank=True, help_text="Population density per sq mi")
    sales_tax = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Sales tax %")
    income_tax = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Income tax %")
    col_index = models.IntegerField(null=True, blank=True, help_text="Cost of living index (100=avg)")

    # Veterans Affairs (detailed)
    has_va = models.CharField(max_length=10, null=True, blank=True, help_text="Has VA facility (Yes/No)")
    nearest_va = models.CharField(max_length=200, null=True, blank=True, help_text="Nearest VA facility name")
    distance_to_va = models.CharField(max_length=50, null=True, blank=True, help_text="Distance to VA")
    veterans_benefits = models.TextField(null=True, blank=True, help_text="Veteran-specific benefits")

    # Safety & Social
    tci = models.IntegerField(null=True, blank=True, help_text="Total crime index (lower is safer)")
    marijuana_status = models.CharField(max_length=50, null=True, blank=True, help_text="Marijuana legal status")
    lgbtq_rating = models.CharField(max_length=50, null=True, blank=True, help_text="LGBTQ friendliness")

    # Economic Hubs
    tech_hub = models.CharField(max_length=10, null=True, blank=True, help_text="Tech hub (Y/N)")
    defense_hub = models.CharField(max_length=10, null=True, blank=True, help_text="Defense/military hub (Y/N)")

    # Weather & Climate (detailed)
    snow_annual = models.IntegerField(null=True, blank=True, help_text="Average annual snowfall (inches)")
    rain_annual = models.IntegerField(null=True, blank=True, help_text="Average annual rainfall (inches)")
    sun_days = models.IntegerField(null=True, blank=True, help_text="Average sunny days per year")
    avg_low_winter = models.IntegerField(null=True, blank=True, help_text="Average low temp in winter (°F)")
    avg_high_summer = models.IntegerField(null=True, blank=True, help_text="Average high temp in summer (°F)")
    humidity_summer = models.IntegerField(null=True, blank=True, help_text="Average July humidity %")
    climate_detailed = models.CharField(max_length=200, null=True, blank=True, help_text="Detailed climate description")

    # Other
    gas_price = models.CharField(max_length=20, null=True, blank=True, help_text="Average gas price")
    description = models.TextField(null=True, blank=True, help_text="Location description")

    # Display properties
    emoji = models.CharField(
        max_length=10,
        default='📍',
        help_text="Emoji icon for the location"
    )
    gradient = models.CharField(
        max_length=200,
        default='linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        help_text="CSS gradient for card background"
    )
    featured = models.BooleanField(
        default=False,
        help_text="Whether this location is featured"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-match_score', 'name']
        indexes = [
            models.Index(fields=['match_score']),
            models.Index(fields=['state']),
            models.Index(fields=['featured']),
        ]

    def __str__(self):
        return f"{self.name}, {self.state} (Score: {self.match_score})"
