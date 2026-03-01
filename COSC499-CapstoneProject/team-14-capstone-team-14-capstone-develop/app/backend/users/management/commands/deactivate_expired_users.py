from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from users.models import User


class Command(BaseCommand):
    help = "Deactivate user accounts that remained unverified for over 3 days"

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=3)
        qs = User.objects.filter(
            is_verified=False, is_active=True, verification_sent_at__lt=cutoff
        )
        count = qs.update(is_active=False)
        self.stdout.write(self.style.SUCCESS(f"Deactivated {count} expired user(s)"))
