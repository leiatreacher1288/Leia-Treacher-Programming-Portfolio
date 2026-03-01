import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Creates a default superuser for dev environments if not exists"

    def handle(self, *args, **kwargs):
        User = get_user_model()
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
        name = os.getenv("DJANGO_SUPERUSER_NAME", "Admin")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin123")

        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(email=email, name=name, password=password)
            self.stdout.write(self.style.SUCCESS(f"✅ Superuser '{email}' created"))
        else:
            self.stdout.write(
                self.style.WARNING(f"⚠️ Superuser '{email}' already exists")
            )
