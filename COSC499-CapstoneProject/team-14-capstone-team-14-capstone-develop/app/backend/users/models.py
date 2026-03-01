from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models
from django.utils import timezone


# -------------------------
# Custom user manager class.
# This handles user creation logic.
# Django needs this if you're replacing the default User model.
# -------------------------
class UserManager(BaseUserManager):
    # Create a regular user (instructor by default)
    def create_user(
        self, email, name, password=None, role="instructor", **extra_fields
    ):
        if not email:
            raise ValueError("Email is required")
        if role not in ["instructor", "admin"]:
            raise ValueError("Role must be 'instructor' or 'admin'")

        email = self.normalize_email(email)
        email = email.lower()  # Ensure all emails are lowercase

        # Set is_staff based on role
        if role == "admin":
            extra_fields.setdefault("is_staff", True)
        else:
            extra_fields.setdefault("is_staff", False)

        user = self.model(
            email=email,
            name=name,
            role=role,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    # Create a superuser (admin + elevated permissions)
    def create_superuser(self, email, name, password=None, **extra_fields):
        # needed for admin panel access
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)  # gives full permissions
        return self.create_user(email, name, password, role="admin", **extra_fields)


# -------------------------
# Our actual User model
# This replaces Django's default User model.
# -------------------------
class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model for ExamVault"""

    # Choices for user role (used in database + admin)
    ROLE_CHOICES = (
        ("instructor", "Instructor"),
        ("admin", "Admin"),
    )

    # Custom fields matching our ERD
    email = models.EmailField(unique=True)  # Unique login identifier
    name = models.CharField(max_length=100)  # Instructor/admin display name
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="instructor")
    # Future: multi-factor auth toggle
    mfa_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    # Track logout time for better online status
    last_logout = models.DateTimeField(
        null=True, blank=True, help_text="Last logout timestamp"
    )

    # Email verification fields (for future implementation)
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=255, null=True, blank=True)
    verification_sent_at = models.DateTimeField(null=True, blank=True)

    # Required Django fields for user status
    # Used to "deactivate" an account
    is_active = models.BooleanField(default=True)
    # Required to log into Django admin
    is_staff = models.BooleanField(default=False)

    # PII Archive fields for GDPR compliance
    is_archived = models.BooleanField(
        default=False, help_text="User PII has been anonymized"
    )
    archived_at = models.DateTimeField(
        null=True, blank=True, help_text="When the user was archived"
    )
    archived_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="archived_users",
        help_text="Admin who archived this user",
    )

    # Attach our custom manager
    objects = UserManager()

    # Tell Django which field is used to log in
    USERNAME_FIELD = "email"  # Not 'username', we're using email instead
    REQUIRED_FIELDS = ["name"]  # Required when using `createsuperuser`

    def __str__(self):
        return f"{self.email} ({self.role})"

    def get_full_name(self) -> str:
        """Mimic Django’s default User helper so other code can rely on it."""
        return self.name
