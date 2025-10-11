#!/bin/bash

# Mark as build phase so settings use a project-local SQLite path
export DJANGO_BUILD=1

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations against project-local DB (bundled into the deployment)
python manage.py migrate --noinput
