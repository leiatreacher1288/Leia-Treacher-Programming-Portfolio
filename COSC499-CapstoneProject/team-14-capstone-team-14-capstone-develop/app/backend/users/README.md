# Users Service

## Overview

The Users service manages authentication, authorization, and user management in ExamVault, providing a custom user model with role-based access control, email verification, and comprehensive user lifecycle management. This service forms the foundation for all user interactions and security in the system.

## 🏗️ Architecture

### Models

#### User
Custom user model extending Django's AbstractBaseUser with role-based permissions.

**Core Fields:**
- `email`: Primary identifier and login field
- `name`: Display name for the user
- `role`: User role (instructor, admin)
- `created_at`: Account creation timestamp
- `last_logout`: Last logout timestamp

**Security Features:**
- `mfa_enabled`: Multi-factor authentication toggle
- `is_verified`: Email verification status
- `verification_token`: Email verification token
- `verification_sent_at`: Verification email timestamp

**Account Status:**
- `is_active`: Account activation status
- `is_staff`: Django admin access
- `is_archived`: GDPR compliance archive status
- `archived_at`: Archive timestamp
- `archived_by`: Admin who archived the account

#### UserManager
Custom user manager handling user creation and management.

**Methods:**
- `create_user()`: Create regular users with role assignment
- `create_superuser()`: Create admin users with elevated permissions
- `normalize_email()`: Email normalization for consistency

## 🔧 API Endpoints

### Authentication

```http
POST   /api/auth/login/                 # User login
POST   /api/auth/logout/                # User logout
POST   /api/auth/register/              # User registration
POST   /api/auth/verify-email/          # Email verification
POST   /api/auth/reset-password/        # Password reset request
POST   /api/auth/reset-password-confirm/  # Password reset confirmation
```

### User Management

```http
GET    /api/users/                      # List all users (admin only)
GET    /api/users/{id}/                 # Get user details
PUT    /api/users/{id}/                 # Update user
DELETE /api/users/{id}/                 # Delete user (admin only)
POST   /api/users/{id}/activate/        # Activate user
POST   /api/users/{id}/deactivate/      # Deactivate user
```

### Profile Management

```http
GET    /api/users/profile/              # Get current user profile
PUT    /api/users/profile/              # Update current user profile
POST   /api/users/profile/change-password/  # Change password
```

### Admin Operations

```http
GET    /api/admin/users/                # Admin user management
POST   /api/admin/users/                # Create user (admin)
PUT    /api/admin/users/{id}/           # Update user (admin)
DELETE /api/admin/users/{id}/           # Delete user (admin)
POST   /api/admin/users/{id}/archive/   # Archive user
POST   /api/admin/users/{id}/restore/   # Restore archived user
```

## 📊 Features

### Authentication & Authorization
- **Custom User Model**: Email-based authentication
- **Role-Based Access**: Instructor and admin roles
- **JWT Authentication**: Secure token-based authentication
- **Email Verification**: Optional email verification system
- **Password Management**: Secure password handling

### User Lifecycle Management
- **Account Creation**: Streamlined user registration
- **Account Activation**: Manual and automatic activation
- **Account Deactivation**: Temporary account suspension
- **Account Archival**: GDPR-compliant data archival
- **Account Restoration**: Restore archived accounts

### Security Features
- **Multi-Factor Authentication**: Toggle for MFA support
- **Authentication**: Secure login and token management
- **Password Policies**: Configurable password requirements
- **Account Lockout**: Protection against brute force attacks
- **Audit Trails**: Complete user activity logging

### Admin Features
- **User Management**: Comprehensive admin interface
- **Role Assignment**: Assign and modify user roles
- **Bulk Operations**: Efficient bulk user management
- **Activity Logging**: Track user activity and login patterns
- **Compliance Tools**: GDPR and privacy compliance features

## 🛠️ Usage Examples

### Creating Users

```python
from users.models import User

# Create regular user
user = User.objects.create_user(
    email="instructor@example.com",
    name="John Doe",
    password="secure_password",
    role="instructor"
)

# Create admin user
admin = User.objects.create_superuser(
    email="admin@example.com",
    name="Admin User",
    password="admin_password"
)
```

### Authentication

```python
from django.contrib.auth import authenticate, login

# Authenticate user
user = authenticate(email="user@example.com", password="password")
if user is not None:
    login(request, user)
    print(f"Logged in: {user.name}")
```

### Role-Based Access

```python
from users.models import User

# Check user role
if user.role == "admin":
    # Admin-specific functionality
    pass
elif user.role == "instructor":
    # Instructor-specific functionality
    pass

# Check permissions
if user.is_staff:
    # Staff permissions
    pass
```

### Email Verification

```python
from users.models import User
from django.utils import timezone

# Send verification email
user.verification_token = generate_token()
user.verification_sent_at = timezone.now()
user.save()

# Verify email
if user.verification_token == provided_token:
    user.is_verified = True
    user.verification_token = None
    user.save()
```

### Account Management

```python
from users.models import User

# Deactivate account
user.is_active = False
user.save()

# Archive account (GDPR compliance)
user.is_archived = True
user.archived_at = timezone.now()
user.archived_by = admin_user
user.save()

# Restore archived account
user.is_archived = False
user.archived_at = None
user.archived_by = None
user.save()
```

## 🔒 Security & Permissions

### Authentication Security
- **Email Normalization**: Consistent email handling
- **Password Hashing**: Secure password storage
- **Authentication Security**: Secure authentication management
- **Token Security**: JWT token security
- **Brute Force Protection**: Account lockout mechanisms

### Authorization Model
- **Role-Based Access**: Clear role definitions
- **Permission Inheritance**: Hierarchical permissions
- **Course-Based Access**: Course-specific permissions
- **Admin Override**: Administrative override capabilities
- **Audit Logging**: Complete permission audit trails

### Data Privacy
- **GDPR Compliance**: Right to be forgotten
- **Data Archival**: Secure data archival
- **Access Logging**: Complete access audit trails
- **Data Minimization**: Minimal data collection
- **Consent Management**: User consent tracking

## 🧪 Testing

### Running Tests

```bash
# Run all user tests
python manage.py test users

# Run specific test categories
python manage.py test users.tests.test_models
python manage.py test users.tests.test_auth
python manage.py test users.tests.test_admin
```

### Test Coverage

The users service includes comprehensive tests covering:
- User model validation and relationships
- Authentication and authorization
- Admin operations and permissions
- Email verification workflows
- Account lifecycle management
- Security and privacy features

## 📈 Performance Considerations

### Database Optimization
- **Indexed Fields**: Optimized queries on user fields
- **Selective Loading**: Efficient user data loading
- **Caching**: Redis-based caching for user data
- **Connection Pooling**: Efficient database connections

### Scalability
- **Authentication Management**: Efficient authentication handling
- **Authentication Caching**: Cached authentication results
- **Background Processing**: Async email sending
- **Load Balancing**: Support for multiple instances

## 🔄 Migration History

### Recent Changes
- **v1.0**: Initial user management system
- **v1.1**: Added role-based access control
- **v1.2**: Implemented email verification
- **v1.3**: Enhanced admin features
- **v1.4**: Added GDPR compliance
- **v1.5**: Improved security features

## 📚 Related Documentation

- [API Documentation](../docs/api/README.md)
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING_GUIDE.md)

## 🤝 Contributing

When contributing to the users service:

1. **Security First**: Always consider security implications
2. **Test Authentication**: Ensure all auth flows work correctly
3. **Validate Permissions**: Test role-based access thoroughly
4. **Update Documentation**: Keep security guides current
5. **Privacy Compliance**: Consider GDPR and privacy implications

## 📞 Support

For issues related to the users service:
- Check the [troubleshooting guide](../docs/TROUBLESHOOTING_GUIDE.md)
- Review the [API documentation](../docs/api/README.md)
- Create an issue with the `users` label
