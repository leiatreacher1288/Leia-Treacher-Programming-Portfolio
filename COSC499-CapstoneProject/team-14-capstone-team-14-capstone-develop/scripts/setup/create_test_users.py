#!/usr/bin/env python3
"""
Create test users for comprehensive admin testing
"""

import subprocess
import time

def create_test_users():
    """Create test users including admin and instructor users"""
    print("🔧 Creating test users for admin testing...")
    
    create_users_command = [
        "docker-compose", "exec", "-T", "backend", "python", "manage.py", "shell", "-c",
        """
from users.models import User
from django.utils import timezone
import random

# Test users to create
test_users = [
    {
        'email': 'admin@test.com',
        'name': 'Test Admin',
        'password': 'admin123',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True
    },
    {
        'email': 'instructor1@test.com',
        'name': 'Test Instructor 1',
        'password': 'test123',
        'role': 'instructor',
        'is_staff': False,
        'is_superuser': False
    },
    {
        'email': 'instructor2@test.com',
        'name': 'Test Instructor 2',
        'password': 'test123',
        'role': 'instructor',
        'is_staff': False,
        'is_superuser': False
    },
    {
        'email': 'inactive@test.com',
        'name': 'Inactive User',
        'password': 'test123',
        'role': 'instructor',
        'is_staff': False,
        'is_superuser': False,
        'is_active': False
    }
]

created_count = 0
updated_count = 0

for user_data in test_users:
    email = user_data['email']
    
    try:
        # Check if user already exists
        user = User.objects.filter(email=email).first()
        
        if user:
            # Update existing user
            for key, value in user_data.items():
                if key == 'password':
                    user.set_password(value)
                elif key != 'email':  # Don't update email
                    setattr(user, key, value)
            user.save()
            updated_count += 1
            print(f"✅ Updated user: {email}")
        else:
            # Create new user
            password = user_data.pop('password')
            user = User.objects.create_user(
                email=email,
                password=password,
                **{k: v for k, v in user_data.items() if k != 'email'}
            )
            
            # Set some test timestamps for status testing
            if email.startswith('instructor'):
                # Set last_login to simulate recent activity
                user.last_login = timezone.now() - timezone.timedelta(minutes=random.randint(1, 30))
                # Randomly set last_logout for some users
                if random.choice([True, False]):
                    user.last_logout = timezone.now() - timezone.timedelta(minutes=random.randint(1, 10))
                user.save()
            
            created_count += 1
            print(f"✅ Created user: {email}")
            
    except Exception as e:
        print(f"❌ Error with user {email}: {e}")

print(f"\\n📊 Summary: Created {created_count}, Updated {updated_count} users")
print("✅ Test users ready for admin testing")
        """
    ]
    
    try:
        result = subprocess.run(create_users_command, capture_output=True, text=True, check=True, timeout=30)
        print(result.stdout)
        if result.stderr:
            print(f"Warnings: {result.stderr}")
        return True
    except subprocess.TimeoutExpired:
        print("❌ Command timed out")
        return False
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to create users: {e}")
        print(f"stdout: {e.stdout}")
        print(f"stderr: {e.stderr}")
        return False

if __name__ == "__main__":
    create_test_users()
