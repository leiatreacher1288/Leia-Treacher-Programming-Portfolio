# ExamVault Troubleshooting Guide

This guide provides solutions for common issues encountered while working with ExamVault, with platform-specific commands for Windows and macOS/Linux.

## 🚨 Common Issues & Solutions

### Import Errors

**Problem:** Missing Python packages or dependencies

**Windows:**
```batch
# Install missing package in Docker container
docker-compose exec backend pip install package_name

# Example: Install pytst
docker-compose exec backend pip install pytest

# Update requirements.txt
docker-compose exec backend pip freeze > requirements.txt
```

**macOS/Linux:**
```bash
# Install missing package in Docker container
docker-compose exec backend pip install package_name

# Example: Install pandas
docker-compose exec backend pip install pytest

# Update requirements.txt
docker-compose exec backend pip freeze > requirements.txt
```

**Common Missing Packages:**
- `nivo@line` - For data visualizations
- `python-docx` - For DOCX file processing
- `PyPDF2` - For PDF file processing
- `openpyxl` - For Excel file processing

### Database Connection Issues

**Problem:** Cannot connect to PostgreSQL database

**Check Database Status:**
```bash
# Check if PostgreSQL container is running
docker-compose ps db

# Check database logs
docker-compose logs db
```

**Restart Database:**
```bash
# Restart PostgreSQL container
docker-compose restart db

# Wait for database to be ready
docker-compose exec db pg_isready -U postgres
```

**Reset Database (WARNING: Deletes all data):**
```bash
# Stop all services
docker-compose down

# Remove database volume
docker-compose down -v

# Restart services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate
```

### Migration Issues

**Problem:** Database migrations not applied or conflicts

**Check Migration Status:**
```bash
# Check which migrations are applied
docker-compose exec backend python manage.py showmigrations

# Check for pending migrations
docker-compose exec backend python manage.py makemigrations --dry-run
```

**Apply Pending Migrations:**
```bash
# Apply all pending migrations
docker-compose exec backend python manage.py migrate

# Apply migrations for specific app
docker-compose exec backend python manage.py migrate app_name
```

**Reset Migrations (Emergency):**
```bash
# Fake initial migration if needed
docker-compose exec backend python manage.py migrate --fake-initial

# Reset migrations for specific app
docker-compose exec backend python manage.py migrate app_name zero
docker-compose exec backend python manage.py migrate app_name
```

### Frontend Dependencies

**Problem:** Missing Node.js packages or build errors

**Windows:**
```batch
# Navigate to frontend directory
cd app/frontend

# Install dependencies
npm install

# Clear cache if needed
npm cache clean --force

# Rebuild node_modules
rmdir /s node_modules
npm install
```

**macOS/Linux:**
```bash
# Navigate to frontend directory
cd app/frontend

# Install dependencies
npm install

# Clear cache if needed
npm cache clean --force

# Rebuild node_modules
rm -rf node_modules
npm install
```

### Docker Issues

**Problem:** Docker containers not starting or running

**Check Docker Installation:**
```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version
```

**Start Services:**
```bash
# Start all services
docker-compose up -d

# Start with build
docker-compose up -d --build

# Check service status
docker-compose ps
```

**Clean Docker Environment:**
```bash
# Stop all containers
docker-compose down

# Remove unused containers/images
docker system prune -a

# Rebuild containers
docker-compose up -d --build
```

### Line Ending Issues (CRLF vs LF)

**Problem:** Shell scripts fail with "bad interpreter" or permission errors

**Symptoms:**
```bash
bash: ./entrypoint.sh: /bin/bash^M: bad interpreter: No such file or directory
```

**Cause:** Windows (CRLF) line endings in shell scripts when Git auto-converts them

**Solutions:**

**Option 1: Configure Git (Recommended)**
```bash
# Set Git to handle line endings properly
git config --global core.autocrlf input

# For Windows users, use:
git config --global core.autocrlf true

# Re-checkout files to apply new settings
git rm --cached -r .
git reset --hard
```

**Option 2: Fix Individual Files**
```bash
# Convert CRLF to LF (Linux/macOS)
dos2unix app/backend/entrypoint.sh
dos2unix scripts/testing/*.sh

# If dos2unix is not available
sed -i 's/\r$//' app/backend/entrypoint.sh
```

**Option 3: Visual Studio Code**
```
1. Open the file in VS Code
2. Look at bottom-right status bar
3. Click "CRLF" and change to "LF"
4. Save the file
```

**Prevention:**
- Add `.gitattributes` file in project root:
```
*.sh text eol=lf
*.py text eol=lf
*.js text eol=lf
*.ts text eol=lf
*.tsx text eol=lf
```

### Port Conflicts

**Problem:** Ports already in use by other services

**Check Port Usage:**
```bash
# Check what's using port 8000 (backend)
lsof -i :8000

# Check what's using port 3000 (frontend)
lsof -i :3000

# Check what's using port 5432 (PostgreSQL)
lsof -i :5432
```

**Kill Processes (macOS/Linux):**
```bash
# Kill process using specific port
sudo kill -9 $(lsof -t -i:8000)

# Kill all processes using project ports
sudo kill -9 $(lsof -t -i:8000,3000,5432)
```

**Change Ports (Windows):**
```batch
# Find processes using ports
netstat -ano | findstr :8000

# Kill process by PID
taskkill /PID <PID> /F
```

**Alternative: Change Ports in docker-compose.yml:**
```yaml
# Change backend port
backend:
  ports:
    - "8001:8000"  # Changed from 8000:8000

# Change frontend port
frontend:
  ports:
    - "3001:3000"  # Changed from 3000:3000
```

## 👤 User Management Issues

### Create Superuser

**Problem:** Need to create a Django superuser for admin access

**Using Django Management Command:**
```bash
# Interactive superuser creation
docker-compose exec backend python manage.py createsuperuser

# Non-interactive superuser creation
docker-compose exec backend python manage.py shell -c "
from users.models import User
if not User.objects.filter(email='admin@examvault.com').exists():
    user = User.objects.create_superuser(
        email='admin@examvault.com',
        name='Admin User',
        password='admin123'
    )
    print('Superuser created: admin@examvault.com / admin123')
else:
    print('Superuser already exists')
"
```

### Create Test Admin User

**Problem:** Need test admin user for testing purposes

**Using create_admin.py Script:**
```bash
# Run the create_admin script
docker-compose exec backend python scripts/setup/create_admin.py

# Or run directly
docker-compose exec backend python manage.py shell -c "
from users.models import User
admin_exists = User.objects.filter(email='admin@test.com').exists()
admin_user = User.objects.get_or_create(
    email='admin@test.com',
    defaults={
        'name': 'Test Admin',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True
    }
)[0]
if not admin_exists:
    admin_user.set_password('admin123')
    admin_user.save()
    print('Created admin: admin@test.com / admin123')
else:
    print('Test admin already exists')
"
```

### Difference Between Superuser and Admin

**Superuser (`createsuperuser`):**
- Full Django admin access
- Can access Django admin interface
- Has `is_superuser=True` and `is_staff=True`
- Can manage all Django models
- Used for system administration

**Admin User (`create_admin.py`):**
- Application-level admin access
- Can access ExamVault admin dashboard
- Has `role='admin'` in custom User model
- Can manage application-specific features
- Used for application administration

## 🔧 Debug Mode

### Enable Verbose Output

**Backend Tests:**
```bash
# Verbose Django tests
docker-compose exec backend python manage.py test --verbosity=2

# Debug shell access
docker-compose exec backend python manage.py shell
```

**Frontend Tests:**
```bash
# Verbose frontend tests
cd app/frontend
npx vitest run --reporter=verbose
```

### Debug Shell Access

**Backend Debug Shell:**
```bash
# Access Django shell
docker-compose exec backend python manage.py shell

# Check environment variables
docker-compose exec backend env

# Check installed packages
docker-compose exec backend pip list
```

**Database Debug Shell:**
```bash
# Access PostgreSQL shell
docker-compose exec db psql -U postgres -d examvault

# List tables
\dt

# Check user table
SELECT * FROM users_user LIMIT 5;
```

## 🚨 Emergency Procedures

### Complete System Reset

**Windows:**
```batch
# Stop all containers
docker-compose down

# Remove all volumes (WARNING: Deletes all data)
docker-compose down -v

# Remove all images
docker system prune -a

# Rebuild everything
docker-compose up --build -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin user
docker-compose exec backend python scripts/setup/create_admin.py
```

**macOS/Linux:**
```bash
# Stop all containers
docker-compose down

# Remove all volumes (WARNING: Deletes all data)
docker-compose down -v

# Remove all images
docker system prune -a

# Rebuild everything
docker-compose up --build -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create admin user
docker-compose exec backend python scripts/setup/create_admin.py
```

### Database Recovery

**Backup Database:**
```bash
# Create backup
docker-compose exec db pg_dump -U postgres examvault > backup.sql

# Restore from backup
docker-compose exec -T db psql -U postgres examvault < backup.sql
```

**Reset Specific App:**
```bash
# Reset migrations for specific app
docker-compose exec backend python manage.py migrate app_name zero
docker-compose exec backend python manage.py migrate app_name
```

## 📊 Performance Issues

### Memory Issues

**Check Container Memory Usage:**
```bash
# Check memory usage
docker stats

# Check specific container
docker stats backend
```

**Increase Memory Limits:**
```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### Slow Database Queries

**Enable Query Logging:**
```bash
# Check slow queries
docker-compose exec db psql -U postgres -d examvault -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

**Optimize Database:**
```bash
# Analyze database
docker-compose exec db psql -U postgres -d examvault -c "ANALYZE;"

# Vacuum database
docker-compose exec db psql -U postgres -d examvault -c "VACUUM;"
```

## 🔍 Getting Help

### Useful Debugging Commands

**System Information:**
```bash
# Check Docker version
docker --version

# Check system resources
docker system df

# Check container logs
docker-compose logs -f backend
```

**Network Issues:**
```bash
# Check network connectivity
docker-compose exec backend ping db

# Check port accessibility
docker-compose exec backend netstat -tulpn
```

**File Permissions:**
```bash
# Check file permissions
docker-compose exec backend ls -la

# Fix permissions if needed
docker-compose exec backend chmod -R 755 .
```

### When to Ask for Help

**Include in Bug Reports:**
1. **Environment**: OS, Docker version, Python/Node versions
2. **Steps**: Exact commands that caused the issue
3. **Error Messages**: Full error output and stack traces
4. **Logs**: Relevant log files and output
5. **Configuration**: Any custom settings or changes made

**Useful Commands for Bug Reports:**
```bash
# System information
docker --version && docker-compose --version

# Container status
docker-compose ps

# Recent logs
docker-compose logs --tail=50 backend

# Migration status
docker-compose exec backend python manage.py showmigrations
```

## 🔗 Related Documentation

- [Testing Guide](./TESTING_GUIDE.md) - How to run tests
- [API Documentation](./api/ENDPOINTS_STATUS.md) - API troubleshooting
- [Admin Testing](./testing/admin/ADMIN_TESTING_CONSOLIDATED.md) - Admin-specific issues
- [PostgreSQL Testing](./testing/POSTGRES_TESTING.md) - Database-specific issues

## 📞 Support

For additional help:

1. **Check this troubleshooting guide first**
2. **Review the [Testing Guide](./TESTING_GUIDE.md)**
3. **Check the main [README.md](../README.md)**
4. **Search existing issues** in the project repository
5. **Create a new issue** with detailed information

**Before creating an issue, ensure you have:**
- ✅ Checked this troubleshooting guide
- ✅ Verified Docker containers are running
- ✅ Confirmed migrations are applied
- ✅ Tested with clean environment
- ✅ Included relevant error messages and logs
