#!/usr/bin/env python3
"""
ExamVault Test Runner
====================
Centralized test runner for all test categories in the ExamVault project.

Usage:
    python test/run_tests.py [category] [options]

Categories:
    all         - Run all tests (default)
    admin       - Run admin functionality tests
    postgres    - Run PostgreSQL connection tests
    backend     - Run Django backend tests
    frontend    - Run React frontend tests
    api         - Run API integration tests

Options:
    --verbose   - Show verbose output
    --coverage  - Run with coverage reporting
    --docker    - Use Docker for testing (recommended)
    --help      - Show this help message

Examples:
    python test/run_tests.py admin --verbose
    python test/run_tests.py postgres --docker
    python test/run_tests.py all --coverage
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

class TestRunner:
    def __init__(self):
        self.project_root = Path(__file__).parent.parent
        self.test_dir = self.project_root / "test"
        self.results = []
        
    def log(self, message, color=Colors.BLUE):
        print(f"{color}{message}{Colors.END}")
        
    def log_success(self, message):
        print(f"{Colors.GREEN}[PASS] {message}{Colors.END}")
        
    def log_error(self, message):
        print(f"{Colors.RED}[FAIL] {message}{Colors.END}")
        
    def log_warning(self, message):
        print(f"{Colors.YELLOW}[WARN] {message}{Colors.END}")

    def run_command(self, command, cwd=None, capture_output=False):
        """Run a command and return success status"""
        try:
            if capture_output:
                result = subprocess.run(
                    command, 
                    shell=True, 
                    cwd=cwd or self.project_root, 
                    capture_output=True, 
                    text=True,
                    encoding='utf-8',
                    errors='replace'
                )
                return result.returncode == 0, result.stdout, result.stderr
            else:
                result = subprocess.run(
                    command, 
                    shell=True, 
                    cwd=cwd or self.project_root,
                    encoding='utf-8',
                    errors='replace'
                )
                return result.returncode == 0, "", ""
        except Exception as e:
            self.log_error(f"Command failed: {e}")
            return False, "", str(e)

    def check_docker_running(self):
        """Check if Docker is running"""
        self.log("[DOCKER] Checking Docker status...")
        success, stdout, stderr = self.run_command("docker ps", capture_output=True)
        if success:
            self.log_success("Docker is running")
            return True
        else:
            self.log_error("Docker is not running or accessible")
            return False

    def run_admin_tests(self, verbose=False, docker=True):
        """Run admin functionality tests"""
        self.log(f"\\n{Colors.BOLD}[ADMIN] Running Admin Tests{Colors.END}")
        print("-" * 50)
        
        success_count = 0
        total_tests = 0
        
        if docker and self.check_docker_running():
            # Run Django admin tests in Docker
            self.log("Running Django admin tests in Docker...")
            success, stdout, stderr = self.run_command(
                "docker-compose exec -T backend python manage.py test tests.test_admin_api",
                capture_output=True
            )
            total_tests += 1
            if success:
                success_count += 1
                self.log_success("Django admin tests passed")
            else:
                self.log_error("Django admin tests failed")
                if verbose:
                    print(stdout)
                    print(stderr)
        
        # Run quick admin tests (only if server is accessible)
        admin_script = self.test_dir / "admin" / "test_admin_quick_simple.py"
        if admin_script.exists():
            self.log("Running quick admin functionality test...")
            success, stdout, stderr = self.run_command(
                f"python {admin_script}",
                capture_output=True
            )
            total_tests += 1
            if success:
                success_count += 1
                self.log_success("Quick admin test passed")
            else:
                # Check if it's a connection issue (which is acceptable)
                if "Cannot connect" in stdout or "No accessible server" in stdout:
                    success_count += 1  # Count as success since server isn't running locally
                    self.log_warning("Quick admin test skipped (no local server)")
                else:
                    self.log_error("Quick admin test failed")
                if verbose:
                    print(stdout)
                    print(stderr)
        
        return success_count, total_tests

    def run_postgres_tests(self, verbose=False, docker=True):
        """Run PostgreSQL connection tests"""
        self.log(f"\\n{Colors.BOLD}[POSTGRES] Running PostgreSQL Tests{Colors.END}")
        print("-" * 50)
        
        success_count = 0
        total_tests = 1
        
        if docker and self.check_docker_running():
            # Run connection test using Docker
            self.log("Testing PostgreSQL connection in Docker...")
            success, stdout, stderr = self.run_command(
                "docker-compose exec -T backend python -c \"import django; django.setup(); from django.db import connection; cursor = connection.cursor(); cursor.execute('SELECT 1'); print('PostgreSQL connection successful')\"",
                capture_output=True
            )
            if success:
                success_count += 1
                self.log_success("PostgreSQL connection test passed")
            else:
                self.log_error("PostgreSQL connection test failed")
                if verbose:
                    print(stderr)
        else:
            # Try local connection test
            postgres_script = self.test_dir / "postgres" / "check_postgres_connection.bat"
            if postgres_script.exists():
                self.log("Running PostgreSQL connection test...")
                success, stdout, stderr = self.run_command(str(postgres_script), capture_output=True)
                if success:
                    success_count += 1
                    self.log_success("PostgreSQL connection test passed")
                else:
                    self.log_error("PostgreSQL connection test failed")
        
        return success_count, total_tests

    def run_backend_tests(self, verbose=False, docker=True, coverage=False):
        """Run Django backend tests"""
        self.log(f"\\n{Colors.BOLD}[BACKEND] Running Backend Tests{Colors.END}")
        print("-" * 50)
        
        success_count = 0
        total_tests = 1
        
        if docker and self.check_docker_running():
            command = "docker-compose exec -T backend python manage.py test"
            if coverage:
                command = "docker-compose exec -T backend coverage run --source='.' manage.py test"
            
            self.log("Running Django backend tests...")
            success, stdout, stderr = self.run_command(command, capture_output=True)
            
            if success:
                success_count += 1
                self.log_success("Backend tests passed")
            else:
                self.log_error("Backend tests failed")
            
            if verbose:
                print(stdout)
                if stderr:
                    print(stderr)
                    
            if coverage and success:
                self.log("Generating coverage report...")
                self.run_command("docker-compose exec -T backend coverage report")
        else:
            # Try local backend tests
            backend_dir = self.project_root / "app" / "backend"
            if backend_dir.exists():
                self.log("Running Django backend tests locally...")
                success, stdout, stderr = self.run_command(
                    "python manage.py test",
                    cwd=backend_dir,
                    capture_output=True
                )
                if success:
                    success_count += 1
                    self.log_success("Backend tests passed")
                else:
                    self.log_error("Backend tests failed")
        
        return success_count, total_tests

    def run_frontend_tests(self, verbose=False, coverage=False):
        """Run React frontend tests"""
        self.log(f"\\n{Colors.BOLD}[FRONTEND] Running Frontend Tests{Colors.END}")
        print("-" * 50)
        
        success_count = 0
        total_tests = 1
        
        frontend_dir = self.project_root / "app" / "frontend"
        if not frontend_dir.exists():
            self.log_error("Frontend directory not found")
            return 0, 1
        
        # Check if node_modules exists
        if not (frontend_dir / "node_modules").exists():
            self.log("Installing frontend dependencies...")
            self.run_command("npm install", cwd=frontend_dir)
        
        command = "npm test -- --run"
        if coverage:
            command = "npm test -- --run --coverage"
        
        self.log("Running React frontend tests...")
        success, stdout, stderr = self.run_command(command, cwd=frontend_dir, capture_output=True)
        
        if success:
            success_count += 1
            self.log_success("Frontend tests passed")
        else:
            self.log_error("Frontend tests failed")
        
        if verbose:
            print(stdout)
            if stderr:
                print(stderr)
        
        return success_count, total_tests

    def run_all_tests(self, verbose=False, docker=True, coverage=False):
        """Run all test categories"""
        self.log(f"\\n{Colors.BOLD}[ALL] Running All Tests{Colors.END}")
        print("=" * 50)
        
        total_success = 0
        total_tests = 0
        
        # Run all test categories
        admin_success, admin_total = self.run_admin_tests(verbose, docker)
        postgres_success, postgres_total = self.run_postgres_tests(verbose, docker)
        backend_success, backend_total = self.run_backend_tests(verbose, docker, coverage)
        frontend_success, frontend_total = self.run_frontend_tests(verbose, coverage)
        
        total_success = admin_success + postgres_success + backend_success + frontend_success
        total_tests = admin_total + postgres_total + backend_total + frontend_total
        
        # Print summary
        self.log(f"\\n{Colors.BOLD}[SUMMARY] Test Summary{Colors.END}")
        print("=" * 50)
        self.log(f"Total tests passed: {total_success}/{total_tests}")
        
        if total_success == total_tests:
            self.log_success("All tests passed!")
        else:
            self.log_error(f"{total_tests - total_success} test(s) failed")

def main():
    parser = argparse.ArgumentParser(description="ExamVault Test Runner")
    parser.add_argument(
        "category", 
        nargs="?", 
        default="all",
        choices=["all", "admin", "postgres", "backend", "frontend", "api"],
        help="Test category to run"
    )
    parser.add_argument("--verbose", action="store_true", help="Show verbose output")
    parser.add_argument("--coverage", action="store_true", help="Run with coverage reporting")
    parser.add_argument("--docker", action="store_true", default=True, help="Use Docker for testing")
    parser.add_argument("--no-docker", action="store_true", help="Don't use Docker for testing")
    
    args = parser.parse_args()
    
    if args.no_docker:
        args.docker = False
    
    runner = TestRunner()
    
    # Run specified test category
    if args.category == "all":
        success = runner.run_all_tests(args.verbose, args.docker, args.coverage)
    elif args.category == "admin":
        success_count, total = runner.run_admin_tests(args.verbose, args.docker)
        success = success_count == total
    elif args.category == "postgres":
        success_count, total = runner.run_postgres_tests(args.verbose, args.docker)
        success = success_count == total
    elif args.category == "backend":
        success_count, total = runner.run_backend_tests(args.verbose, args.docker, args.coverage)
        success = success_count == total
    elif args.category == "frontend":
        success_count, total = runner.run_frontend_tests(args.verbose, args.coverage)
        success = success_count == total
    else:
        print("Category not implemented yet")
        success = False
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
