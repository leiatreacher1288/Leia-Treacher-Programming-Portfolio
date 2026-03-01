from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import resolve, reverse
from rest_framework.test import APIClient

from courses.models import Course, CourseInstructor, Student
from exams.models import Exam, Variant
from results.models import ExamResult

User = get_user_model()


class ResultsExportDebugTest(TestCase):
    """
    Comprehensive test to debug the results export functionality
    """

    def setUp(self):
        """Set up test data"""
        # Create user - matching working test pattern
        self.user = User.objects.create_user(
            email="test@example.com", name="Test Instructor", password="testpass123"
        )

        # Create course - REMOVED 'year' field
        self.course = Course.objects.create(
            code="TEST101",
            name="Test Course",
            # Remove term and year - add any other required fields your Course model needs
        )

        # Make user an instructor
        self.instructor = CourseInstructor.objects.create(
            course=self.course, user=self.user, accepted=True
        )

        # Create exam
        self.exam = Exam.objects.create(
            title="Test Exam",
            course=self.course,
            exam_type="multiple_choice",
            created_by=self.user,
        )

        # Create variant
        self.variant = Variant.objects.create(exam=self.exam, version_label="A")

        # Create student - matching working test pattern
        self.student = Student.objects.create(
            course=self.course, student_id="S12345", name="Test Student", is_active=True
        )

        # Create exam result
        self.result = ExamResult.objects.create(
            exam=self.exam,
            student=self.student,
            variant=self.variant,
            score=85.5,
            correct_answers=17,
            incorrect_answers=3,
            unanswered=0,
            raw_responses={"1": "A", "2": "B", "3": "C"},
            total_questions=20,
        )

        # API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_debug_url_patterns(self):
        """Debug: Print all URL patterns related to results"""
        print("\n" + "=" * 80)
        print("DEBUG: URL PATTERNS TEST")
        print("=" * 80)

        # Try to import and check views
        try:
            pass

            print("✓ ExamResultsExportView imported successfully")
        except ImportError as e:
            print(f"✗ Failed to import ExamResultsExportView: {e}")

        try:
            pass

            print("✓ ResultExportView imported successfully")
        except ImportError as e:
            print(f"✗ Failed to import ResultExportView: {e}")

        try:
            pass

            print("✓ SimpleExportView imported successfully")
        except ImportError as e:
            print(f"✗ Failed to import SimpleExportView: {e}")

        # Check URL patterns
        print("\n" + "-" * 40)
        print("Checking URL resolution:")

        # List of URLs to test
        test_urls = [
            f"/api/results/export/{self.exam.id}/",
            f"/api/results/export/{self.exam.id}/?format=csv",
            f"/api/results/instructor/exams/{self.exam.id}/results/export/",
            f"/results/export/{self.exam.id}/",
        ]

        for url in test_urls:
            try:
                resolved = resolve(url)
                print(f"\n✓ URL resolves: {url}")
                print(f"  View: {resolved.func.__module__}.{resolved.func.__name__}")
                print(f"  URL name: {resolved.url_name}")
                print(f"  Namespace: {resolved.namespace}")
                print(f"  Route: {resolved.route}")
            except Exception as e:
                print(f"\n✗ URL does not resolve: {url}")
                print(f"  Error: {type(e).__name__}: {e}")

    def test_export_endpoint_authentication(self):
        """Test authentication requirements"""
        print("\n" + "=" * 80)
        print("DEBUG: AUTHENTICATION TEST")
        print("=" * 80)

        # Test without authentication
        self.client.logout()
        url = f"/api/results/export/{self.exam.id}/"

        print(f"\nTesting URL without auth: {url}")
        response = self.client.get(url)
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")

        if response.status_code == 404:
            print("✗ Got 404 - URL pattern not found!")
        elif response.status_code == 401:
            print("✓ Got 401 - Authentication required (good)")
        elif response.status_code == 403:
            print("✓ Got 403 - Permission denied (good)")
        else:
            print(f"? Unexpected status code: {response.status_code}")

    def test_export_endpoint_with_auth(self):
        """Test the export endpoint with authentication"""
        print("\n" + "=" * 80)
        print("DEBUG: EXPORT ENDPOINT TEST")
        print("=" * 80)

        # Re-authenticate
        self.client.force_authenticate(user=self.user)

        # Test different URL patterns
        urls_to_test = [
            (f"/api/results/export/{self.exam.id}/", "Simple export URL"),
            (f"/api/results/export/{self.exam.id}/?format=csv", "With format param"),
            (
                f"/api/results/instructor/exams/{self.exam.id}/results/export/",
                "Instructor URL",
            ),
        ]

        for url, description in urls_to_test:
            print(f"\nTesting: {description}")
            print(f"URL: {url}")

            response = self.client.get(url)

            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.get('Content-Type', 'Not set')}")

            if response.status_code == 200:
                print("✓ Success!")
                if "text/csv" in response.get("Content-Type", ""):
                    print("✓ Returns CSV content")
                    # Print first 200 chars of content
                    content = response.content.decode("utf-8")[:200]
                    print(f"Content preview: {content}")
                elif "application/zip" in response.get("Content-Type", ""):
                    print("✓ Returns ZIP content")
                    print(f"Content size: {len(response.content)} bytes")
            elif response.status_code == 404:
                print("✗ 404 Not Found - URL pattern doesn't exist")
                # Try to get error details
                try:
                    if hasattr(response, "data"):
                        print(f"Error data: {response.data}")
                    else:
                        content = response.content.decode("utf-8")
                        print(f"Error content: {content}")
                except Exception:
                    pass
            else:
                print(f"✗ Unexpected status: {response.status_code}")
                try:
                    content = response.content.decode("utf-8")
                    print(f"Response: {content}")
                except UnicodeDecodeError as e:  # Specific catch for decode errors
                    print(f"Decoding error: {str(e)}")
                except Exception as e:  # Catch any other unexpected exceptions
                    print(f"Unexpected error: {str(e)}")

    def test_direct_view_call(self):
        """Test calling the view directly to bypass URL routing issues"""
        print("\n" + "=" * 80)
        print("DEBUG: DIRECT VIEW CALL TEST")
        print("=" * 80)

        # Try to import and call views directly
        views_to_test = [
            ("results.views.ExamResultsExportView", "ExamResultsExportView"),
            ("results.views.ResultExportView", "ResultExportView"),
            ("results.views.SimpleExportView", "SimpleExportView"),
        ]

        for view_path, view_name in views_to_test:
            print(f"\nTesting {view_name}:")
            try:
                module_path, class_name = view_path.rsplit(".", 1)
                module = __import__(module_path, fromlist=[class_name])
                ViewClass = getattr(module, class_name)

                print(f"✓ Successfully imported {view_name}")

                # Create a mock request
                from rest_framework.test import APIRequestFactory

                factory = APIRequestFactory()
                request = factory.get(f"/fake/url/{self.exam.id}/", {"format": "csv"})
                request.user = self.user

                # Instantiate and call the view
                view = ViewClass()
                view.request = request
                view.format_kwarg = None
                view.args = ()
                view.kwargs = {"exam_id": self.exam.id}

                try:
                    response = view.get(request, exam_id=self.exam.id)
                    print("✓ View executed successfully")
                    print(f"  Response type: {type(response)}")
                    print(
                        f"  Status: {getattr(response, 'status_code', 'No status code')}"
                    )
                    if hasattr(response, "content"):
                        print(f"  Content length: {len(response.content)} bytes")
                except Exception as e:
                    print(f"✗ View execution failed: {type(e).__name__}: {e}")
                    import traceback

                    traceback.print_exc()

            except Exception as e:
                print(f"✗ Failed to import {view_name}: {type(e).__name__}: {e}")

    def test_url_reverse(self):
        """Test URL reversing"""
        print("\n" + "=" * 80)
        print("DEBUG: URL REVERSE TEST")
        print("=" * 80)

        url_names = [
            "results-export",
            "simple-export",
            "results:results-export",  # with namespace
            "results:simple-export",  # with namespace
        ]

        for name in url_names:
            try:
                url = reverse(name, kwargs={"exam_id": self.exam.id})
                print(f"✓ Reversed '{name}' -> {url}")
            except Exception as e:
                print(f"✗ Failed to reverse '{name}': {type(e).__name__}: {e}")

    def test_check_installed_apps(self):
        """Check if results app is properly installed"""
        print("\n" + "=" * 80)
        print("DEBUG: INSTALLED APPS CHECK")
        print("=" * 80)

        from django.conf import settings

        if "results" in settings.INSTALLED_APPS:
            print("✓ 'results' is in INSTALLED_APPS")
        else:
            print("✗ 'results' is NOT in INSTALLED_APPS!")

        # Check URL configuration
        print("\nChecking ROOT_URLCONF...")
        print(f"ROOT_URLCONF = {settings.ROOT_URLCONF}")

        # Try to import the root URLconf
        try:
            root_urls = __import__(settings.ROOT_URLCONF, fromlist=["urlpatterns"])
            print("✓ Successfully imported root URLconf")

            # Check if results URLs are included
            print("\nSearching for results URL inclusion...")
            for pattern in root_urls.urlpatterns:
                pattern_str = str(pattern)
                if "results" in pattern_str:
                    print(f"✓ Found results pattern: {pattern_str}")

        except Exception as e:
            print(f"✗ Failed to import root URLconf: {e}")
