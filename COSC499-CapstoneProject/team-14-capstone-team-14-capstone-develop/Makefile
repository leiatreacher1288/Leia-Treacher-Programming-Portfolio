# Makefile for ExamVault Development

# Build containers
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Start services with build
up-build:
	docker-compose up -d --build

# Stop all services
down:
	docker-compose down

# Stop services and remove volumes (careful - deletes data!)
down-volumes:
	docker-compose down --volumes

# Run Django migrations
migrate:
	docker-compose exec backend python manage.py migrate

# Create test admin user for admin dashboard testing
create-test-admin:
	docker-compose exec backend python manage.py shell -c "from users.models import User; admin_exists = User.objects.filter(email='admin@test.com').exists(); admin_user = User.objects.get_or_create(email='admin@test.com', defaults={'name': 'Test Admin', 'role': 'admin', 'is_staff': True, 'is_superuser': True})[0]; if not admin_exists: admin_user.set_password('admin123'); admin_user.save(); print('Created admin: admin@test.com / admin123');"

# Create Django migrations
makemigrations:
	docker-compose exec backend python manage.py makemigrations

# Run all backend tests
test:
	docker-compose exec backend python manage.py test

# Run backend tests with PostgreSQL direct connection
test-postgres:
	cmd /c test_with_postgres.bat

# Run backend tests with PostgreSQL and debug logging
test-postgres-debug:
	cmd /c debug_test_with_postgres.bat

# Run all frontend tests
test-frontend:
	cd app/frontend && npx vitest run

# Run both backend & frontend tests
test-all: test test-frontend

# Run backend tests with coverage _and_ show report
test-coverage:
	docker-compose exec backend sh -c "coverage run --source='.' manage.py test && coverage report"

# Run frontend tests with coverage
coverage-frontend:
	cd app/frontend && npx vitest run --coverage

# Run both suites with coverage
coverage-all: test-coverage coverage-frontend

# Generate detailed backend coverage HTML report
coverage-html:
	docker-compose exec backend coverage html

# View logs
logs:
	docker-compose logs -f

# View specific service logs
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

# Shell access
shell-backend:
	docker-compose exec backend bash

shell-frontend:
	docker-compose exec frontend sh

shell-db:
	docker-compose exec db psql -U postgres -d examvault

# Django specific commands
createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

# Check container health status
health:
	docker ps --format "table {{.Names}}\t{{.Status}}"

# Clean up everything (containers, volumes, networks)
clean:
	docker-compose down --volumes --remove-orphans
	docker system prune -f

# Help command
help:
	@echo "Available commands:"
	@echo "  make build             - Build Docker containers"
	@echo "  make up                - Start all services"
	@echo "  make up-build          - Build and start services"
	@echo "  make down              - Stop all services"
	@echo "  make down-volumes      - Stop services and remove volumes (deletes data!)"
	@echo "  make migrate           - Run Django migrations"
	@echo "  make makemigrations    - Create new migrations"
	@echo "  make test              - Run backend tests"
	@echo "  make test-postgres     - Run backend tests with PostgreSQL"
	@echo "  make test-postgres-debug - Run backend tests with PostgreSQL and debug logging"
	@echo "  make test-frontend     - Run frontend tests"
	@echo "  make test-all          - Run backend + frontend tests"
	@echo "  make test-coverage     - Run backend tests with coverage and show report"
	@echo "  make coverage-frontend - Run frontend tests with coverage"
	@echo "  make coverage-all      - Run both suites with coverage"
	@echo "  make coverage-html     - Generate HTML backend coverage report"
	@echo "  make logs              - View all logs"
	@echo "  make shell-backend     - Access backend shell"
	@echo "  make health            - Check container health status"
	@echo "  make clean             - Clean up containers, volumes, networks"
	@echo "  make help              - Show this help message"

.PHONY: build up up-build down down-volumes migrate makemigrations \
        test test-postgres test-postgres-debug test-frontend test-all test-coverage coverage-frontend coverage-all \
        coverage-html logs logs-backend logs-frontend logs-db \
        shell-backend shell-frontend shell-db createsuperuser collectstatic \
        health clean help
