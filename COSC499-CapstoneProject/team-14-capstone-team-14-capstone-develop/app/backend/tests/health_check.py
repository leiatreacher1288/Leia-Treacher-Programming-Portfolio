#!/usr/bin/env python
"""
Quick backend health check after test file reorganization
"""
import os
import subprocess
import sys


def run_test_check():
    """Run a quick test to verify backend functionality"""
    print("🔍 Backend Test Status Check")
    print("=" * 50)

    # Check if we're in the right directory
    if not os.path.exists("manage.py"):
        print("❌ Error: Not in Django backend directory")
        return False

    # Set test settings for local testing
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "examvault.test_settings")

    # Run basic Django check
    print("🔧 Running Django system check...")
    result = subprocess.run(
        [sys.executable, "manage.py", "check", "--settings=examvault.test_settings"],
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        print("✅ Django system check passed")
    else:
        print("❌ Django system check failed:")
        print(result.stderr)
        return False

    # Run a quick test subset
    print("🧪 Running quick test subset...")
    result = subprocess.run(
        [
            sys.executable,
            "manage.py",
            "test",
            "users.tests",
            "--settings=examvault.test_settings",
            "--verbosity=0",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        print("✅ Core user tests passed")
        print("📊 Test file organization successful!")
        return True
    else:
        print("❌ Some tests failed:")
        print(result.stderr)
        return False


if __name__ == "__main__":
    success = run_test_check()
    print("\n" + "=" * 50)
    if success:
        print("🎉 Backend health check PASSED")
        print("✅ Test file reorganization successful")
    else:
        print("⚠️  Backend health check issues detected")

    sys.exit(0 if success else 1)
