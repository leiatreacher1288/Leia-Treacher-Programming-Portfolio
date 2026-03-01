"""
Admin API views for React frontend using Django REST Framework.
"""

from datetime import datetime, timedelta
import logging
import os

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.db import connection
from django.db.models import Q
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import psutil
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken

from courses.models import Course
from exams.models import Exam, ExamTemplate
from questions.models import Question
from results.models import ExamResult
from users.models import User

# Import the new models and serializers for global settings
from .models import ExamFormat, GlobalSetting, MarkingScheme, PrivacyAuditLog
from .serializers import (
    AdminCourseOverviewSerializer,
    AdminExamOverviewSerializer,
    ExamFormatSerializer,
    GlobalSettingSerializer,
    MarkingSchemeSerializer,
    PrivacyAuditLogSerializer,
)

# Initialize logger
logger = logging.getLogger(__name__)
# User Activity Model for tracking recent activity


# User Activity Model for tracking recent activity
class UserActivity:
    """Simple class to track user activities for recent activity feed"""

    @staticmethod
    def log_activity(user, action, description, request=None):
        """Log user activity"""
        activity_data = {
            "user_id": user.id,
            "user_name": user.name,
            "user_email": user.email,
            "action": action,
            "description": description,
            "timestamp": timezone.now(),
            "ip_address": (
                request.META.get("REMOTE_ADDR", "Unknown") if request else "System"
            ),
        }
        # For now, we'll store in cache or session - in production
        # you'd use a proper model
        # This is a simple implementation that stores recent activities
        print(f"📊 User Activity: {activity_data}")
        return activity_data


class CSRFTokenView(APIView):
    """Provide CSRF token for React frontend."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        """Return CSRF token for frontend."""
        return Response({"csrfToken": get_token(request), "success": True})


class AdminLoginAPIView(APIView):
    """Handle admin login via JSON API."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        """Authenticate admin user and return user data with JWT tokens."""
        try:
            print(f"🌐 Admin login endpoint hit! Path: {request.path}")
            print(f"🔍 Request data: {request.data}")
            username = request.data.get("username")
            password = request.data.get("password")
            print(f"🔐 Admin login attempt: {username}")

            if not username or not password:
                return Response(
                    {"success": False, "error": "Username and password are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = authenticate(request, username=username, password=password)
            print(f"🔍 Authentication result: {user}")

            if user:
                print(
                    f"🔍 User found - is_active: {user.is_active}, "
                    f"is_staff: {user.is_staff}"
                )
                if not user.is_active:
                    return Response(
                        {"success": False, "error": "Account is disabled"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
                if not user.is_staff:
                    return Response(
                        {
                            "success": False,
                            "error": "User does not have admin privileges",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )

                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)

                # Update last_login manually to ensure it's tracked
                user.last_login = timezone.now()
                user.save(update_fields=["last_login"])

                # Log the admin login activity
                UserActivity.log_activity(
                    user,
                    action="login",
                    description=f"{user.name} logged in to admin panel",
                    request=request,
                )

                print(f"✅ Admin login successful: {user.email}")
                return Response(
                    {
                        "success": True,
                        "message": "Login successful",
                        "access": access_token,
                        "refresh": refresh_token,
                        "user": {
                            "id": user.id,
                            "username": user.email,
                            "email": user.email,
                            "name": user.name,
                            "is_superuser": user.is_superuser,
                            "is_staff": user.is_staff,
                        },
                    }
                )
            else:
                print(f"❌ Authentication failed for: {username}")
                return Response(
                    {"success": False, "error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except Exception as e:
            print(f"💥 Admin login error: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {"success": False, "error": "Server error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminRefreshAPIView(APIView):
    """Handle admin JWT token refresh."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        """Refresh admin JWT tokens."""
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"success": False, "error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate and refresh the token
            refresh = RefreshToken(refresh_token)
            user = refresh.user

            # Check if user is still staff/admin
            if not user.is_staff:
                return Response(
                    {"success": False, "error": "User no longer has admin privileges"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Generate new tokens
            new_refresh = RefreshToken.for_user(user)
            new_access_token = str(new_refresh.access_token)
            new_refresh_token = str(new_refresh)

            return Response(
                {
                    "success": True,
                    "access": new_access_token,
                    "refresh": new_refresh_token,
                }
            )

        except Exception as e:
            print(f"💥 Admin refresh error: {str(e)}")
            return Response(
                {"success": False, "error": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class AdminLogoutAPIView(APIView):
    """Handle admin logout via JSON API."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        """Log out current admin user."""
        try:
            print(f"🚪 Logout request received for user: {request.user}")
            print(f"🔍 User authenticated: {request.user.is_authenticated}")

            if request.user.is_authenticated:
                user = request.user
                # Update last_logout timestamp
                try:
                    user.last_logout = timezone.now()
                    user.save(update_fields=["last_logout"])
                except Exception as e:
                    print(f"⚠️ Failed to update last_logout: {e}")

                # Log the admin logout activity
                UserActivity.log_activity(
                    user,
                    action="logout",
                    description=f"{user.name} logged out from admin panel",
                    request=request,
                )

                print(f"✅ Admin logout successful: {user.email}")
                return Response({"success": True, "message": "Logout successful"})
            else:
                print("⚠️ Logout attempted but no user authenticated")
                return Response(
                    {"success": False, "error": "No user authenticated"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except Exception as e:
            print(f"💥 Admin logout error: {str(e)}")
            return Response(
                {"success": False, "error": "Server error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminStatsAPIView(APIView):
    """API endpoint for admin statistics"""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Get admin statistics."""
        try:
            # Get basic stats
            total_users = User.objects.count()
            total_courses = Course.objects.count()
            total_exams = Exam.objects.count()
            total_questions = Question.objects.count()
            total_results = ExamResult.objects.count()

            # Get active users (logged in within last 24 hours)
            active_users = User.objects.filter(
                last_login__gte=datetime.now() - timedelta(hours=24)
            ).count()

            # Get recent activity
            recent_activities = (
                []
            )  # For now, we'll use empty list since UserActivity is not a model

            # Get system health metrics
            system_health = self._get_system_health()

            return Response(
                {
                    "success": True,
                    "data": {
                        "total_users": total_users,
                        "total_courses": total_courses,
                        "total_exams": total_exams,
                        "total_questions": total_questions,
                        "total_results": total_results,
                        "active_users": active_users,
                        "user_info": {
                            "username": request.user.email,  # Use email as username
                            "email": request.user.email,
                            "name": request.user.name,
                            "is_superuser": request.user.is_superuser,
                        },
                        "recent_activities": [
                            {
                                "id": activity.id,
                                "user": (
                                    activity.user.name if activity.user else "System"
                                ),
                                "action": activity.action,
                                "description": activity.description,
                                "timestamp": activity.timestamp.isoformat(),
                            }
                            for activity in recent_activities
                        ],
                        "system_health": system_health,
                    },
                }
            )
        except Exception as e:
            print(f"💥 Admin stats error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to fetch statistics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _get_system_health(self):
        """Get comprehensive system health metrics."""
        try:
            # Get active users count
            active_users = User.objects.filter(
                last_login__gte=datetime.now() - timedelta(hours=24)
            ).count()

            # Database health check
            db_status = "operational"
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
            except Exception:
                db_status = "down"

            # API services health (basic check)
            api_status = "operational"
            try:
                # Check if we can access settings
                _ = settings.DEBUG
            except Exception:
                api_status = "down"

            # File storage health
            storage_status = "operational"
            try:
                # Check if we can write to media directory
                media_dir = getattr(settings, "MEDIA_ROOT", "/tmp")
                test_file = os.path.join(media_dir, "health_test.txt")
                with open(test_file, "w") as f:
                    f.write("health_check")
                os.remove(test_file)
            except Exception:
                storage_status = "degraded"

            # System metrics
            memory_usage = psutil.virtual_memory().percent
            cpu_usage = psutil.cpu_percent(interval=1)
            disk_usage = psutil.disk_usage("/").percent

            # Request metrics (simulated for now)
            total_requests = cache.get("total_requests", 0)
            error_requests = cache.get("error_requests", 0)
            error_rate = (
                (error_requests / total_requests * 100) if total_requests > 0 else 0
            )

            # Response time (simulated)
            response_time = cache.get("avg_response_time", 150)

            # Generate mock performance metrics for the last hour
            metrics = []
            now = datetime.now()
            for i in range(60):
                timestamp = now - timedelta(minutes=i)
                metrics.append(
                    {
                        "timestamp": timestamp.isoformat(),
                        "memory_usage": memory_usage + (i % 10 - 5),  # Vary by ±5%
                        "cpu_usage": cpu_usage + (i % 8 - 4),  # Vary by ±4%
                        "active_users": active_users + (i % 5 - 2),  # Vary by ±2
                        "requests_per_minute": 50 + (i % 20 - 10),  # Vary by ±10
                    }
                )

            return {
                "system_status": {
                    "database": db_status,
                    "api_services": api_status,
                    "file_storage": storage_status,
                    "memory_usage": memory_usage,
                    "cpu_usage": cpu_usage,
                    "disk_usage": disk_usage,
                    "active_users": active_users,
                    "total_requests": total_requests,
                    "error_rate": error_rate,
                    "response_time": response_time,
                },
                "metrics": metrics,
            }
        except Exception as e:
            print(f"💥 System health error: {str(e)}")
            return {
                "system_status": {
                    "database": "unknown",
                    "api_services": "unknown",
                    "file_storage": "unknown",
                    "memory_usage": 0,
                    "cpu_usage": 0,
                    "disk_usage": 0,
                    "active_users": 0,
                    "total_requests": 0,
                    "error_rate": 0,
                    "response_time": 0,
                },
                "metrics": [],
            }


class AdminRecentActivityAPIView(APIView):
    """Handle recent activity feed for admin dashboard"""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Return recent user activities"""
        try:
            print(f"📊 Recent activity request from user: {request.user}")

            # Get recent user activities based on real data
            recent_activities = []
            current_time = timezone.now()

            # Get recently logged in users (last 24 hours)
            recent_logins = User.objects.filter(
                last_login__gte=current_time - timezone.timedelta(days=1)
            ).order_by("-last_login")[:10]

            for user in recent_logins:
                recent_activities.append(
                    {
                        "id": f"login_{user.id}_{int(user.last_login.timestamp())}",
                        "user_name": user.name,
                        "user_email": user.email,
                        "action": "login",
                        "description": f"{user.name} logged into the system",
                        "timestamp": user.last_login.isoformat(),
                        "type": "authentication",
                        "severity": "info",
                    }
                )

            # Get recently created users (last 7 days)
            new_users = User.objects.filter(
                created_at__gte=current_time - timezone.timedelta(days=7)
            ).order_by("-created_at")[:5]

            for user in new_users:
                recent_activities.append(
                    {
                        "id": f"created_{user.id}_{int(user.created_at.timestamp())}",
                        "user_name": user.name,
                        "user_email": user.email,
                        "action": "user_created",
                        "description": f"New {user.role} account created: {user.name}",
                        "timestamp": user.created_at.isoformat(),
                        "type": "user_management",
                        "severity": "info",
                    }
                )

            # Get recently created courses (last 7 days)
            try:
                recent_courses = (
                    Course.objects.filter(
                        created_at__gte=current_time - timezone.timedelta(days=7)
                    )
                    .select_related("creator")
                    .order_by("-created_at")[:5]
                )

                for course in recent_courses:
                    recent_activities.append(
                        {
                            "id": f"course_{course.id}_{int(course.created_at.timestamp())}",
                            "user_name": (
                                course.creator.name if course.creator else "Unknown"
                            ),
                            "user_email": (
                                course.creator.email if course.creator else ""
                            ),
                            "action": "course_created",
                            "description": f"{course.creator.name if course.creator else 'Someone'} created course: {course.name} ({course.code})",
                            "timestamp": course.created_at.isoformat(),
                            "type": "course_management",
                            "severity": "info",
                        }
                    )
            except Exception as e:
                print(f"Could not fetch course activities: {e}")

            # Get recently created exams (last 7 days)
            try:
                recent_exams = (
                    Exam.objects.filter(
                        created_at__gte=current_time - timezone.timedelta(days=7)
                    )
                    .select_related("creator", "course")
                    .order_by("-created_at")[:5]
                )

                for exam in recent_exams:
                    course_name = exam.course.name if exam.course else "Unknown Course"
                    recent_activities.append(
                        {
                            "id": f"exam_{exam.id}_{int(exam.created_at.timestamp())}",
                            "user_name": (
                                exam.creator.name if exam.creator else "Unknown"
                            ),
                            "user_email": exam.creator.email if exam.creator else "",
                            "action": "exam_created",
                            "description": f"{exam.creator.name if exam.creator else 'Someone'} created exam: {exam.title} for {course_name}",
                            "timestamp": exam.created_at.isoformat(),
                            "type": "exam_management",
                            "severity": "info",
                        }
                    )
            except Exception as e:
                print(f"Could not fetch exam activities: {e}")

            # Get users who haven't logged in for a long time (potential security concern)
            inactive_users = User.objects.filter(
                is_active=True,
                last_login__lt=current_time - timezone.timedelta(days=30),
            ).exclude(last_login__isnull=True)[:3]

            for user in inactive_users:
                days_inactive = (current_time - user.last_login).days
                recent_activities.append(
                    {
                        "id": f"inactive_{user.id}_{int(user.last_login.timestamp())}",
                        "user_name": user.name,
                        "user_email": user.email,
                        "action": "inactive_user",
                        "description": f"User {user.name} inactive for {days_inactive} days",
                        "timestamp": user.last_login.isoformat(),
                        "type": "security",
                        "severity": "warning",
                    }
                )

            # Sort all activities by timestamp (most recent first)
            recent_activities.sort(key=lambda x: x["timestamp"], reverse=True)

            # Limit to top 20 activities
            recent_activities = recent_activities[:20]

            print(f"✅ Returning {len(recent_activities)} recent activities")

            # Return activities directly for test compatibility
            return Response(recent_activities)

        except Exception as e:
            print(f"💥 Admin recent activity error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to fetch recent activities"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminTestAPIView(APIView):
    """Simple test endpoint to verify admin routes work."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        """Test GET endpoint for admin API."""

        """Test GET endpoint for admin API."""
        return Response(
            {
                "success": True,
                "message": "Admin API is working!",
                "path": request.path,
                "method": request.method,
                "user": str(request.user) if request.user else "Anonymous",
            }
        )

    def post(self, request):
        """Test POST endpoint for admin API."""
        return Response(
            {
                "success": True,
                "message": "Admin POST API is working!",
                "data_received": request.data,
                "path": request.path,
                "method": request.method,
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class AdminUsersAPIView(APIView):
    """Handle user management."""

    """Handle user management."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        """Return list of users with filtering support."""
        try:
            print(f"📊 Users list request from user: {request.user}")
            # Get query parameters for filtering
            filter_type = request.GET.get("filter", "All Users")

            # Also handle direct is_active filtering for API tests
            is_active_param = request.GET.get("is_active")

            # Start with all users
            queryset = User.objects.all()

            # Apply direct is_active filtering if provided
            if is_active_param is not None:
                if is_active_param.lower() == "true":
                    queryset = queryset.filter(is_active=True)
                elif is_active_param.lower() == "false":
                    queryset = queryset.filter(is_active=False)
            # Apply filters based on filter_type
            elif filter_type == "Pending Approval":
                queryset = queryset.filter(is_active=False)
            elif filter_type == "Active":
                queryset = queryset.filter(is_active=True)
            elif filter_type == "Inactive":
                queryset = queryset.filter(is_active=False)
            elif filter_type == "Admins":
                queryset = queryset.filter(is_staff=True)
            elif filter_type == "Instructors":
                queryset = queryset.filter(role="instructor")
            elif filter_type == "Superusers":
                queryset = queryset.filter(is_superuser=True)
            # Order by creation date
            queryset = queryset.order_by("-created_at")
            # Serialize user data
            users_data = []
            current_time = timezone.now()
            for user in queryset:
                # Calculate user status with improved logic
                is_online = False
                is_offline = True
                is_inactive = False
                days_since_login = None
                if user.last_login:
                    time_since_login = current_time - user.last_login
                    days_since_login = time_since_login.days
                    # Check if user has logged out after their last login
                    if user.last_logout and user.last_logout > user.last_login:
                        # User has logged out after their last login, so they're offline
                        is_online = False
                        is_offline = True
                    else:
                        # User hasn't logged out since their last login
                        # They're online if logged in within last 15 minutes
                        if time_since_login.total_seconds() < 900:  # 15 minutes
                            is_online = True
                            is_offline = False
                        else:
                            # Logged in but been idle too long
                            is_online = False
                            is_offline = True
                    # User is inactive if not logged in for 7+ days
                    if days_since_login >= 7:
                        is_inactive = True
                        is_online = False
                user_data = {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "is_active": user.is_active,
                    "is_staff": user.is_staff,
                    "is_superuser": user.is_superuser,
                    "created_at": (
                        user.created_at.isoformat() if user.created_at else None
                    ),
                    "last_login": (
                        user.last_login.isoformat() if user.last_login else None
                    ),
                    "last_logout": (
                        user.last_logout.isoformat()
                        if hasattr(user, "last_logout") and user.last_logout
                        else None
                    ),
                    "is_online": is_online,
                    "is_offline": is_offline,
                    "is_inactive": is_inactive,
                    "days_since_login": days_since_login,
                }
                users_data.append(user_data)
            response_data = {
                "results": users_data,
                "count": len(users_data),
                "next": None,
                "previous": None,
            }
            print(f"✅ Returning {len(users_data)} users")
            return Response(response_data)
        except Exception as e:
            print(f"💥 Admin users list error: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {"success": False, "error": "Failed to fetch users"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Handle user creation and status updates."""

        """Handle user creation and status updates."""
        try:
            print(f"📝 POST request from user: {request.user}")
            print(f"🔍 User authenticated: {request.user.is_authenticated}")
            print(f"🔍 User is_staff: {getattr(request.user, 'is_staff', False)}")
            print(f"🔍 Request data: {request.data}")
            print(f"🔍 URL path: {request.path}")

            # Handle PII management endpoints
            if request.path.endswith("/bulk-archive/"):
                return self._bulk_archive_users(request)
            elif request.path.endswith("/bulk-delete/"):
                return self._bulk_user_action(request)  # Use existing bulk delete logic

            # Handle multiple formats for user operations
            # Format 1: User creation (has email and name)
            if "email" in request.data and "name" in request.data:
                return self._create_user(request)
            # Format 2: Bulk user operations (has user_ids and action)
            elif "user_ids" in request.data and "action" in request.data:
                return self._bulk_user_action(request)
            # Format 3: Single user action (has user_id and action - status updates)
            elif "user_id" in request.data and "action" in request.data:
                return self._update_user_status(request)
            # Format 4: Single user update (has user_id or id but no action)
            elif (
                "user_id" in request.data or "id" in request.data
            ) and "action" not in request.data:
                return self._update_single_user(request)
            # Format 5: Direct action with action field only
            elif "action" in request.data:
                return self._handle_action_request(request)
            # Unknown format
            else:
                return Response(
                    {
                        "success": False,
                        "error": (
                            "Invalid request format. Expected user creation "
                            "or status update data."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            print(f"💥 Admin users post error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to process request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request, user_id=None):
        """Handle user updates and PII management operations."""
        try:
            print(f"📝 PUT request from user: {request.user}")
            print(f"🔍 URL path: {request.path}")

            # Handle PII management endpoints
            if request.path.endswith("/archive/"):
                return self._archive_user(request, user_id)
            elif request.path.endswith("/export/"):
                return self._export_user_data(request, user_id)

            # Handle regular user updates
            return self._update_single_user(request)

        except Exception as e:
            print(f"💥 Admin users put error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to process request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _create_user(self, request):
        """Create a new user."""
        try:
            print(f"🔨 Creating user with data: {request.data}")
            email = request.data.get("email")
            name = request.data.get("name")
            password = request.data.get("password")
            role = request.data.get("role", "instructor")
            is_active = request.data.get("is_active", True)
            if not email or not name or not password:
                print(
                    f"❌ Missing required fields: "
                    f"email={bool(email)}, "
                    f"name={bool(name)}, "
                    f"password={bool(password)}"
                )
                return Response(
                    {
                        "success": False,
                        "error": "Email, name, and password are required",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                print(f"❌ User already exists: {email}")
                return Response(
                    {"success": False, "error": "User with this email already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Create the user
            user = User.objects.create_user(
                email=email,
                name=name,  # Use the single name field
                password=password,
                role=role,
                is_active=is_active,
            )
            print(f"✅ Created user: {user.email}")
            # Log the user creation activity
            UserActivity.log_activity(
                request.user,
                action="user_created",
                description=f"Created user account: {user.name} ({user.email})",
                request=request,
            )
            return Response(
                {
                    "success": True,
                    "message": "User created successfully",
                    "user_id": user.id,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            print(f"💥 User creation error: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {"success": False, "error": "Failed to create user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _update_user_status(self, request):
        """Handle user status updates (approve, activate, deactivate)."""
        try:
            user_id = request.data.get("user_id")
            action = request.data.get("action")

            if not user_id or not action:
                return Response(
                    {"success": False, "error": "user_id and action are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"success": False, "error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

            # Prevent admins from deactivating themselves or other admins/superusers
            if action == "deactivate":
                if user.id == request.user.id:
                    return Response(
                        {"success": False, "error": "Cannot deactivate yourself"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                if user.is_staff or user.is_superuser:
                    return Response(
                        {"success": False, "error": "Cannot deactivate admin users"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            # Update user status
            if action in ["approve", "activate"]:
                user.is_active = True
                # IMPORTANT: When admin activates a user, reset their last_login
                # This ensures they're not shown as "inactive" due to old login
                user.last_login = timezone.now()
                print(f"✅ Activating user {user.email} and resetting last_login")
            elif action == "deactivate":
                user.is_active = False
                print(f"❌ Deactivating user {user.email}")
            elif action == "delete":
                # Handle user deletion
                # Prevent admins from deleting themselves or other admins/superusers
                if user.id == request.user.id:
                    return Response(
                        {"success": False, "error": "You cannot delete yourself"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                if user.is_staff or user.is_superuser:
                    return Response(
                        {
                            "success": False,
                            "error": "Cannot delete admin or superuser accounts",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
                user.delete()
                # Log the user deletion activity
                UserActivity.log_activity(
                    request.user,
                    action="user_deleted",
                    description=f"Deleted user account: {user.name} ({user.email})",
                    request=request,
                )
                return Response(
                    {"success": True, "message": "User deleted successfully"}
                )
            else:
                return Response(
                    {"success": False, "error": f"Invalid action: {action}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.save()

            # Log the user status update activity
            UserActivity.log_activity(
                request.user,
                action=f"user_{action}",
                description=f"{action.title()}d user account: {user.name} ({user.email})",
                request=request,
            )

            # Return updated user data with recalculated status
            current_time = timezone.now()
            is_online = False
            is_offline = True
            is_inactive = False
            days_since_login = None

            if user.last_login:
                time_since_login = current_time - user.last_login
                days_since_login = time_since_login.days

                # Check if user has logged out after their last login
                if (
                    hasattr(user, "last_logout")
                    and user.last_logout
                    and user.last_logout > user.last_login
                ):
                    # User has logged out after their last login, so they're offline
                    is_online = False
                    is_offline = True
                else:
                    # User hasn't logged out since their last login
                    # They're online if logged in within last 15 minutes
                    if time_since_login.total_seconds() < 900:  # 15 minutes
                        is_online = True
                        is_offline = False
                    else:
                        # Logged in but been idle too long
                        is_online = False
                        is_offline = True

                # User is inactive if not logged in for 7+ days AND is_active is True
                if days_since_login >= 7 and user.is_active:
                    is_inactive = True
                    is_online = False

            # Return updated user data
            return Response(
                {
                    "success": True,
                    "message": f"User {action}d successfully",
                    "user": {
                        "id": user.id,
                        "is_active": user.is_active,
                        "email": user.email,
                        "name": user.name,
                        "last_login": (
                            user.last_login.isoformat() if user.last_login else None
                        ),
                        "is_online": is_online,
                        "is_offline": is_offline,
                        "is_inactive": is_inactive,
                        "days_since_login": days_since_login,
                    },
                }
            )
        except Exception as e:
            print(f"💥 Admin user update error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to update user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _update_single_user(self, request):
        """Handle single user profile updates."""
        try:
            # Get user_id from URL path parameter or request data
            target_user_id = (
                request.data.get("user_id")
                or request.data.get("id")
                or request.query_params.get("user_id")
            )
            if not target_user_id:
                return Response(
                    {"success": False, "error": "user_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                user = User.objects.get(id=target_user_id)
            except User.DoesNotExist:
                return Response(
                    {"success": False, "error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
            # Update user fields
            if "role" in request.data:
                role = request.data["role"]
                user.role = role  # Update the role field
                user.is_staff = role == "admin"
            if "is_active" in request.data:
                user.is_active = request.data["is_active"]
            if "name" in request.data:
                user.name = request.data["name"]  # Use the single name field
            if "email" in request.data:
                user.email = request.data["email"]
                user.username = request.data[
                    "email"
                ]  # Update username too since it's usually email
            user.save()
            # Log the user profile update activity
            UserActivity.log_activity(
                request.user,
                action="user_updated",
                description=f"Updated user profile: {user.name} ({user.email})",
                request=request,
            )
            return Response({"success": True, "message": "User updated successfully"})
        except Exception as e:
            print(f"💥 Admin user update error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to update user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, user_id=None):
        """Handle user deletion."""

        """Handle user deletion."""
        try:
            # Get user_id from URL path parameter or request data
            target_user_id = user_id or request.data.get("user_id")
            if not target_user_id:
                return Response(
                    {"success": False, "error": "user_id is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                user = User.objects.get(id=target_user_id)
                # Prevent admins from deleting themselves or other admins/superusers
                if user.id == request.user.id:
                    return Response(
                        {"success": False, "error": "You cannot delete yoursel"},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                if user.is_staff or user.is_superuser:
                    return Response(
                        {
                            "success": False,
                            "error": "Cannot delete admin or superuser accounts",
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
                user.delete()
                # Log the user deletion activity
                UserActivity.log_activity(
                    request.user,
                    action="user_deleted",
                    description=f"Deleted user account: {user.name} ({user.email})",
                    request=request,
                )
                return Response(
                    {"success": True, "message": "User deleted successfully"}
                )
            except User.DoesNotExist:
                return Response(
                    {"success": False, "error": "User not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        except Exception as e:
            print(f"💥 Admin user delete error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to delete user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _bulk_user_action(self, request):
        """Handle bulk user operations with user_ids and action."""
        try:
            user_ids = request.data.get("user_ids", [])
            action = request.data.get("action")
            print("🔍 Bulk action request: {action} for users {user_ids}")
            print(f"🔍 Current user ID: {request.user.id}")
            if not user_ids or not action:
                return Response(
                    {"success": False, "error": "user_ids and action are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            results = []
            for user_id in user_ids:
                try:
                    user = User.objects.get(id=user_id)
                    print(
                        (
                            "🔍 Processing user {user_id}: {user.email}, "
                            "is_staff: {user.is_staff}"
                        )
                    )
                    # Apply the action
                    if action == "activate":
                        user.is_active = True
                        user.save()
                        results.append(
                            {"user_id": user_id, "success": True, "action": action}
                        )
                    elif action == "deactivate":
                        # Check if trying to deactivate self
                        if user.id == request.user.id:
                            print(
                                "🚫 BLOCKED: User {user_id} "
                                "trying to deactivate themselves"
                            )
                            results.append(
                                {
                                    "user_id": user_id,
                                    "success": False,
                                    "error": "Cannot deactivate yourself",
                                }
                            )
                            continue
                        # Check if trying to deactivate admin/superuser
                        if user.is_staff or user.is_superuser:
                            print(f"🚫 BLOCKED: User {user_id} is admin/superuser")
                            results.append(
                                {
                                    "user_id": user_id,
                                    "success": False,
                                    "error": "Cannot deactivate admin/superuser",
                                }
                            )
                            continue
                        user.is_active = False
                        user.save()
                        results.append(
                            {"user_id": user_id, "success": True, "action": action}
                        )
                    else:
                        results.append(
                            {
                                "user_id": user_id,
                                "success": False,
                                "error": f"Unknown action: {action}",
                            }
                        )
                except User.DoesNotExist:
                    results.append(
                        {
                            "user_id": user_id,
                            "success": False,
                            "error": "User not found",
                        }
                    )
                except Exception as e:
                    results.append(
                        {"user_id": user_id, "success": False, "error": str(e)}
                    )
            # Check if any failures occurred for security test
            any_failed = any(not result.get("success", True) for result in results)
            if any_failed and action == "deactivate":
                print(f"🛡️ Some deactivation attempts blocked: {results}")
                return Response(
                    {
                        "success": False,
                        "message": "Bulk {action} operation had errors",
                        "results": results,
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response(
                {
                    "success": True,
                    "message": "Bulk {action} operation completed",
                    "results": results,
                }
            )
        except Exception as e:
            print(f"💥 Bulk user action error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to process bulk action"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _handle_action_request(self, request):
        """Handle direct action requests."""
        try:
            action = request.data.get("action")
            if not action:
                return Response(
                    {"success": False, "error": "action is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if action == "get_stats":
                return self._get_user_stats(request)
            else:
                return Response(
                    {"success": False, "error": f"Unknown action: {action}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            print(f"💥 Admin action request error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to process action"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _get_user_stats(self, request):
        """Get user statistics for admin dashboard."""
        try:
            total_users = User.objects.count()
            active_users = User.objects.filter(is_active=True).count()
            inactive_users = User.objects.filter(is_active=False).count()
            archived_users = User.objects.filter(is_archived=True).count()

            return Response(
                {
                    "success": True,
                    "stats": {
                        "total_users": total_users,
                        "active_users": active_users,
                        "inactive_users": inactive_users,
                        "archived_users": archived_users,
                    },
                }
            )
        except Exception as e:
            print(f"💥 User stats error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to get user statistics"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _archive_user(self, request, user_id):
        """Archive a user by anonymizing their PII."""
        try:
            user = User.objects.get(id=user_id)

            # Prevent archiving admins/superusers
            if user.is_staff or user.is_superuser:
                return Response(
                    {
                        "success": False,
                        "error": "Cannot archive admin or superuser accounts",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Prevent archiving yourself
            if user.id == request.user.id:
                return Response(
                    {"success": False, "error": "Cannot archive yourself"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Anonymize PII
            import secrets
            import string

            # Generate random tokens for anonymization
            def generate_anonymous_token():
                return "".join(
                    secrets.choice(string.ascii_letters + string.digits)
                    for _ in range(8)
                )

            # Store original data for audit purposes (in a separate field if needed)
            original_name = user.name
            original_email = user.email

            # Anonymize the user
            user.name = f"Anonymous_{generate_anonymous_token()}"
            user.email = f"anonymous_{generate_anonymous_token()}@archived.local"
            user.is_archived = True
            user.archived_at = timezone.now()
            user.archived_by = request.user
            user.is_active = False  # Prevent login

            user.save()

            # Log the archive activity
            UserActivity.log_activity(
                request.user,
                action="user_archived",
                description=f"Archived user account: {original_name} ({original_email}) - PII anonymized",
                request=request,
            )

            return Response(
                {
                    "success": True,
                    "message": "User archived successfully. PII has been anonymized.",
                    "user_id": user_id,
                }
            )

        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"💥 Archive user error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to archive user"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _export_user_data(self, request, user_id):
        """Export all user data for GDPR right of access."""
        try:
            user = User.objects.get(id=user_id)

            # Collect all user data
            user_data = {
                "user_info": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "is_active": user.is_active,
                    "is_archived": user.is_archived,
                    "created_at": (
                        user.created_at.isoformat() if user.created_at else None
                    ),
                    "last_login": (
                        user.last_login.isoformat() if user.last_login else None
                    ),
                    "last_logout": (
                        user.last_logout.isoformat() if user.last_logout else None
                    ),
                    "mfa_enabled": user.mfa_enabled,
                    "is_verified": user.is_verified,
                },
                "courses": [],
                "exams": [],
                "questions": [],
                "results": [],
                "activity_log": [],
            }

            # Get user's courses
            try:
                from courses.models import Course

                user_courses = Course.objects.filter(creator=user)
                user_data["courses"] = [
                    {
                        "id": course.id,
                        "name": course.name,
                        "code": course.code,
                        "created_at": (
                            course.created_at.isoformat() if course.created_at else None
                        ),
                        "last_edited": (
                            course.last_edited.isoformat()
                            if course.last_edited
                            else None
                        ),
                    }
                    for course in user_courses
                ]

                # Get student data from instructor's courses
                user_data["students"] = []
                for course in user_courses:
                    try:
                        from courses.models import Student

                        course_students = Student.objects.filter(course=course)
                        for student in course_students:
                            user_data["students"].append(
                                {
                                    "course_id": course.id,
                                    "course_name": course.name,
                                    "student_id": student.student_id,
                                    "name": student.name,
                                    "created_at": (
                                        student.created_at.isoformat()
                                        if student.created_at
                                        else None
                                    ),
                                    "is_anonymized": getattr(
                                        student, "is_anonymized", False
                                    ),
                                }
                            )
                    except ImportError:
                        pass
            except ImportError:
                pass

            # Get user's exams
            try:
                from exams.models import Exam

                user_exams = Exam.objects.filter(created_by=user)
                user_data["exams"] = [
                    {
                        "id": exam.id,
                        "title": exam.title,
                        "description": exam.description,
                        "created_at": (
                            exam.created_at.isoformat() if exam.created_at else None
                        ),
                        "is_published": getattr(exam, "is_published", False),
                    }
                    for exam in user_exams
                ]
            except ImportError:
                pass

            # Get user's questions
            try:
                from questions.models import Question

                user_questions = Question.objects.filter(created_by=user)
                user_data["questions"] = [
                    {
                        "id": question.id,
                        "text": question.text,
                        "created_at": (
                            question.created_at.isoformat()
                            if question.created_at
                            else None
                        ),
                        "bank": question.bank.title if question.bank else None,
                    }
                    for question in user_questions
                ]
            except ImportError:
                pass

            # Log the data export activity
            UserActivity.log_activity(
                request.user,
                action="data_exported",
                description=f"Exported user data for: {user.name} ({user.email}) - GDPR Right of Access",
                request=request,
            )

            return Response(
                {
                    "success": True,
                    "data": user_data,
                    "exported_at": timezone.now().isoformat(),
                    "exported_by": request.user.email,
                }
            )

        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"💥 Export user data error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to export user data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def _bulk_archive_users(self, request):
        """Bulk archive multiple users."""
        try:
            user_ids = request.data.get("user_ids", [])
            if not user_ids:
                return Response(
                    {"success": False, "error": "user_ids is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            results = []
            for user_id in user_ids:
                try:
                    result = self._archive_user(request, user_id)
                    results.append(
                        {
                            "user_id": user_id,
                            "success": result.status_code == 200,
                            "message": (
                                result.data.get("message", "Failed")
                                if result.status_code == 200
                                else result.data.get("error", "Unknown error")
                            ),
                        }
                    )
                except Exception as e:
                    results.append(
                        {
                            "user_id": user_id,
                            "success": False,
                            "message": f"Error: {str(e)}",
                        }
                    )

            return Response(
                {
                    "success": True,
                    "results": results,
                    "message": f"Processed {len(user_ids)} users",
                }
            )

        except Exception as e:
            print(f"💥 Bulk archive error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to process bulk archive"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminInstructorManagementAPIView(APIView):
    """Handle instructor management operations for admin users."""

    """Handle instructor management operations for admin users."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        """List all instructors with filtering options."""
        try:
            # Get query parameters for filtering
            is_active = request.GET.get("is_active")
            search = request.GET.get("search", "")

            # Base queryset for instructors
            instructors = User.objects.filter(role="instructor")

            # Apply filters
            if is_active is not None:
                is_active_bool = is_active.lower() == "true"
                instructors = instructors.filter(is_active=is_active_bool)

            if search:
                instructors = instructors.filter(
                    Q(name__icontains=search) | Q(email__icontains=search)
                )

            # Serialize instructor data
            instructor_data = []
            for instructor in instructors:
                instructor_data.append(
                    {
                        "id": instructor.id,
                        "email": instructor.email,
                        "name": instructor.name,
                        "role": instructor.role,
                        "is_active": instructor.is_active,
                        "is_staff": instructor.is_staff,
                        "is_superuser": instructor.is_superuser,
                        "date_joined": (
                            instructor.created_at.isoformat()
                            if instructor.created_at
                            else None
                        ),
                        "last_login": (
                            instructor.last_login.isoformat()
                            if instructor.last_login
                            else None
                        ),
                    }
                )

            return Response(
                {
                    "success": True,
                    "users": instructor_data,
                    "total": len(instructor_data),
                }
            )

        except Exception as e:
            print(f"💥 Error listing instructors: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to list instructors"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create a new instructor account."""

        """Create a new instructor account."""
        try:
            from django.core.exceptions import ValidationError as DjangoValidationError
            from django.core.validators import validate_email

            data = request.data
            email = data.get("email", "").strip()
            name = data.get("name", "").strip()
            password = data.get("password", "")
            role = data.get("role", "instructor")

            # Validation
            errors = {}

            # Required fields
            if not email:
                errors["email"] = ["Email is required"]
            if not name:
                errors["name"] = ["Name is required"]
            if not password:
                errors["password"] = ["Password is required"]

            # Email validation
            if email:
                try:
                    validate_email(email)
                except DjangoValidationError:
                    errors["email"] = ["Invalid email format"]

                # Check for duplicate email
                if User.objects.filter(email=email).exists():
                    errors["email"] = ["User with this email already exists"]

            # Password validation
            if password and len(password) < 8:
                errors["password"] = ["Password must be at least 8 characters long"]

            # Role validation
            if role not in ["instructor", "student"]:
                errors["role"] = ["Invalid role. Must be instructor or student"]

            if errors:
                return Response(
                    {"success": False, "error": "Validation failed", "errors": errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create the instructor
            instructor = User.objects.create_user(
                email=email,
                name=name,
                password=password,
                role="instructor",  # Force instructor role
                is_active=True,
                is_staff=False,
                is_superuser=False,
            )

            # Log activity
            UserActivity.log_activity(
                request.user,
                "user_created",
                f"Created instructor account: {instructor.name} ({instructor.email})",
                request,
            )

            return Response(
                {
                    "success": True,
                    "message": "Instructor created successfully",
                    "user": {
                        "id": instructor.id,
                        "email": instructor.email,
                        "name": instructor.name,
                        "role": instructor.role,
                        "is_active": instructor.is_active,
                        "is_staff": instructor.is_staff,
                        "is_superuser": instructor.is_superuser,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            print(f"💥 Error creating instructor: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to create instructor"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminInstructorDetailAPIView(APIView):
    """Handle individual instructor operations."""

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def patch(self, request, instructor_id):
        """Update an instructor account."""

        """Update an instructor account."""
        try:
            from django.core.exceptions import ValidationError as DjangoValidationError
            from django.core.validators import validate_email

            instructor = User.objects.get(id=instructor_id, role="instructor")
            data = request.data

            # Validation
            errors = {}

            if "email" in data:
                email = data["email"].strip()
                if email:
                    try:
                        validate_email(email)
                        # Check for duplicate email (excluding current user)
                        if (
                            User.objects.filter(email=email)
                            .exclude(id=instructor_id)
                            .exists()
                        ):
                            errors["email"] = ["User with this email already exists"]
                    except DjangoValidationError:
                        errors["email"] = ["Invalid email format"]

            if errors:
                return Response(
                    {"success": False, "error": "Validation failed", "errors": errors},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Update fields (prevent role escalation)
            safe_fields = ["name", "email"]
            for field in safe_fields:
                if field in data:
                    setattr(instructor, field, data[field])

            instructor.save()

            # Log activity
            UserActivity.log_activity(
                request.user,
                "user_updated",
                f"Updated instructor account: {instructor.name} ({instructor.email})",
                request,
            )

            return Response(
                {
                    "success": True,
                    "message": "Instructor updated successfully",
                    "user": {
                        "id": instructor.id,
                        "email": instructor.email,
                        "name": instructor.name,
                        "role": instructor.role,
                        "is_active": instructor.is_active,
                        "is_staff": instructor.is_staff,
                        "is_superuser": instructor.is_superuser,
                    },
                }
            )

        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "Instructor not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"💥 Error updating instructor: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to update instructor"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request, instructor_id):
        """Handle instructor-specific actions (deactivate/reactivate)."""
        try:
            instructor = User.objects.get(id=instructor_id, role="instructor")
            action = request.path.split("/")[-2]  # Get action from URL

            if action == "deactivate":
                instructor.is_active = False
                instructor.save()
                UserActivity.log_activity(
                    request.user,
                    "user_deactivated",
                    f"Deactivated instructor account: {instructor.name} ({instructor.email})",
                    request,
                )
                return Response(
                    {"success": True, "message": "Instructor deactivated successfully"}
                )

            elif action == "reactivate":
                instructor.is_active = True
                instructor.save()
                UserActivity.log_activity(
                    request.user,
                    "user_reactivated",
                    f"Reactivated instructor account: {instructor.name} ({instructor.email})",
                    request,
                )
                return Response(
                    {"success": True, "message": "Instructor reactivated successfully"}
                )

            return Response(
                {"success": False, "error": "Invalid action"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except User.DoesNotExist:
            return Response(
                {"success": False, "error": "Instructor not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"💥 Error performing instructor action: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to perform action"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminInstructorBulkAPIView(APIView):
    """Handle bulk operations on instructors."""

    """Handle bulk operations on instructors."""
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def post(self, request):
        """Handle bulk operations on instructors."""
        try:
            action = request.path.split("/")[-2]  # Get action from URL
            instructor_ids = request.data.get("instructor_ids", [])

            if not instructor_ids:
                return Response(
                    {"success": False, "error": "No instructor IDs provided"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            instructors = User.objects.filter(id__in=instructor_ids, role="instructor")

            if action == "bulk-deactivate":
                instructors.update(is_active=False)
                UserActivity.log_activity(
                    request.user,
                    "bulk_deactivate",
                    f"Bulk deactivated {len(instructor_ids)} instructors",
                    request,
                )
                return Response(
                    {
                        "success": True,
                        "message": f"Deactivated {instructors.count()} instructors",
                    }
                )

            return Response(
                {"success": False, "error": "Invalid bulk action"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            print(f"💥 Error performing bulk action: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to perform bulk action"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ═══════════════════════════════════════════════════════════════
# GLOBAL SETTINGS API VIEWS (UR 1.3)
# ═══════════════════════════════════════════════════════════════


class AdminGlobalSettingsAPIView(APIView):
    """
    Global Settings Management API
    Handles CRUD operations for system-wide configuration settings.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get all global settings organized by type"""
        try:
            print("ADMIN LOGIN: Global settings request received")

            # Get all settings organized by type
            settings = GlobalSetting.objects.all().order_by("setting_type", "name")
            serializer = GlobalSettingSerializer(settings, many=True)

            # Organize by type for easier frontend consumption
            organized_settings = {}
            for setting in serializer.data:
                setting_type = setting["setting_type"]
                if setting_type not in organized_settings:
                    organized_settings[setting_type] = []
                organized_settings[setting_type].append(setting)

            return Response(
                {
                    "success": True,
                    "settings": organized_settings,
                    "total_count": settings.count(),
                }
            )

        except Exception as e:
            print(f"ERROR: Global settings retrieval error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to retrieve settings"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create a new global setting"""
        try:
            print(
                f"ADMIN LOGIN: Creating new global setting: {request.data.get('name')}"
            )

            serializer = GlobalSettingSerializer(data=request.data)
            if serializer.is_valid():
                setting = serializer.save(
                    created_by=request.user, updated_by=request.user
                )

                UserActivity.log_activity(
                    request.user,
                    "create_setting",
                    f"Created global setting: {setting.name}",
                    request,
                )

                return Response(
                    {
                        "success": True,
                        "setting": GlobalSettingSerializer(setting).data,
                        "message": "Setting created successfully",
                    },
                    status=status.HTTP_201_CREATED,
                )

            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            print(f"ERROR: Setting creation error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to create setting"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminMarkingSchemesAPIView(APIView):
    """
    Marking Schemes Management API
    Handles CRUD operations for marking scheme configurations.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get all marking schemes"""
        try:
            print("ADMIN LOGIN: Marking schemes request received")

            schemes = MarkingScheme.objects.select_related("global_setting").all()
            serializer = MarkingSchemeSerializer(schemes, many=True)

            return Response(
                {
                    "success": True,
                    "marking_schemes": serializer.data,
                    "count": schemes.count(),
                }
            )

        except Exception as e:
            print(f"ERROR: Marking schemes retrieval error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to retrieve marking schemes"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create a new marking scheme"""
        try:
            print(f"ADMIN LOGIN: Creating marking scheme: {request.data.get('name')}")

            # Set created_by for the nested global_setting
            if "global_setting" in request.data:
                request.data["global_setting"]["created_by"] = request.user.id

            serializer = MarkingSchemeSerializer(data=request.data)
            if serializer.is_valid():
                scheme = serializer.save()

                UserActivity.log_activity(
                    request.user,
                    "create_marking_scheme",
                    f"Created marking scheme: {scheme.global_setting.name}",
                    request,
                )

                return Response(
                    {
                        "success": True,
                        "marking_scheme": MarkingSchemeSerializer(scheme).data,
                        "message": "Marking scheme created successfully",
                    },
                    status=status.HTTP_201_CREATED,
                )

            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            print(f"ERROR: Marking scheme creation error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to create marking scheme"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request, scheme_id=None):
        """Update an existing marking scheme"""
        try:
            if not scheme_id:
                scheme_id = request.data.get("id")

            print(f"ADMIN LOGIN: Updating marking scheme ID: {scheme_id}")

            scheme = MarkingScheme.objects.get(global_setting__id=scheme_id)
            serializer = MarkingSchemeSerializer(
                scheme, data=request.data, partial=True
            )

            if serializer.is_valid():
                scheme = serializer.save()
                scheme.global_setting.updated_by = request.user
                scheme.global_setting.save()

                UserActivity.log_activity(
                    request.user,
                    "update_marking_scheme",
                    f"Updated marking scheme: {scheme.global_setting.name}",
                    request,
                )

                return Response(
                    {
                        "success": True,
                        "marking_scheme": MarkingSchemeSerializer(scheme).data,
                        "message": "Marking scheme updated successfully",
                    }
                )

            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except MarkingScheme.DoesNotExist:
            return Response(
                {"success": False, "error": "Marking scheme not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"ERROR: Marking scheme update error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to update marking scheme"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminExamFormatsAPIView(APIView):
    """
    Exam Formats Management API
    Handles CRUD operations for exam format templates.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get all exam formats"""
        try:
            print("ADMIN LOGIN: Exam formats request received")

            formats = ExamFormat.objects.select_related("global_setting").all()
            serializer = ExamFormatSerializer(formats, many=True)

            return Response(
                {
                    "success": True,
                    "exam_formats": serializer.data,
                    "count": formats.count(),
                }
            )

        except Exception as e:
            print(f"ERROR: Exam formats retrieval error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to retrieve exam formats"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create a new exam format"""
        try:
            print(f"ADMIN LOGIN: Creating exam format: {request.data.get('name')}")

            # Set created_by for the nested global_setting
            if "global_setting" in request.data:
                request.data["global_setting"]["created_by"] = request.user.id

            serializer = ExamFormatSerializer(data=request.data)
            if serializer.is_valid():
                format_obj = serializer.save()

                UserActivity.log_activity(
                    request.user,
                    "create_exam_format",
                    f"Created exam format: {format_obj.global_setting.name}",
                    request,
                )

                return Response(
                    {
                        "success": True,
                        "exam_format": ExamFormatSerializer(format_obj).data,
                        "message": "Exam format created successfully",
                    },
                    status=status.HTTP_201_CREATED,
                )

            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            print(f"ERROR: Exam format creation error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to create exam format"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminCoursesOverviewAPIView(APIView):
    """
    Admin Courses Overview API
    Provides comprehensive view of all courses with creator information.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get all courses with creator and statistics info"""
        try:
            print("ADMIN LOGIN: Courses overview request received")

            # Get query parameters for filtering
            search = request.GET.get("search", "")
            creator_filter = request.GET.get("creator", "")
            term_filter = request.GET.get("term", "")

            # Base queryset
            courses = Course.objects.select_related("creator").all()

            # Apply filters
            if search:
                courses = courses.filter(
                    Q(name__icontains=search)
                    | Q(code__icontains=search)
                    | Q(description__icontains=search)
                )

            if creator_filter:
                courses = courses.filter(creator__id=creator_filter)

            if term_filter:
                courses = courses.filter(term__icontains=term_filter)

            # Order by creation date (newest first)
            courses = courses.order_by("-created_at")

            serializer = AdminCourseOverviewSerializer(courses, many=True)

            # Get summary statistics
            total_courses = Course.objects.count()
            active_courses = (
                Course.objects.filter(course_instructors__accepted=True)
                .distinct()
                .count()
            )

            return Response(
                {
                    "success": True,
                    "courses": serializer.data,
                    "statistics": {
                        "total_courses": total_courses,
                        "active_courses": active_courses,
                        "filtered_count": courses.count(),
                    },
                }
            )

        except Exception as e:
            print(f"ERROR: Courses overview error: {str(e)}")
            return Response(
                {"success": False, "error": "Failed to retrieve courses overview"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminExamsOverviewAPIView(APIView):
    """
    Admin Exams Overview API
    Provides comprehensive view of all exams with creator information.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get all exams with creator and course info"""
        try:
            print("🔍 ADMIN: Exams overview request received")

            # Get query parameters for filtering
            search = request.GET.get("search", "")
            course_filter = request.GET.get("course", "")
            creator_filter = request.GET.get("creator", "")

            # Base queryset with proper select_related to avoid N+1 queries
            exams = Exam.objects.select_related("course", "created_by").all()

            print(f"🔍 ADMIN: Found {exams.count()} total exams")

            # Apply filters
            if search:
                exams = exams.filter(
                    Q(title__icontains=search)
                    | Q(description__icontains=search)
                    | Q(course__name__icontains=search)
                    | Q(course__code__icontains=search)
                )
                print(f"🔍 ADMIN: After search filter: {exams.count()} exams")

            if course_filter:
                exams = exams.filter(course__id=course_filter)
                print(f"🔍 ADMIN: After course filter: {exams.count()} exams")

            if creator_filter:
                exams = exams.filter(created_by__id=creator_filter)
                print(f"🔍 ADMIN: After creator filter: {exams.count()} exams")

            # Order by creation date (newest first)
            exams = exams.order_by("-created_at")

            # Serialize the data
            serializer = AdminExamOverviewSerializer(exams, many=True)
            serialized_data = serializer.data

            print(f"🔍 ADMIN: Serialized {len(serialized_data)} exams")

            # Get summary statistics
            total_exams = Exam.objects.count()
            active_exams = Exam.objects.filter(scheduled_date__isnull=False).count()
            upcoming_exams = Exam.objects.filter(
                scheduled_date__gt=timezone.now()
            ).count()

            print(
                f"🔍 ADMIN: Statistics - Total: {total_exams}, Active: {active_exams}, Upcoming: {upcoming_exams}"
            )

            return Response(
                {
                    "success": True,
                    "exams": serialized_data,
                    "statistics": {
                        "total_exams": total_exams,
                        "active_exams": active_exams,
                        "upcoming_exams": upcoming_exams,
                        "filtered_count": exams.count(),
                    },
                }
            )

        except Exception as e:
            print(f"❌ ERROR: Exams overview error: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {
                    "success": False,
                    "error": f"Failed to retrieve exams overview: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminTemplatesAPIView(APIView):
    """
    Admin Templates Management API
    Provides comprehensive view and management of exam templates.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Get all templates with creator info"""
        try:
            print("🔍 ADMIN: Templates request received")

            # Get query parameters for filtering
            search = request.GET.get("search", "")
            creator_filter = request.GET.get("creator", "")

            # Base queryset
            templates = ExamTemplate.objects.select_related("created_by").all()

            print(f"🔍 ADMIN: Found {templates.count()} total templates")

            # Apply filters
            if search:
                templates = templates.filter(
                    Q(name__icontains=search) | Q(layout_data__icontains=search)
                )
                print(f"🔍 ADMIN: After search filter: {templates.count()} templates")

            if creator_filter:
                templates = templates.filter(created_by__id=creator_filter)
                print(f"🔍 ADMIN: After creator filter: {templates.count()} templates")

            # Order by creation date (newest first)
            templates = templates.order_by("-created_at")

            # Prepare template data for admin view
            template_data = []
            for template in templates:
                layout_data = template.layout_data
                template_info = {
                    "id": template.id,
                    "name": template.name,
                    "created_at": template.created_at,
                    "updated_at": template.updated_at,
                    "created_by": {
                        "id": template.created_by.id,
                        "name": template.created_by.name,
                        "email": template.created_by.email,
                    },
                    "is_default": getattr(template, "is_default", False),
                    "layout_data": layout_data,  # Return the full layout_data
                }
                template_data.append(template_info)

            print(f"🔍 ADMIN: Processed {len(template_data)} templates")

            # Get summary statistics
            total_templates = ExamTemplate.objects.count()
            default_templates = (
                ExamTemplate.objects.filter(is_default=True).count()
                if hasattr(ExamTemplate, "is_default")
                else 0
            )

            return Response(
                {
                    "success": True,
                    "templates": template_data,
                    "statistics": {
                        "total_templates": total_templates,
                        "default_templates": default_templates,
                        "filtered_count": templates.count(),
                    },
                }
            )

        except Exception as e:
            print(f"❌ ERROR: Templates overview error: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {
                    "success": False,
                    "error": f"Failed to retrieve templates overview: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create a new template or update default status"""
        try:
            action = request.data.get("action")

            if action == "create" or (not action and "name" in request.data):
                # Create new template
                name = request.data.get("name")
                layout_data = request.data.get("layout_data")
                created_by = request.user

                if not name or not layout_data:
                    return Response(
                        {
                            "success": False,
                            "error": "Name and layout_data are required",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                template = ExamTemplate.objects.create(
                    name=name, layout_data=layout_data, created_by=created_by
                )

                return Response(
                    {
                        "success": True,
                        "template": {
                            "id": template.id,
                            "name": template.name,
                            "created_by": {
                                "id": template.created_by.id,
                                "name": template.created_by.name,
                                "email": template.created_by.email,
                            },
                            "layout_data": template.layout_data,
                            "is_default": False,
                        },
                    }
                )

            elif action == "set_default":
                # Set template as default
                template_id = request.data.get("template_id")
                if not template_id:
                    return Response(
                        {"success": False, "error": "Template ID is required"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # First, unset all existing defaults
                ExamTemplate.objects.filter(is_default=True).update(is_default=False)

                # Set the new default
                template = ExamTemplate.objects.get(id=template_id)
                template.is_default = True
                template.save()

                return Response(
                    {
                        "success": True,
                        "message": f'Template "{template.name}" set as default',
                    }
                )

            else:
                return Response(
                    {"success": False, "error": "Invalid action"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            print(f"❌ ERROR: Template operation error: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {
                    "success": False,
                    "error": f"Failed to perform template operation: {str(e)}",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request, template_id=None):
        """Update a template"""
        try:
            template = ExamTemplate.objects.get(id=template_id)

            # Update template data
            if "name" in request.data:
                template.name = request.data["name"]

            if "layout_data" in request.data:
                template.layout_data = request.data["layout_data"]

            if "is_default" in request.data:
                # If setting as default, unset other defaults
                if request.data["is_default"]:
                    ExamTemplate.objects.filter(is_default=True).update(
                        is_default=False
                    )
                template.is_default = request.data["is_default"]

            template.save()

            return Response(
                {
                    "success": True,
                    "template": {
                        "id": template.id,
                        "name": template.name,
                        "created_by": {
                            "id": template.created_by.id,
                            "name": template.created_by.name,
                            "email": template.created_by.email,
                        },
                        "layout_data": template.layout_data,
                        "is_default": template.is_default,
                    },
                }
            )

        except ExamTemplate.DoesNotExist:
            return Response(
                {"success": False, "error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"❌ ERROR: Template update error: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {"success": False, "error": f"Failed to update template: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, template_id=None):
        """Delete a template"""
        try:
            template = ExamTemplate.objects.get(id=template_id)

            # Don't allow deletion of default template
            if template.is_default:
                return Response(
                    {
                        "success": False,
                        "error": "Cannot delete the default template. Please set another template as default first.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            template_name = template.name
            template.delete()

            return Response(
                {
                    "success": True,
                    "message": f'Template "{template_name}" deleted successfully',
                }
            )

        except ExamTemplate.DoesNotExist:
            return Response(
                {"success": False, "error": "Template not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            print(f"❌ ERROR: Template deletion error: {str(e)}")
            import traceback

            traceback.print_exc()
            return Response(
                {"success": False, "error": f"Failed to delete template: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminPrivacyAuditLogAPIView(APIView):
    """
    Privacy Audit Log API
    Handles creation and retrieval of privacy audit logs.
    """

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAdminUser]

    def get(self, request):
        """Retrieve privacy audit logs"""
        try:
            # Get logs with pagination
            page = int(request.GET.get("page", 1))
            page_size = int(request.GET.get("page_size", 50))

            logs = PrivacyAuditLog.objects.all()
            total_count = logs.count()

            # Apply pagination
            start = (page - 1) * page_size
            end = start + page_size
            logs = logs[start:end]

            serializer = PrivacyAuditLogSerializer(logs, many=True)

            return Response(
                {
                    "success": True,
                    "logs": serializer.data,
                    "total_count": total_count,
                    "page": page,
                    "page_size": page_size,
                }
            )

        except Exception as e:
            print(f"❌ ERROR: Privacy audit log retrieval error: {str(e)}")
            return Response(
                {"success": False, "error": f"Failed to retrieve audit logs: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def post(self, request):
        """Create a new privacy audit log entry"""
        try:
            action = request.data.get("action")
            description = request.data.get("description")
            user_email = request.data.get("user_email")
            admin_user = request.data.get("admin_user", "Admin User")

            if not action or not description:
                return Response(
                    {"success": False, "error": "Action and description are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create the audit log entry
            log_entry = PrivacyAuditLog.objects.create(
                action=action,
                description=description,
                admin_user=admin_user,
                user_email=user_email,
            )

            serializer = PrivacyAuditLogSerializer(log_entry)

            return Response({"success": True, "log": serializer.data})

        except Exception as e:
            print(f"❌ ERROR: Privacy audit log creation error: {str(e)}")
            return Response(
                {"success": False, "error": f"Failed to create audit log: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
