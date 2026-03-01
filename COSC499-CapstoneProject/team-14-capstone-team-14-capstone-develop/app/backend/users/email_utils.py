from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import strip_tags


def send_verification_email(user):
    """Send verification email to user"""
    subject = "Verify your ExamVault account"

    # Create verification link
    verification_link = (
        f"{settings.FRONTEND_URL}/verify-email?token={user.verification_token}"
    )

    # Create HTML message
    html_message = f"""
    <html>
        <body>
            <h2>Welcome to ExamVault!</h2>
            <p>Hi {user.name},</p>
            <p>Thank you for registering. Please click the link below to verify
            your email address:</p>
            <p><a href="{verification_link}"
            style="display: inline-block; padding: 10px 20px;
            background-color: #007bff; color: white; text-decoration: none;
            border-radius: 5px;">Verify Email</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p>{verification_link}</p>
            <p>This link will expire in 3 days.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <br>
            <p>Best regards,<br>The ExamVault Team</p>
        </body>
    </html>
    """

    # Plain text version
    plain_message = strip_tags(html_message)

    # Send email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_reset_email(user, uid, token):
    """Send password reset email to user"""
    subject = "Reset your ExamVault password"

    # Create reset link
    reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"

    # Create HTML message
    html_message = f"""
    <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Hi {user.name},</p>
            <p>You requested to reset your password for your ExamVault account.</p>
            <p>Please click the link below to reset your password:</p>
            <p><a href="{reset_link}"
            style="display: inline-block; padding: 10px 20px;
            background-color: #007bff; color: white; text-decoration: none;
            border-radius: 5px;">Reset Password</a></p>
            <p>Or copy and paste this link into your browser:</p>
            <p>{reset_link}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't request a password reset, please ignore this email
            and your password will remain unchanged.</p>
            <br>
            <p>Best regards,<br>The ExamVault Team</p>
        </body>
    </html>
    """

    # Plain text version
    plain_message = f"""
Hi {user.name},

You requested to reset your password for your ExamVault account.

Please click the link below to reset your password:
{reset_link}

This link will expire in 24 hours for security reasons.

If you didn't request a password reset, please ignore this email
and your password will remain unchanged.

Best regards,
The ExamVault Team
"""

    # Send email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_changed_email(user):
    subject = "Your ExamVault password was changed"
    body = f"Hi {user.name},\n\nYour password was just updated."
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email])
