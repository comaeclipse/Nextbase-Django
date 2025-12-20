"""Custom template filters for location admin views."""
from django import template
import json

register = template.Library()


@register.filter
def attr(obj, field_name):
    """Get attribute value from object by field name."""
    value = getattr(obj, field_name, '')
    # Handle JSONField - convert to string for display
    if isinstance(value, (list, dict)):
        return json.dumps(value)
    return value if value is not None else ''


@register.filter
def field_type(field):
    """Get the internal type of a model field."""
    return field.get_internal_type()
