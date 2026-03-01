#!/usr/bin/env python3
"""
Direct Django Export Test
Tests export functionality directly through Django views without HTTP requests.
"""

import os
import sys

import django
from django.test import RequestFactory

from analytics.views import DebugCSVExportView, DebugDOCXExportView, DebugPDFExportView

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "examvault.settings")
django.setup()


def test_direct_export_functionality():
    """Test export functionality directly through Django views"""
    print("🔍 Direct Django Export Testing")
    print("=" * 50)

    # Create a request factory
    factory = RequestFactory()

    tests = [
        {
            "name": "PDF Export",
            "view_class": DebugPDFExportView,
            "expected_type": "application/pdf",
            "file_ext": "pdf",
        },
        {
            "name": "DOCX Export",
            "view_class": DebugDOCXExportView,
            "expected_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "file_ext": "docx",
        },
        {
            "name": "CSV Export",
            "view_class": DebugCSVExportView,
            "expected_type": "text/csv",
            "file_ext": "csv",
        },
    ]

    results = []

    for test in tests:
        print(f"\n📋 Testing {test['name']}...")

        try:
            # Create a GET request
            request = factory.get("/debug/")

            # Create view instance and call it
            view = test["view_class"]()
            response = view.get(request)

            if hasattr(response, "status_code") and response.status_code == 200:
                content_type = response.get("Content-Type", "")

                # Get content length
                if hasattr(response, "content"):
                    content_length = len(response.content)
                    content = response.content
                elif hasattr(response, "getvalue"):
                    content = response.getvalue()
                    content_length = len(content)
                else:
                    content_length = 0
                    content = b""

                # Verify content type
                type_match = test["expected_type"] in content_type

                # Verify content exists
                has_content = content_length > 0

                # Save file for verification
                filename = f"direct_export_test.{test['file_ext']}"
                if content:
                    with open(filename, "wb") as f:
                        f.write(content)

                print(f"  ✅ Status: 200 OK")
                print(f"  ✅ Content-Type: {content_type}")
                print(f"  ✅ Size: {content_length} bytes")
                print(f"  ✅ File saved: {filename}")

                success = type_match and has_content
                if success:
                    print(f"  🎉 {test['name']} export WORKING!")
                else:
                    print(f"  ❌ {test['name']} export has issues")

                results.append({"name": test["name"], "success": success})

            else:
                if hasattr(response, "status_code"):
                    print(f"  ❌ Status: {response.status_code}")
                else:
                    print(f"  ❌ Unexpected response type: {type(response)}")

                if hasattr(response, "data"):
                    print(f"  ❌ Error: {response.data}")

                results.append({"name": test["name"], "success": False})

        except Exception as e:
            print(f"  ❌ Exception: {str(e)}")
            import traceback

            traceback.print_exc()
            results.append({"name": test["name"], "success": False})

    # Summary
    print("\n" + "=" * 50)
    print("📊 DIRECT EXPORT FUNCTIONALITY SUMMARY")
    print("=" * 50)

    passed = sum(1 for r in results if r["success"])
    total = len(results)

    for result in results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['name']} Export")

    print(f"\n📈 Results: {passed}/{total} export types working")

    if passed == total:
        print("\n🎉 ALL EXPORT FUNCTIONALITY IS WORKING!")
        print("✅ PDF exports: FUNCTIONAL")
        print("✅ DOCX exports: FUNCTIONAL")
        print("✅ CSV exports: FUNCTIONAL")
        print("\n💡 Your export system is ready for production use!")
        return True
    else:
        print(f"\n⚠️  {total - passed} export types have issues")
        return False


def verify_django_setup():
    """Verify Django setup is working"""
    try:
        from courses.models import Course, Student

        print(f"✅ Django setup successful")
        print(f"📊 Courses: {Course.objects.count()}")
        print(f"👥 Students: {Student.objects.count()}")
        return True
    except Exception as e:
        print(f"❌ Django setup failed: {str(e)}")
        return False


def main():
    print("🚀 Direct Django Export Test")
    print("=" * 50)

    # Check Django setup first
    if not verify_django_setup():
        print("❌ Django environment is not properly configured.")
        return False

    # Test export functionality
    export_success = test_direct_export_functionality()

    if export_success:
        print("\n🏆 SUCCESS: All export functionality is working correctly!")
        print("📁 Check the generated direct_export_test.* files to verify quality.")
    else:
        print("\n⚠️  Some export functionality needs attention.")

    return export_success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
