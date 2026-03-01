#!/usr/bin/env python3
"""
Create test admin user for testing
"""

import requests
import json

def create_test_admin():
    """Create a test admin user via the backend"""
    print("🔧 Creating test admin user...")
    
    # First check if we can access the Django shell directly
    import subprocess
    
    create_user_command = [
        "docker-compose", "exec", "-T", "backend", "python", "manage.py", "shell", "-c",
        """
from users.models import User
import os

# Create admin user
admin_email = 'admin@test.com'
admin_password = 'admin123'

try:
    # Check if admin already exists
    admin_user = User.objects.filter(email=admin_email).first()
    
    if admin_user:
        print(f"Admin user {admin_email} already exists")
        # Update password just in case
        admin_user.set_password(admin_password)
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.role = 'admin'
        admin_user.save()
        print(f"Updated admin user: {admin_email}")
    else:
        # Create new admin user
        admin_user = User.objects.create_user(
            email=admin_email,
            name='Test Admin',
            password=admin_password,
            role='admin'
        )
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print(f"Created admin user: {admin_email}")
        
    print("✅ Admin user ready for testing")
    
except Exception as e:
    print(f"❌ Error creating admin user: {e}")
        """
    ]
    
    try:
        result = subprocess.run(create_user_command, capture_output=True, text=True, check=True)
        print(result.stdout)
        if result.stderr:
            print(f"Warnings: {result.stderr}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create admin user: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False

if __name__ == "__main__":
    create_test_admin()
