import os
from pathlib import Path
import shutil
import dj_database_url
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-this-in-production-12345')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,.vercel.app').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'locations',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add WhiteNoise for static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'vetretire_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'vetretire_project.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

# Default to a bundled SQLite file for local dev
_default_sqlite_path = BASE_DIR / 'db.sqlite3'

# On serverless platforms (e.g., Vercel on AWS Lambda), the code directory
# is read-only at runtime. Use /tmp for a writable SQLite location and copy
# the bundled DB there on cold start so reads work.
_is_build_phase = os.environ.get('DJANGO_BUILD') == '1'
_is_serverless = False if _is_build_phase else bool(
    os.environ.get('VERCEL')
    or os.environ.get('VERCEL_ENV')
    or os.environ.get('AWS_LAMBDA_FUNCTION_NAME')
)

if _is_serverless:
    _writable_sqlite_path = Path('/tmp/db.sqlite3')
    try:
        if _default_sqlite_path.exists():
            # Copy once per cold start; ignore errors if already present
            if not _writable_sqlite_path.exists():
                shutil.copy2(_default_sqlite_path, _writable_sqlite_path)
        else:
            # Ensure parent exists; SQLite will create the file if migrations run
            _writable_sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        # Fallback: still point to /tmp even if copy fails
        pass

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': str(_writable_sqlite_path),
            'OPTIONS': {
                # Serverless can run concurrent requests in a single process
                'check_same_thread': False,
            },
        }
    }
else:
    # Local development or build phase
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': _default_sqlite_path,
        }
    }

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# WhiteNoise configuration for serving static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# CSRF Settings for Vercel deployment
CSRF_TRUSTED_ORIGINS = [
    'https://*.vercel.app',
]

# Use cookie-based sessions to avoid database writes in serverless
SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
