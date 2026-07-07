# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**VetRetire** is a Django web application that helps military veterans find ideal retirement locations. The application provides location discovery with filters for climate, cost of living, lifestyle, healthcare access, and activities tailored to veteran needs.

## Project Status

This is a new Django project. The codebase currently contains only design specifications in `instructions.txt` and HTML templates (`home.html.txt`, `explore.html.txt`). The actual Django project structure needs to be created following the instructions.

## Setting Up the Development Environment

### Initial Setup

```bash
# Install dependencies
pip install django psycopg2-binary python-decouple

# Create the Django project structure
django-admin startproject vetretire_project
cd vetretire_project
python manage.py startapp locations

# Create templates directory
mkdir -p locations/templates/locations

# Set up environment variables (create .env file)
# DATABASE_URL=postgresql://user:password@localhost:5432/vetretire_db
# SECRET_KEY=your-secret-key
# DEBUG=True

# Run initial migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### Running the Development Server

```bash
python manage.py runserver
```

The application will be available at:
- Homepage: http://127.0.0.1:8000/
- Explore page: http://127.0.0.1:8000/explore/
- Admin interface: http://127.0.0.1:8000/admin/

### Database Migrations

```bash
# Create migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

## Architecture

### Project Structure

```
vetretire_project/          # Django project root
├── manage.py               # Django management script
├── vetretire_project/      # Project configuration package
│   ├── settings.py         # Django settings
│   ├── urls.py             # Root URL configuration
│   └── wsgi.py             # WSGI configuration
└── locations/              # Main application
    ├── views.py            # View functions
    ├── urls.py             # App URL patterns
    ├── models.py           # Database models (to be implemented)
    └── templates/
        └── locations/
            ├── home.html   # Landing page
            └── explore.html # Location search/filter page
```

### URL Routing

The project uses Django's URL routing with an app namespace:
- Root URLs (`vetretire_project/urls.py`) include admin and delegate to locations app
- Locations URLs (`locations/urls.py`) define:
  - `''` → `home` view (homepage)
  - `'explore/'` → `explore` view (search page)
- Template URLs use namespaced references: `{% url 'locations:home' %}`

### Data Architecture

Currently, the `explore` view returns hardcoded location data with these fields:
- `name`, `state`: Location identifiers
- `match_score`: Integer (0-100) representing user preference match
- `avg_price`: String formatted price (e.g., "$385k")
- `climate`: Description (e.g., "Warm", "4 Seasons")
- `cost_of_living`: Category (Low/Moderate/High)
- `population`: String formatted population
- `tags`: List of activity/feature tags
- `va_distance`: Distance to nearest VA facility
- `emoji`, `gradient`: Visual presentation data
- `featured`: Boolean flag for promoted locations

**Future Implementation**: This data should be moved to Django models with proper database relationships for locations, filters, user preferences, and VA facility data.

### Template System

The application uses Django template language with inline CSS. Key features:
- Responsive grid layouts using CSS Grid
- Gradient backgrounds for visual appeal
- Card-based UI components
- Filter sidebar with sticky positioning
- No external CSS framework dependencies

## Database Configuration

**Database**: Neon PostgreSQL (DATABASE_URL required)

This project uses Neon PostgreSQL exclusively. The `DATABASE_URL` environment variable is required for both local development and production.

### Setup

1. Create a Neon database at https://neon.tech
2. Copy the connection string
3. Set `DATABASE_URL` in your `.env` file:

```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

### Database Configuration in settings.py

```python
import dj_database_url
from decouple import config

_database_url = config('DATABASE_URL', default=None)

if not _database_url:
    raise ValueError("DATABASE_URL environment variable is required.")

DATABASES = {
    'default': dj_database_url.config(
        default=_database_url,
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=True,
    )
}
```

## Development Workflow

### When Adding New Features

1. **Models**: Define database models in `locations/models.py`
2. **Migrations**: Run `python manage.py makemigrations` and `python manage.py migrate`
3. **Views**: Add view functions in `locations/views.py`
4. **URLs**: Register URL patterns in `locations/urls.py`
5. **Templates**: Create HTML templates in `locations/templates/locations/`

### Testing the Application

```bash
# Run Django's built-in tests
python manage.py test

# Run specific app tests
python manage.py test locations
```

## Key Implementation Notes

### Current Limitations

- Location data is hardcoded in `views.py` - should be database-backed
- No user authentication system implemented yet
- Filter functionality on explore page is client-side only (no backend processing)
- No actual VA facility API integration

### Security Considerations

- `DEBUG = True` in settings - must be set to `False` in production
- `SECRET_KEY` needs to be changed before production deployment
- `ALLOWED_HOSTS = []` - must be configured for production
- Use `.env` file for environment variables (DATABASE_URL, SECRET_KEY, DEBUG)
- Never commit `.env` to git (already in .gitignore)
- Use platform environment variables for production (Render/Vercel)

### Deployment Considerations

**Platform Options**:
- **Render**: Full Django support, managed PostgreSQL, easy configuration
- **Vercel + Neon**: Serverless PostgreSQL, edge deployment, fast global access

**Required Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Django secret key
- `DEBUG`: Set to `False` in production
- `ALLOWED_HOSTS`: Comma-separated list of allowed domains

### Future Development Areas

- Implement location database models
- Add user authentication and saved locations
- Integrate VA facility API for real-time distance calculations
- Implement backend filter logic for location matching
- Add pagination for search results
- Create location detail pages
- Add user preference questionnaire

## Location Geography Rules
- **Geographic Discretion**: When conducting data retrieval for a location, the agent has full discretion to decide whether to define the location strictly by its city limits, as a Metropolitan Statistical Area (MSA), or to include unincorporated areas. 
- **Data Availability**: The agent should base this decision on data availability and what makes the most sense for evaluating a retirement location.
- **Documentation**: The agent must document which geographic definition was used for a given metric (e.g., "Population is for the MSA", "Crime data is strictly city limits").
