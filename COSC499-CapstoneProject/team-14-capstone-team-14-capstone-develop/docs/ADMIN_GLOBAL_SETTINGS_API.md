# Admin Global Settings API Documentation (UR 1.3)

## Overview
The Admin Global Settings API provides comprehensive management of system-wide configuration settings for the ExamVault platform. This includes marking schemes, exam formats, and administrative overview functionality.

## Authentication
All endpoints require admin authentication. Users must have `role='admin'` and be authenticated.

## Endpoints

### 1. Global Settings Management

#### GET `/api/admin/settings/`
Retrieve all global settings.

**Response:**
```json
{
  "success": true,
  "settings": [
    {
      "id": 1,
      "key": "default-marking-scheme",
      "setting_type": "marking-scheme",
      "name": "Standard Grading",
      "description": "Standard percentage-based grading scheme",
      "value": {"grade_boundaries": {"A": 90, "B": 80, "C": 70}},
      "is_active": true,
      "is_default": true,
      "created_by": 1,
      "created_at": "2025-01-27T10:00:00Z",
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### POST `/api/admin/settings/`
Create a new global setting.

**Request Body:**
```json
{
  "key": "custom-setting",
  "setting_type": "system-config",
  "name": "Custom Setting",
  "description": "A custom configuration setting",
  "value": {"custom_key": "custom_value"},
  "is_active": true,
  "is_default": false
}
```

#### PUT `/api/admin/settings/`
Update an existing global setting (requires `id` in request body).

### 2. Marking Schemes

#### GET `/api/admin/settings/marking-schemes/`
Retrieve all marking schemes.

**Query Parameters:**
- `active_only` (boolean): Filter for active schemes only
- `default_only` (boolean): Filter for default scheme only

**Response:**
```json
{
  "success": true,
  "marking_schemes": [
    {
      "id": 1,
      "global_setting": {
        "id": 1,
        "name": "Standard Grading",
        "description": "Standard percentage-based grading",
        "is_default": true,
        "is_active": true
      },
      "grade_boundaries": {
        "A+": 95, "A": 90, "A-": 85,
        "B+": 80, "B": 75, "B-": 70,
        "C+": 65, "C": 60, "C-": 55,
        "D": 50, "F": 0
      },
      "negative_marking": {
        "enabled": false,
        "penalty_percentage": 0
      },
      "pass_threshold": 50.0,
      "weight_distribution": {
        "exam": 60,
        "assignments": 30,
        "participation": 10
      }
    }
  ]
}
```

#### POST `/api/admin/settings/marking-schemes/`
Create a new marking scheme.

**Request Body:**
```json
{
  "global_setting": {
    "name": "New Marking Scheme",
    "description": "Description of the marking scheme",
    "is_default": false,
    "is_active": true
  },
  "grade_boundaries": {
    "A": 90,
    "B": 80,
    "C": 70,
    "D": 60,
    "F": 0
  },
  "negative_marking": {
    "enabled": true,
    "penalty_percentage": 25
  },
  "pass_threshold": 50.0,
  "weight_distribution": {
    "exam": 70,
    "assignments": 20,
    "participation": 10
  }
}
```

#### PUT `/api/admin/settings/marking-schemes/<scheme_id>/`
Update an existing marking scheme.

### 3. Exam Formats

#### GET `/api/admin/settings/exam-formats/`
Retrieve all exam formats.

**Response:**
```json
{
  "success": true,
  "exam_formats": [
    {
      "id": 1,
      "global_setting": {
        "id": 2,
        "name": "Standard 3-Hour Exam",
        "description": "Standard format for comprehensive exams",
        "is_default": true,
        "is_active": true
      },
      "sections": [
        {"name": "Multiple Choice", "question_count": 20, "points": 40},
        {"name": "Short Answer", "question_count": 5, "points": 30},
        {"name": "Essay", "question_count": 2, "points": 30}
      ],
      "time_limits": {
        "total_minutes": 180,
        "warning_minutes": 30
      },
      "question_distribution": {
        "easy": 40,
        "medium": 40,
        "hard": 20
      },
      "exam_structure": {
        "randomize_questions": true,
        "randomize_choices": true,
        "show_progress": true
      }
    }
  ]
}
```

#### POST `/api/admin/settings/exam-formats/`
Create a new exam format.

#### PUT `/api/admin/settings/exam-formats/<format_id>/`
Update an existing exam format.

### 4. Admin Overview APIs

#### GET `/api/admin/courses-overview/`
Get comprehensive overview of all courses with creator information.

**Query Parameters:**
- `search` (string): Search courses by code or name
- `creator` (int): Filter by creator user ID
- `term` (string): Filter by academic term

**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "id": 1,
      "code": "CS101",
      "name": "Introduction to Computer Science",
      "description": "Basic CS concepts",
      "term": "2025W1",
      "creator_name": "Dr. John Smith",
      "creator_email": "john.smith@university.edu",
      "creator_id": 5,
      "created_at": "2025-01-15T09:00:00Z",
      "student_count": 150,
      "exam_count": 3
    }
  ],
  "statistics": {
    "total_courses": 10,
    "active_courses": 8,
    "filtered_count": 1
  }
}
```

#### GET `/api/admin/exams-overview/`
Get comprehensive overview of all exams with course and creator information.

**Query Parameters:**
- `search` (string): Search exams by title
- `course` (int): Filter by course ID
- `status` (string): Filter by exam status

**Response:**
```json
{
  "success": true,
  "exams": [
    {
      "id": 1,
      "title": "Midterm Exam",
      "course_code": "CS101",
      "course_name": "Introduction to Computer Science",
      "creator_name": "Dr. John Smith",
      "status": "active",
      "start_time": "2025-02-15T14:00:00Z",
      "end_time": "2025-02-15T17:00:00Z",
      "duration_minutes": 180,
      "total_questions": 25,
      "total_marks": 100
    }
  ],
  "statistics": {
    "total_exams": 15,
    "active_exams": 5,
    "upcoming_exams": 3,
    "filtered_count": 1
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Specific error message"]
  }
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized
- `403`: Forbidden (not admin)
- `404`: Not Found
- `500`: Internal Server Error

## Features

### Flexible JSON Storage
Global settings use JSON fields for flexible configuration storage, allowing complex data structures without schema changes.

### Default Enforcement
Only one setting per type can be marked as default. Setting a new default automatically removes the default flag from other settings of the same type.

### Admin Permission Control
All endpoints enforce admin-only access using Django's permission system.

### Comprehensive Filtering
Overview endpoints support multiple filtering options for efficient data retrieval.

### Creator Tracking
All settings and overview data include creator information for audit trails.

## Frontend Integration Notes

1. **Authentication**: Ensure the user is authenticated as admin before making requests
2. **CSRF Protection**: Include CSRF tokens for POST/PUT requests
3. **Error Handling**: Handle all error responses appropriately
4. **Loading States**: Show loading indicators for API calls
5. **Validation**: Validate form data before submission
6. **Caching**: Consider caching settings data that doesn't change frequently

## Testing

The API includes comprehensive test coverage:
- Endpoint accessibility tests
- Permission boundary tests
- CRUD operation tests
- Data validation tests
- Default enforcement tests
- Overview functionality tests

Run tests with: `python manage.py test examvault.tests.test_global_settings`
