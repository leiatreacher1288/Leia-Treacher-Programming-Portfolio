from rest_framework import serializers

from .email_utils import send_verification_email
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    # Extra validation: password must be explicitly defined
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    # Override email field to remove unique validation at serializer level
    email = serializers.EmailField(
        required=True,
        # Remove the unique validator to handle it manually
        validators=[],
    )

    class Meta:
        model = User
        fields = ["email", "name", "password"]

    def validate_email(self, value):
        """
        Check if email already exists (case-insensitive) and provide a clear error
        message
        """
        # Normalize email to lowercase
        normalized_email = value.lower()

        # Check for existing email (case-insensitive)
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("Email already registered")

        return normalized_email

    def create(self, validated_data):
        """
        This method runs after validation succeeds.
        """
        import uuid

        from django.utils import timezone

        user = User.objects.create_user(
            email=validated_data["email"],
            name=validated_data["name"],
            password=validated_data["password"],
            role="instructor",
        )

        # Generate verification token
        user.verification_token = str(uuid.uuid4())
        user.verification_sent_at = timezone.now()
        user.save()

        # Send verification email
        try:
            send_verification_email(user)
        except Exception as e:
            # Log error but don't fail registration
            print(f"Failed to send verification email: {e}")

        return user


class ForgotPasswordSerializer(serializers.Serializer):
    """Validates the e-mail coming into POST /api/auth/forgot-password/"""

    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("User with this email does not exist")
        return value
