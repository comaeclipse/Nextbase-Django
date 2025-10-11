"""
Vercel build script for Django deployment.
This file is automatically executed by Vercel during the build process.
"""
import os
import subprocess

def run_command(command):
    """Execute a shell command and print output."""
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    if result.returncode != 0:
        raise Exception(f"Command failed with exit code {result.returncode}")
    return result

if __name__ == "__main__":
    print("Starting Vercel build process...")

    # Collect static files
    print("\n1. Collecting static files...")
    run_command("python manage.py collectstatic --noinput")

    # Run migrations
    print("\n2. Running database migrations...")
    run_command("python manage.py migrate --noinput")

    print("\nBuild completed successfully!")
