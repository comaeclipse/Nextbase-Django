from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import Location, StateInfo
import csv
from django.http import HttpResponse


# Custom List Filters
class MatchScoreFilter(admin.SimpleListFilter):
    """Custom filter for match score ranges"""
    title = 'match score range'
    parameter_name = 'match_score_range'

    def lookups(self, request, model_admin):
        return (
            ('90-100', 'Excellent (90-100)'),
            ('75-89', 'Very Good (75-89)'),
            ('50-74', 'Good (50-74)'),
            ('25-49', 'Fair (25-49)'),
            ('0-24', 'Poor (0-24)'),
        )

    def queryset(self, request, queryset):
        if self.value() == '90-100':
            return queryset.filter(match_score__gte=90)
        elif self.value() == '75-89':
            return queryset.filter(match_score__gte=75, match_score__lt=90)
        elif self.value() == '50-74':
            return queryset.filter(match_score__gte=50, match_score__lt=75)
        elif self.value() == '25-49':
            return queryset.filter(match_score__gte=25, match_score__lt=50)
        elif self.value() == '0-24':
            return queryset.filter(match_score__lt=25)


class CrimeIndexFilter(admin.SimpleListFilter):
    """Custom filter for crime levels based on TCI"""
    title = 'crime level'
    parameter_name = 'crime_level'

    def lookups(self, request, model_admin):
        return (
            ('very_safe', 'Very Safe (TCI < 100)'),
            ('safe', 'Safe (100-149)'),
            ('moderate', 'Moderate (150-199)'),
            ('high', 'High Crime (200+)'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'very_safe':
            return queryset.filter(tci__lt=100, tci__isnull=False)
        elif self.value() == 'safe':
            return queryset.filter(tci__gte=100, tci__lt=150)
        elif self.value() == 'moderate':
            return queryset.filter(tci__gte=150, tci__lt=200)
        elif self.value() == 'high':
            return queryset.filter(tci__gte=200)


# Custom Admin Actions
@admin.action(description='Mark selected locations as featured')
def make_featured(modeladmin, request, queryset):
    """Bulk action to mark locations as featured"""
    updated = queryset.update(featured=True)
    modeladmin.message_user(request, f'{updated} location(s) marked as featured.')


@admin.action(description='Unmark selected locations as featured')
def remove_featured(modeladmin, request, queryset):
    """Bulk action to remove featured status"""
    updated = queryset.update(featured=False)
    modeladmin.message_user(request, f'{updated} location(s) unmarked as featured.')


@admin.action(description='Reset match scores to 0')
def reset_match_scores(modeladmin, request, queryset):
    """Bulk action to reset match scores"""
    updated = queryset.update(match_score=0)
    modeladmin.message_user(request, f'Reset match scores for {updated} location(s).')


@admin.action(description='Export selected to CSV')
def export_to_csv(modeladmin, request, queryset):
    """Export selected locations to CSV"""
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="locations_export.csv"'

    writer = csv.writer(response)
    # Write header
    writer.writerow([
        'Name', 'State', 'County', 'Match Score', 'Cost of Living',
        'Population', 'Climate', 'VA Distance', 'Featured'
    ])

    # Write data
    for obj in queryset:
        writer.writerow([
            obj.name, obj.state, obj.county or '', obj.match_score,
            obj.cost_of_living, obj.population, obj.climate,
            obj.va_distance, 'Yes' if obj.featured else 'No'
        ])

    return response


# Custom Form for Location
class LocationAdminForm(forms.ModelForm):
    """Custom form with better widgets"""
    class Meta:
        model = Location
        fields = '__all__'
        widgets = {
            'tags': forms.Textarea(attrs={
                'rows': 3,
                'placeholder': 'Enter tags as JSON array: ["Golf", "Fishing", "Arts"]'
            }),
            'description': forms.Textarea(attrs={'rows': 4}),
            'veterans_benefits': forms.Textarea(attrs={'rows': 3}),
        }


# Location Admin
@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    """Comprehensive admin interface for Location model"""

    form = LocationAdminForm

    # List Display
    list_display = [
        'name', 'state', 'county', 'match_score',
        'cost_indicator', 'population', 'featured',
        'va_status', 'created_at'
    ]

    # List Filters
    list_filter = [
        'featured',
        'cost_of_living',
        'state',
        'has_va',
        'tech_hub',
        'defense_hub',
        'marijuana_status',
        MatchScoreFilter,
        CrimeIndexFilter,
    ]

    # Search
    search_fields = [
        'name', 'state', 'county', 'description',
        'city_politics', 'nearest_va'
    ]

    # Ordering
    ordering = ['-match_score', 'name']

    # Readonly fields
    readonly_fields = ['created_at', 'updated_at']

    # List per page
    list_per_page = 50

    # Editable in list view
    list_editable = ['featured', 'match_score']

    # Actions
    actions = [make_featured, remove_featured, reset_match_scores, export_to_csv]

    # Fieldsets
    fieldsets = [
        ('Basic Information', {
            'fields': (
                ('name', 'state', 'county'),
                ('featured', 'match_score'),
                ('emoji', 'gradient'),
            )
        }),

        ('Economics & Cost of Living', {
            'fields': (
                ('avg_price', 'avg_home_value', 'avg_home_value_display'),
                ('cost_of_living', 'col_index'),
                ('sales_tax', 'income_tax'),
                ('gas_price',),
            ),
            'classes': ('collapse',),
        }),

        ('Demographics', {
            'fields': (
                ('population', 'population_raw'),
                ('density',),
            ),
            'classes': ('collapse',),
        }),

        ('Political Landscape', {
            'fields': (
                ('state_party', 'governor'),
                ('city_politics',),
                ('election_2016', 'election_2016_percent'),
                ('election_2024', 'election_2024_percent'),
                ('election_change',),
            ),
            'classes': ('collapse',),
        }),

        ('Veterans Affairs & Military', {
            'fields': (
                ('has_va', 'nearest_va'),
                ('va_distance', 'distance_to_va'),
                ('veterans_benefits',),
                ('defense_hub',),
            ),
        }),

        ('Climate & Weather', {
            'fields': (
                ('climate', 'climate_detailed'),
                ('snow_annual', 'rain_annual', 'sun_days'),
                ('avg_low_winter', 'avg_high_summer'),
                ('humidity_summer',),
            ),
            'classes': ('collapse',),
        }),

        ('Safety & Social Environment', {
            'fields': (
                ('tci', 'crime'),
                ('lgbtq_rating',),
                ('marijuana_status',),
            ),
            'classes': ('collapse',),
        }),

        ('Economic & Lifestyle Features', {
            'fields': (
                ('tech_hub',),
                ('tags',),
            ),
            'classes': ('collapse',),
        }),

        ('Additional Information', {
            'fields': (
                ('description',),
                ('pps',),
            ),
            'classes': ('collapse',),
        }),

        ('Metadata', {
            'fields': (
                ('created_at', 'updated_at'),
            ),
            'classes': ('collapse',),
        }),
    ]

    # Custom Display Methods
    @admin.display(description='VA Status')
    def va_status(self, obj):
        """Display VA access status with color coding"""
        if obj.has_va and obj.has_va.lower().startswith('y'):
            return format_html('<span style="color: green;">✓ Has VA</span>')
        elif obj.nearest_va:
            nearest = obj.nearest_va[:30] + '...' if len(obj.nearest_va) > 30 else obj.nearest_va
            return format_html('<span style="color: orange;">➜ {}</span>', nearest)
        return format_html('<span style="color: gray;">-</span>')

    @admin.display(description='Cost')
    def cost_indicator(self, obj):
        """Visual cost indicator with color coding"""
        colors = {'Low': 'green', 'Moderate': 'orange', 'High': 'red'}
        color = colors.get(obj.cost_of_living, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.cost_of_living
        )

    @admin.display(description='Description Preview')
    def short_description(self, obj):
        """Show truncated description"""
        if obj.description:
            return obj.description[:100] + '...' if len(obj.description) > 100 else obj.description
        return '-'

    def save_model(self, request, obj, form, change):
        """Custom save logic with auto-population"""
        # Auto-populate avg_home_value_display from avg_home_value
        if obj.avg_home_value and not obj.avg_home_value_display:
            if obj.avg_home_value >= 1000000:
                obj.avg_home_value_display = f"${obj.avg_home_value / 1000000:.1f}M"
            elif obj.avg_home_value >= 1000:
                obj.avg_home_value_display = f"${obj.avg_home_value / 1000:.0f}k"
            else:
                obj.avg_home_value_display = f"${obj.avg_home_value:.0f}"

        # Set default gradient if not provided
        if not obj.gradient:
            obj.gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

        # Set default emoji if not provided
        if not obj.emoji:
            obj.emoji = '📍'

        super().save_model(request, obj, form, change)


# StateInfo Admin
@admin.register(StateInfo)
class StateInfoAdmin(admin.ModelAdmin):
    """Admin interface for StateInfo model"""

    # List Display
    list_display = [
        'state',
        'gifford_score',
        'magazine_limit_preview',
        'ghost_gun_ban',
        'assault_weapon_ban',
        'updated_at'
    ]

    # List Filters
    list_filter = [
        'gifford_score',
        'ghost_gun_ban',
        'assault_weapon_ban',
    ]

    # Search
    search_fields = ['state', 'magazine_limit']

    # Ordering
    ordering = ['state']

    # Readonly
    readonly_fields = ['created_at', 'updated_at']

    # Fieldsets
    fieldsets = [
        ('State Identification', {
            'fields': ('state',)
        }),
        ('Gun Laws & Regulations', {
            'fields': (
                'gifford_score',
                'magazine_limit',
                'ghost_gun_ban',
                'assault_weapon_ban',
            )
        }),
        ('Metadata', {
            'fields': (('created_at', 'updated_at'),),
            'classes': ('collapse',),
        }),
    ]

    # Custom Display Methods
    @admin.display(description='Magazine Limit')
    def magazine_limit_preview(self, obj):
        """Show truncated magazine limit info"""
        if obj.magazine_limit:
            return obj.magazine_limit[:50] + '...' if len(obj.magazine_limit) > 50 else obj.magazine_limit
        return '-'


# Customize Admin Site
admin.site.site_header = "VetRetire Administration"
admin.site.site_title = "VetRetire Admin"
admin.site.index_title = "Retirement Location Management"
