from django.db import models

class Location(models.Model):
    """Model representing a retirement location"""

    # Basic information
    name = models.CharField(max_length=100, help_text="City or town name")
    state = models.CharField(max_length=50, help_text="State name")

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
