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
    assault_weapons_ban = models.BooleanField(
        null=True,
        blank=True,
        help_text="State has an assault weapons ban"
    )
    high_cap_mag_ban = models.BooleanField(
        null=True,
        blank=True,
        help_text="State has a high-capacity magazine ban"
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
    # Features and amenities
    tags = models.JSONField(
        default=list,
        help_text="List of activity/feature tags"
    )

    # VA facility information
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
    population = models.CharField(max_length=50, null=True, blank=True, help_text="Population (e.g., '915,927')")
    density = models.IntegerField(null=True, blank=True, help_text="Population density per sq mi")
    sales_tax = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Sales tax %")
    income_tax = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Income tax %")
    col_index = models.IntegerField(null=True, blank=True, help_text="Cost of living index (100=avg)")

    # Veterans Affairs (detailed)
    has_va = models.BooleanField(null=True, blank=True, help_text="Has a local VA facility")
    nearest_va = models.CharField(max_length=200, null=True, blank=True, help_text="Nearest VA facility name")
    distance_to_va = models.CharField(max_length=50, null=True, blank=True, help_text="Distance to VA")
    veterans_benefits = models.TextField(null=True, blank=True, help_text="Veteran-specific benefits")

    # Safety & Social
    tci = models.IntegerField(null=True, blank=True, help_text="Total crime index (lower is safer)")
    marijuana_status = models.CharField(max_length=50, null=True, blank=True, help_text="Marijuana legal status")
    lgbtq_rating = models.CharField(max_length=50, null=True, blank=True, help_text="LGBTQ friendliness")
    lgbtq_mei_score = models.IntegerField(
        null=True,
        blank=True,
        help_text="HRC Municipal Equality Index city score, where available (0-100)"
    )
    lgbtq_state_policy_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="MAP overall state LGBTQ policy score out of 49"
    )
    lgbtq_score_source = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Source/method used for the LGBTQ friendliness score"
    )

    # Economic Hubs
    tech_hub = models.BooleanField(null=True, blank=True, help_text="Technology hub")
    defense_hub = models.BooleanField(null=True, blank=True, help_text="Defense/military hub")

    # Weather & Climate (detailed)
    snow_annual = models.IntegerField(null=True, blank=True, help_text="Average annual snowfall (inches)")
    rain_annual = models.IntegerField(null=True, blank=True, help_text="Average annual rainfall (inches)")
    sun_days = models.IntegerField(null=True, blank=True, help_text="Average sunny days per year")
    avg_low_winter = models.IntegerField(null=True, blank=True, help_text="Average low temp in winter (°F)")
    avg_high_summer = models.IntegerField(null=True, blank=True, help_text="Average high temp in summer (°F)")
    humidity_summer = models.IntegerField(null=True, blank=True, help_text="Average July humidity %")
    # Other
    gas_price = models.CharField(max_length=20, null=True, blank=True, help_text="Average gas price")
    description = models.TextField(null=True, blank=True, help_text="Location description")

    # Additional economic data
    avg_home_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Average home value (numeric)"
    )
    avg_home_value_display = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Formatted home value (e.g., '$385k')"
    )

    # Safety metric
    crime = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        help_text="Crime rating/category"
    )

    # Climate categorization
    climate_category = models.CharField(
        max_length=20,
        choices=[
            ('cold_snowy', 'Cold / Snowy'),
            ('hot_humid', 'Hot / Humid'),
            ('hot_dry', 'Hot / Dry'),
            ('mild_coastal', 'Mild / Coastal'),
        ],
        null=True,
        blank=True,
        help_text="Computed climate category for filtering"
    )

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

    # Election trend data
    rep_vote_share_change_pp = models.FloatField(
        null=True,
        blank=True,
        help_text="Republican vote share change 2016-2024 (percentage points)"
    )
    dem_vote_share_change_pp = models.FloatField(
        null=True,
        blank=True,
        help_text="Democrat vote share change 2016-2024 (percentage points)"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-featured', 'name']
        indexes = [
            models.Index(fields=['climate_category']),
            models.Index(fields=['state']),
            models.Index(fields=['featured']),
        ]

    def __str__(self):
        return f"{self.name}, {self.state}"
