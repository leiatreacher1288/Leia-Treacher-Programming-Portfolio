@echo off
echo =======================================
echo ExamVault Backend Test Commands
echo =======================================
echo.

echo Available commands:
echo.
echo 1. Health Check:
echo    python tests\health_check.py
echo.
echo 2. System Check:
echo    python manage.py check --settings=examvault.test_settings
echo.
echo 3. Quick User Tests:
echo    python manage.py test users.tests --settings=examvault.test_settings --verbosity=1
echo.
echo 4. Course Tests:
echo    python manage.py test courses.tests --settings=examvault.test_settings --verbosity=1
echo.
echo 5. Full Test Suite:
echo    python manage.py test --settings=examvault.test_settings --verbosity=1
echo.
echo 6. Specific Test App (replace 'users' with desired app):
echo    python manage.py test users --settings=examvault.test_settings
echo.
echo 7. Admin Tests (from organized tests directory):
echo    python tests\test_admin_api.py
echo.

if "%1"=="health" (
    echo Running health check...
    python tests\health_check.py
) else if "%1"=="check" (
    echo Running system check...
    python manage.py check --settings=examvault.test_settings
) else if "%1"=="users" (
    echo Running user tests...
    python manage.py test users.tests --settings=examvault.test_settings --verbosity=1
) else if "%1"=="courses" (
    echo Running course tests...
    python manage.py test courses.tests --settings=examvault.test_settings --verbosity=1
) else if "%1"=="full" (
    echo Running full test suite...
    python manage.py test --settings=examvault.test_settings --verbosity=1
) else if "%1"=="admin" (
    echo Running admin tests...
    python tests\AdminTestSuite.py
) else (
    echo.
    echo Usage: test-commands.bat [health^|check^|users^|courses^|full^|admin]
    echo.
    echo No parameter provided. Running health check by default...
    python tests\health_check.py
)

echo.
pause
