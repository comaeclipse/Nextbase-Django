#!/bin/bash

# Vercel build script - connects to Neon PostgreSQL via DATABASE_URL

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations against Neon PostgreSQL
python manage.py migrate --noinput
