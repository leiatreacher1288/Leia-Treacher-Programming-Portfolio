# ExamVault Testing Guide

This guide covers all available testing commands and procedures for ExamVault, with platform-specific instructions for Windows and macOS/Linux.

## 🚀 Quick Start

### Run All Tests

**Windows:**
```batch
# Run all tests (backend + frontend)
make test-all

# Run with coverage
make coverage-all
```

**macOS/Linux:**
```bash
# Run all tests (backend + frontend)
make test-all

# Run with coverage
make coverage-all
```

## 📋 Available Commands

### Backend Testing

**Windows:**
```batch
# Run Django backend tests
make test

# Run with coverage and show report
make test-coverage

# Run with verbose output
make test --verbose
```

**macOS/Linux:**
```bash
# Run Django backend tests
make test

# Run with coverage and show report
make test-coverage

# Run with verbose output
make test --verbose
```

**What it tests:**
- Django unit tests
- API endpoint testing
- Model validation
- Business logic testing
- Integration tests

### Frontend Testing

**Windows:**
```batch
# Run React frontend tests
make test-frontend

# Run with coverage
make test-frontend --coverage
```

**macOS/Linux:**
```bash
# Run React frontend tests
make test-frontend

# Run with coverage
make test-frontend --coverage
```

**What it tests:**
- React component testing
- User interface testing
- State management testing
- API integration testing

### PostgreSQL Testing

**Windows:**
```batch
# Run tests with PostgreSQL (requires PostgreSQL installed)
scripts/testing/test_with_postgres.bat

# Run tests with Docker PostgreSQL (recommended)
scripts/testing/test_with_docker_postgres.bat
```

**macOS/Linux:**
```bash
# Run tests with Docker PostgreSQL (recommended)
make test-postgres
```

**What it tests:**
- Database connection verification
- Django ORM integration
- Test database creation and migration
- Connection troubleshooting

## 🐳 Docker-Based Testing

All testing in ExamVault runs through Docker containers for consistency across environments.

### Pre-Testing Setup

**Windows:**
```batch
# Start all services
make up

# Check if services are running
docker-compose ps

# Run migrations
make migrate
```

**macOS/Linux:**
```bash
# Start all services
make up

# Check if services are running
docker-compose ps

# Run migrations
make migrate
```

### Test Environment

**Backend Tests:**
- Run inside the `backend` container
- Use Django's test framework
- Access to PostgreSQL database
- Isolated from host environment

**Frontend Tests:**
- Run on host machine (not in container)
- Use Vitest testing framework
- Access to Node.js dependencies
- Can mock API calls

## 📊 Coverage Reporting

### Generate Coverage Reports

**Windows:**
```batch
# Backend coverage
make test-coverage

# Frontend coverage
make coverage-frontend

# All coverage
make coverage-all
```

**macOS/Linux:**
```bash
# Backend coverage
make test-coverage

# Frontend coverage
make coverage-frontend

# All coverage
make coverage-all
```

### View Coverage Reports

**Backend Coverage:**
```bash
# Generate HTML report
make coverage-html

# View in browser (after generation)
# Open: app/backend/htmlcov/index.html
```

**Frontend Coverage:**
```bash
# Coverage report is generated automatically
# View in terminal output
# HTML report available in app/frontend/coverage/
```

## 🔧 Manual Test Execution

### Backend Tests

**Windows:**
```batch
# In Docker (recommended)
docker-compose exec backend python manage.py test

# Direct (if Django environment is set up)
cd app/backend
python manage.py test
```

**macOS/Linux:**
```bash
# In Docker (recommended)
docker-compose exec backend python manage.py test

# Direct (if Django environment is set up)
cd app/backend
python manage.py test
```

### Frontend Tests

**Windows:**
```batch
# Navigate to frontend directory
cd app/frontend

# Run tests
npx vitest run

# Run with coverage
npx vitest run --coverage
```

**macOS/Linux:**
```bash
# Navigate to frontend directory
cd app/frontend

# Run tests
npx vitest run

# Run with coverage
npx vitest run --coverage
```

### PostgreSQL Tests

**Windows:**
```batch
# Run PostgreSQL tests
scripts/testing/test_with_postgres.bat

# Run Docker PostgreSQL tests
scripts/testing/test_with_docker_postgres.bat
```

**macOS/Linux:**
```bash
# Run Docker PostgreSQL tests
make test-postgres
```

## 📁 Test Directory Structure

```
scripts/testing/
├── run_tests.py                    # Main test runner script
├── test_with_postgres.bat          # PostgreSQL testing (Windows)
└── test_with_docker_postgres.bat   # Docker PostgreSQL testing (Windows)

test/
├── file_import.py                  # File import testing utilities
├── fix_test_setup.py               # Test setup utilities
└── debug_exam_access.py            # Exam access debugging utilities
```

## 🎯 Test Categories

### 1. Backend Tests
- **Django Unit Tests**: Model validation, business logic
- **API Tests**: Endpoint functionality, authentication
- **Integration Tests**: Database operations, external services
- **Performance Tests**: Query optimization, response times

### 2. Frontend Tests
- **Component Tests**: React component rendering and behavior
- **Integration Tests**: Component interaction, state management
- **API Integration**: Mock API calls, error handling
- **User Interface**: Form validation, navigation, accessibility

### 3. Database Tests
- **Connection Tests**: Database connectivity verification
- **Migration Tests**: Schema changes, data integrity
- **ORM Tests**: Query performance, relationship handling
- **Transaction Tests**: Data consistency, rollback scenarios

## 🚀 Performance Testing

### Load Testing

**Backend API:**
```bash
# Test API endpoints under load
docker-compose exec backend python manage.py test --pattern="*performance*"
```

**Database Performance:**
```bash
# Test database query performance
docker-compose exec backend python manage.py test --pattern="*database*"
```

## 📝 Test Configuration

### Backend Test Settings

**Location:** `app/backend/examvault/settings.py`

**Key Settings:**
- `TEST_RUNNER`: Django test runner
- `DATABASES`: Test database configuration
- `CACHES`: Test cache configuration
- `MEDIA_ROOT`: Test file storage

### Frontend Test Settings

**Location:** `app/frontend/vitest.config.ts`

**Key Settings:**
- `testEnvironment`: jsdom for DOM testing
- `setupFilesAfterEnv`: Global test setup
- `coverage`: Coverage reporting configuration
- `include`: Test file patterns

## 🔗 Related Documentation

- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) - Common issues and solutions
- [API Documentation](./api/ENDPOINTS_STATUS.md) - API endpoint testing
- [Admin Testing](./testing/admin/ADMIN_TESTING_CONSOLIDATED.md) - Admin functionality tests
- [PostgreSQL Testing](./testing/POSTGRES_TESTING.md) - Database testing procedures

## 🤝 Contributing

### Adding New Tests

**Backend Tests:**
1. Create test file in appropriate app directory
2. Follow Django test naming conventions
3. Use `TestCase` or `TransactionTestCase` as base
4. Add to test suite via `python manage.py test`

**Frontend Tests:**
1. Create test file alongside component
2. Follow Vitest naming conventions
3. Use `describe` and `it` blocks
4. Mock external dependencies

### Test Best Practices

1. **Isolation**: Each test should be independent
2. **Speed**: Tests should run quickly
3. **Clarity**: Test names should be descriptive
4. **Coverage**: Aim for high test coverage
5. **Maintenance**: Keep tests up to date with code changes

## 📞 Support

If you encounter issues with testing:

1. Check the [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
2. Verify Docker containers are running
3. Ensure migrations are applied
4. Check test configuration files
5. Review test logs for specific errors

For additional help, refer to the main [README.md](../README.md) or create an issue in the project repository.
