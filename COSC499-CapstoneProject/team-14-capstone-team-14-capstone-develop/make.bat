@echo off
setlocal

if "%1"=="" goto help
if /i "%1"=="build" goto build
if /i "%1"=="up" goto up
if /i "%1"=="test" goto test-back
if /i "%1"=="test-frontend" goto test-frontend
if /i "%1"=="test-all" goto test-all
if /i "%1"=="coverage-all" goto coverage-all
if /i "%1"=="migrate" goto migrate
if /i "%1"=="down" goto down
if /i "%1"=="down-volumes" goto down-volumes
if /i "%1"=="help" goto help

echo Unknown command: %1
goto help

:build
echo Building containers...
docker-compose build
goto end

:up
echo Starting services...
docker-compose up -d
goto end

:test-back
echo Running backend tests...
docker-compose exec backend python manage.py test
goto end

:test-frontend
echo Running frontend tests...
cd app\frontend
npx vitest run
cd ..\..
goto end

:test-all
echo Running all tests (backend + frontend)...
docker-compose exec backend python manage.py test
cd app\frontend
npx vitest run
cd ..\..
goto end

:coverage-all
echo Running all tests with coverage (backend + frontend)...
docker-compose exec backend sh -c "coverage run --source='.' manage.py test && coverage report"
cd app\frontend
npx vitest run --coverage
cd ..\..
goto end

:migrate
echo Running migrations...
docker-compose exec backend python manage.py migrate
goto end

:down
echo Stopping services...
docker-compose down
goto end

:down-volumes
echo WARNING: This will delete all data!
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    docker-compose down --volumes
)
goto end

:help
echo.
echo ExamVault Development Commands
echo.
echo Usage: make ^<command^>
echo.
echo   build          - Build Docker containers
echo   up             - Start all services
echo   test           - Run backend tests
echo   test-frontend  - Run frontend tests
echo   test-all       - Run backend + frontend tests
echo   coverage-all   - Run all tests with coverage (backend + frontend)
echo   migrate        - Run Django migrations
echo   down           - Stop all services
echo   down-volumes   - Stop services and remove volumes (deletes data!)
echo   help           - Show this help message
echo.

:end
endlocal
