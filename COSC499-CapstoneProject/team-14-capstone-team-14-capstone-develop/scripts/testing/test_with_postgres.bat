@echo off
echo Running Django tests with PostgreSQL settings...
echo.

REM Verify PostgreSQL connection first
echo Verifying PostgreSQL connection...
call %~dp0check_postgres_connection.bat
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Connection verification failed! Please fix the connection issues first.
  goto :end
)

cd %~dp0app\backend

REM Set environment variables for Django
set DJANGO_SETTINGS_MODULE=examvault.test_settings

echo.
echo Running tests: %*
echo If no tests are specified, all tests will run.
echo.

REM Run the tests
python manage.py test %*

echo.
echo Tests completed!

:end
pause
