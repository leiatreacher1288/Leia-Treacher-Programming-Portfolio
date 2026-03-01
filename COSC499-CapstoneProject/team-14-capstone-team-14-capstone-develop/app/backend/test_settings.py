#!/usr/bin/env python3
"""
Test Settings Override
======================
Override database settings for local testing outside Docker.
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use SQLite for faster local testing
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}


# Disable migrations during testing for speed
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None


MIGRATION_MODULES = DisableMigrations()

# Alternative: PostgreSQL settings (if you have local PostgreSQL running)
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": "examvault",
#         "USER": "postgres",
#         "PASSWORD": "postgres",
#         "HOST": "localhost",  # Use localhost instead of "db" for local testing
#         "PORT": "5432",
#     }
# }
