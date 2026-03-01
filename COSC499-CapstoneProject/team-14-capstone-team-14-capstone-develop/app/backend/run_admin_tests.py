#!/usr/bin/env python
"""
Admin Tests Runner for Django Backend
=====================================
Runs the comprehensive AdminGlobalConfig tests using SQLite for local testing.
"""

import os
import sys

import django
from django.conf import settings
from django.test.utils import get_runner


def run_tests():
    """Run the admin tests with proper Django setup"""

    # Set the settings module
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "test_settings")

    # Setup Django
    django.setup()

    # Get the test runner
    TestRunner = get_runner(settings)
    test_runner = TestRunner(verbosity=2, interactive=False, keepdb=False)

    # List of test modules to run
    test_modules = [
        "tests.test_admin_global_settings.GlobalSettingModelTest",
        "tests.test_admin_global_settings.AdminGlobalSettingsAPITest",
        "tests.test_admin_global_settings.AdminMarkingSchemesAPITest",
        "tests.test_admin_global_settings.AdminExamFormatsAPITest",
        "tests.test_admin_global_settings.AdminIntegrationTest",
    ]

    print("=" * 60)
    print("Running AdminGlobalConfig Backend Tests")
    print("=" * 60)
    print(f"Testing modules: {len(test_modules)} test suites")
    print()

    # Run the tests
    failures = test_runner.run_tests(test_modules)

    print()
    print("=" * 60)
    if failures:
        print(f"❌ Tests completed with {failures} failure(s)")
        print("=" * 60)
        return 1
    else:
        print("✅ All tests passed successfully!")
        print("=" * 60)
        return 0


if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)
