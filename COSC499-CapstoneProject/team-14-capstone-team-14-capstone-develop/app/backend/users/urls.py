from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ChangePasswordAPIView,
    CustomTokenObtainPairView,
    ForgotPasswordAPIView,
    LogoutView,
    RegisterAPIView,
    ResetPasswordAPIView,
    UserProfileAPIView,
    UsersHealthCheckView,
    ValidateResetTokenAPIView,
    VerifyEmailAPIView,
)

urlpatterns = [
    path("", RegisterAPIView.as_view(), name="users-root"),
    path("profile/", UserProfileAPIView.as_view(), name="user-profile"),
    path("health/", UsersHealthCheckView.as_view(), name="users-health"),
    # JWT login & refresh with last_login tracking
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Instructor sign-up endpoint
    path("register/", RegisterAPIView.as_view(), name="register"),
    path("verify-email/", VerifyEmailAPIView.as_view(), name="verify-email"),
    path("forgot-password/", ForgotPasswordAPIView.as_view(), name="forgot_password"),
    path(
        "validate-reset-token/",
        ValidateResetTokenAPIView.as_view(),
        name="validate_reset_token",
    ),
    path("reset-password/", ResetPasswordAPIView.as_view(), name="reset_password"),
    path("change-password/", ChangePasswordAPIView.as_view(), name="change_password"),
    path("logout/", LogoutView.as_view(), name="logout"),
]
