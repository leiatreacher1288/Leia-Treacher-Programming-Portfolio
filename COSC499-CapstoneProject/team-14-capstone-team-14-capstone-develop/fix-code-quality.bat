@echo off
echo 🔧 Starting Code Quality Fixes...

set SCRIPT_DIR=%~dp0
echo 📁 Working from: %SCRIPT_DIR%

echo 🎨 Fixing Frontend Issues...
cd /d "%SCRIPT_DIR%app\frontend"

if exist package.json (
    echo 📦 Running ESLint fixes...
    call npm run lint:fix
    
    echo 💅 Running Prettier formatting...
    call npm run format
    
    echo ✅ Frontend fixes completed
) else (
    echo ❌ package.json not found in app\frontend
)

echo 🐍 Fixing Backend Issues...
cd /d "%SCRIPT_DIR%app\backend"

if exist manage.py (
    echo 🔧 Running Black formatter...
    python -m black . --line-length=88
    
    echo 📋 Running isort...
    python -m isort . --profile black
    
    echo 🔍 Running Flake8 check...
    python -m flake8 . --max-line-length=88 --extend-ignore=E203,W503 --exclude=migrations,node_modules
    
    echo ✅ Backend fixes completed
) else (
    echo ❌ manage.py not found in app\backend
)

cd /d "%SCRIPT_DIR%"
echo 🎉 Code quality fixes applied!
echo.
echo 💡 Next steps:
echo   1. Review the changes made
echo   2. Test your application locally
echo   3. Commit the fixes: git add . ^&^& git commit -m "Fix code quality issues"
echo   4. Push to trigger CI/CD: git push
echo.
pause