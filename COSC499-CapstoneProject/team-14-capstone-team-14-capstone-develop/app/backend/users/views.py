# users/views.py
from datetime import timedelta

from django.contrib.auth import logout
from django.contrib.auth.tokens import default_token_generator
from django.db import connection
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from users.models import User

from .email_utils import send_password_changed_email  # used below
from .email_utils import send_password_reset_email  # used below
from .serializers import RegisterSerializer

# ────────────────────────────────────────────────────────────────
# Small inline serializers just for the auth flows
# ────────────────────────────────────────────────────────────────


class ForgotPasswordSerializer(serializers.Serializer):
    """Validates e-mail for POST /api/auth/forgot-password/"""

    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("User with this email does not exist")
        return value.lower()


class ResetPasswordSerializer(serializers.Serializer):
    """uid + token + new_password coming back from /reset-password"""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        uid = attrs["uid"]
        token = attrs["token"]
        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError(
                {"error": "Invalid or expired reset token"}
            )

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError(
                {"error": "Invalid or expired reset token"}
            )

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user: User = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# ────────────────────────────────────────────────────────────────
# Public endpoints
# ────────────────────────────────────────────────────────────────


class RegisterAPIView(APIView):
    """POST /api/auth/register/ – Create an instructor account"""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "Instructor registered successfully.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )

        if "email" in serializer.errors:
            return Response(
                {"message": str(serializer.errors["email"][0])},
                status=status.HTTP_400_BAD_REQUEST,
            )
        first_field = next(iter(serializer.errors))
        return Response(
            {"message": str(serializer.errors[first_field][0])},
            status=status.HTTP_400_BAD_REQUEST,
        )


class UsersHealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_status = "connected"
        except Exception:
            db_status = "unreachable"
        return Response({"status": "ok", "service": "users", "database": db_status})


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response(
            {"name": user.name, "email": user.email, "is_staff": user.is_staff}
        )


class VerifyEmailAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response(
                {"message": "Verification token required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(verification_token=token)
        except User.DoesNotExist:
            return Response({"message": "Email already verified!"}, status=200)

        expired = (
            user.verification_sent_at
            and timezone.now() > user.verification_sent_at + timedelta(days=3)
        )
        if expired:
            return Response(
                {"message": "Verification link has expired"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_verified = True
        user.verification_token = None
        user.save(update_fields=["is_verified", "verification_token"])
        return Response({"message": "Email verified successfully!"}, status=200)


# ───────────────────── Password-reset flow ──────────────────────


class ForgotPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            # missing field or invalid format
            user_missing = "User with this email does not exist"
            if (
                "email" in serializer.errors
                and serializer.errors["email"][0] == user_missing
            ):
                return Response({"error": user_missing}, status=400)
            return Response(serializer.errors, status=400)

        # Known e-mail → send link
        user = User.objects.get(email__iexact=serializer.validated_data["email"])
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        send_password_reset_email(user, uid, token)
        return Response({"message": "Password reset email sent"}, status=200)


# ────────────────── Token validation (reset) ──────────────────


class ValidateResetTokenAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        if not uid or not token:
            return Response({"error": "Invalid or expired reset token"}, status=400)
        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid or expired reset token"}, status=400)

        if default_token_generator.check_token(user, token):
            return Response({"valid": True, "email": user.email}, status=200)

        return Response({"error": "Invalid or expired reset token"}, status=400)


class ResetPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset successfully"}, status=200)

        if "error" in serializer.errors:
            return Response({"error": serializer.errors["error"][0]}, status=400)
        return Response(serializer.errors, status=400)


# ───────────── Change-password (logged-in user) ──────────────


class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current = request.data.get("current_password")
        new = request.data.get("new_password")

        if not current or not new:
            return Response({"message": "Both fields required"}, status=400)
        if not request.user.check_password(current):
            return Response({"message": "Current password is incorrect"}, status=400)
        if current == new:
            return Response(
                {"message": "New password must be different from current password"},
                status=400,
            )
        if len(new) < 8:
            return Response(
                {"message": "Password must be at least 8 characters"},
                status=400,
            )

        request.user.set_password(new)
        request.user.save()
        send_password_changed_email(request.user)
        return Response({"message": "Password changed successfully"}, status=200)


# ───────────── Custom JWT Token View with last_login tracking ──────────────


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that updates last_login when user logs in"""

    def validate(self, attrs):
        data = super().validate(attrs)

        # Update last_login for the user
        self.user.last_login = timezone.now()
        self.user.save(update_fields=["last_login"])

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view that tracks last_login"""

    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Handle user logout for all user types (instructors, students, etc.)"""

    permission_classes = [AllowAny]  # Allow unauthenticated requests for testing

    def post(self, request):
        """Log out the current user and update last_logout timestamp"""
        try:
            if request.user.is_authenticated:
                print(
                    f"🚪 Logging out user: {request.user.email} "
                    f"(Role: {getattr(request.user, 'role', 'unknown')})"
                )

                # Update last_logout timestamp for ALL users (not just admins)
                request.user.last_logout = timezone.now()
                request.user.save(update_fields=["last_logout"])

                print(f"✅ Updated last_logout for {request.user.email}")

                # Log the logout activity
                from .models import UserActivity

                UserActivity.log_activity(
                    user=request.user,
                    action="logout",
                    description=f"User {request.user.email} logged out",
                    request=request,
                )

            logout(request)

            return Response({"success": True, "message": "Successfully logged out"})

        except Exception as e:
            print(f"💥 Logout error: {str(e)}")
            # Still logout even if timestamp update fails
            logout(request)
            return Response({"success": True, "message": "Logged out (with warnings)"})
