#!/usr/bin/env python3
"""
Backend Admin Test Runner
========================
Runs Django admin tests specifically for the approve/deactivate functionality.
Usage:
    # From backend directory:
    python run_admin_tests.py
    # Or via Docker:
    docker-compose exec backend python run_admin_tests.py
"""
import os
import sys

import django
from django.core.management import execute_from_command_line


def run_admin_tests():
    """Run admin-specific tests"""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "examvault.settings")
    django.setup()
    print("🧪 Running Backend Admin Tests")
    print("=" * 40)
    # Test discovery and execution
    test_commands = [
        "manage.py",
        "test",
        "tests.test_admin_api",
        "--verbosity=2",
        "--keepdb",  # Keep test database for faster repeated runs
    ]
    try:
        execute_from_command_line(test_commands)
        print("\n✅ Admin tests completed successfully!")
        return True
    except SystemExit as e:
        if e.code == 0:
            print("\n✅ Admin tests completed successfully!")
            return True
        else:
            print(f"\n❌ Admin tests failed with exit code: {e.code}")
            return False
    except Exception as e:
        print(f"\n❌ Error running tests: {e}")
        return False


def run_specific_test(test_name):
    """Run a specific test method"""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "examvault.settings")
    django.setup()
    print(f"🎯 Running specific test: {test_name}")
    print("=" * 40)
    test_commands = [
        "manage.py",
        "test",
        f"tests.test_admin_api.AdminAPITestCase.{test_name}",
        "--verbosity=2",
    ]
    try:
        execute_from_command_line(test_commands)
        return True
    except SystemExit as e:
        return e.code == 0
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False


def run_approve_deactivate_tests():
    """Run tests specifically for approve/deactivate functionality"""
    print("🎯 Testing Approve/Deactivate Functionality")
    print("=" * 50)
    specific_tests = [
        "test_user_approval",
        "test_user_deactivation",
        "test_complete_user_approval_workflow",
        "test_invalid_user_action",
        "test_permission_boundaries",
    ]
    all_passed = True
    for test in specific_tests:
        print(f"\n📋 Running: {test}")
        if not run_specific_test(test):
            all_passed = False
            print(f"❌ {test} failed")
        else:
            print(f"✅ {test} passed")
    return all_passed


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run backend admin tests")
    parser.add_argument(
        "--specific",
        choices=["approve-deactivate", "auth", "permissions", "all"],
        default="all",
        help="Run specific test category",
    )
    args = parser.parse_args()
    if args.specific == "approve-deactivate":
        success = run_approve_deactivate_tests()
    elif args.specific == "auth":
        success = run_specific_test(
            "test_admin_authentication_success"
        ) and run_specific_test("test_admin_authentication_failure")
    elif args.specific == "permissions":
        success = run_specific_test("test_permission_boundaries") and run_specific_test(
            "test_instructor_cannot_access_admin_endpoints"
        )
    else:
        success = run_admin_tests()
    sys.exit(0 if success else 1)
