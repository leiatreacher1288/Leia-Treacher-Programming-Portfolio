"""
Local test settings that use SQLite for testing
"""

# Use SQLite for testing - much faster and more reliable than PostgreSQL
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",  # Use in-memory database for faster tests
    }
}

# Optional: Speed up tests
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# Optional: Use console backend for emails during testing
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
