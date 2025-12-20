# VetRetire (Nextbase-Django)

**VetRetire** is a Django-based web application designed to help military veterans discover ideal retirement locations based on specific criteria like VA facility proximity, political climate, cost of living, and veteran-specific benefits.

## Project Overview

*   **Type:** Django Web Application
*   **Core App:** `locations`
*   **Database:** Neon PostgreSQL (via DATABASE_URL)
*   **Deployment:** Vercel (configured via `vercel.json` and `build.sh`)

## Architecture & State

### Data Models (`locations/models.py`)
The data layer is fully implemented and matches the project schema:
*   **Location:** Comprehensive model storing demographics, climate, economic, political, and veteran-specific data.
*   **StateInfo:** Stores state-level regulations (gun laws, etc.).

### Admin Interface (`locations/admin.py`)
A highly customized admin interface exists with:
*   Custom filters (Match Score, Crime Index).
*   Bulk actions (CSV export, Feature/Unfeature).
*   Fieldsets for organizing the extensive data points.

### Data Ingestion
*   **Command:** `python manage.py import_csv <path_to_csv>`
*   **Logic:** Located in `locations/management/commands/import_csv.py`. Handles data cleaning, type conversion, and updates existing records.

### Views (`locations/views.py`)
*   **Current Status:** The views (`home`, `explore`) are currently serving **hardcoded data** dictionaries.
*   **Immediate Goal:** Refactor views to query the fully implemented `Location` model instead of using static data.

## Development

### Setup
1.  **Environment:** Create a `.env` file (see `.env.example`).
2.  **Install:** `pip install -r requirements.txt`
3.  **Migrate:** `python manage.py migrate`
4.  **Run:** `python manage.py runserver`

### Key Commands
*   **Import Data:** `python manage.py import_csv path/to/data.csv --clear`
*   **Run Tests:** `python manage.py test locations`
*   **Create Superuser:** `python manage.py createsuperuser`

### Deployment (Vercel)
*   **Config:** `vercel.json` handles routing and build settings.
*   **Build Script:** `build.sh` runs during deployment. It sets `DJANGO_BUILD=1`, installs deps, collects static files, and runs migrations.

## Codebase Map

| File/Path | Description |
|-----------|-------------|
| `vetretire_project/settings.py` | Main Django config. Uses `dj-database-url` and `python-decouple`. |
| `locations/models.py` | detailed `Location` and `StateInfo` models. |
| `locations/admin.py` | Custom admin configuration. |
| `locations/views.py` | **TODO:** Needs refactoring to use ORM. |
| `locations/management/commands/` | Data import scripts. |
| `SCHEMA.md` | Database schema documentation. |
| `CLAUDE.md` | Legacy context/commands file. |

## Conventions
*   **Environment:** Use `python-decouple` (`config('KEY')`) for secrets.
*   **Styling:** Inline CSS and template-based styling (no complex frontend build step detected).
*   **Templates:** Located in `locations/templates/locations/`.
