from django.contrib import admin

# Register only if not already registered (safe fallback)
from django.contrib.admin.sites import AlreadyRegistered

from .models import Course

try:
    admin.site.register(Course)
except AlreadyRegistered:
    pass
