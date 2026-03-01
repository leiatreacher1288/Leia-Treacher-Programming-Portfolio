@echo off
echo Running Django tests inside Docker container with PostgreSQL...
echo.

cd %~dp0

REM Navigate to root directory  
cd ..\..

echo Running tests inside the backend container...
docker-compose exec backend python manage.py test %*

echo.
echo Tests completed!
pause
