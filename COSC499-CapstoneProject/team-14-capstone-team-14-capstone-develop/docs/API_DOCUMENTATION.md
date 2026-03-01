# ExamVault API Documentation

Complete API reference for ExamVault's RESTful API endpoints.

## 🌐 Base URL

- **Development**: `http://localhost:8000/api/`
- **Production**: `https://your-domain.com/api/`

## 🔐 Authentication

ExamVault uses JWT (JSON Web Token) authentication for API access.

### Get Authentication Token
```bash
POST /api/users/token/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "access": "your-access-token",
  "refresh": "your-refresh-token"
}
```

### Using the Token
```bash
Authorization: Bearer your-access-token
```

### Refresh Token
```bash
POST /api/users/token/refresh/
Content-Type: application/json

{
  "refresh": "your-refresh-token"
}
```

## 👤 Users & Authentication

### Authentication Endpoints
- `POST /api/users/token/` - Get JWT token
- `POST /api/users/token/refresh/` - Refresh JWT token
- `POST /api/users/register/` - Register new instructor
- `POST /api/users/verify-email/` - Verify email address
- `POST /api/users/logout/` - Logout user
- `GET /api/users/health/` - Users service health check

### Password Management
- `POST /api/users/forgot-password/` - Request password reset
- `POST /api/users/validate-reset-token/` - Validate reset token
- `POST /api/users/reset-password/` - Reset password
- `POST /api/users/change-password/` - Change password

### User Profile
- `GET /api/users/profile/` - Get user profile
- `PUT /api/users/profile/` - Update user profile

## 🏫 Courses

### Course Management
- `GET /api/courses/` - List courses
- `POST /api/courses/` - Create course
- `GET /api/courses/{id}/` - Get course details
- `PUT /api/courses/{id}/` - Update course
- `DELETE /api/courses/{id}/` - Delete course
- `GET /api/courses/health/` - Courses service health check

### Instructor Management
- `GET /api/courses/instructor/` - Get instructor's courses
- `POST /api/courses/{id}/add_instructor/` - Add instructor to course
- `GET /api/courses/{id}/instructors/` - List course instructors

### Course Statistics
- `GET /api/courses/{id}/statistics/` - Get course statistics

### Preview & Import
- `POST /api/courses/{id}/preview-import/` - Preview question import

## 👥 Students (Nested under Courses)

### Student Management
- `GET /api/courses/{course_id}/students/` - List students
- `POST /api/courses/{course_id}/students/` - Add student
- `GET /api/courses/{course_id}/students/{id}/` - Get student details
- `PUT /api/courses/{course_id}/students/{id}/` - Update student
- `DELETE /api/courses/{course_id}/students/{id}/` - Delete student

### Bulk Operations
- `DELETE /api/courses/{course_id}/students/delete_all/` - Delete all students
- `POST /api/courses/{course_id}/students/anonymize_all/` - Anonymize all students
- `POST /api/courses/{course_id}/students/deanonymize_all/` - Deanonymize all students

### Import/Export
- `POST /api/courses/{course_id}/students/import_csv/` - Import students from CSV
- `GET /api/courses/{course_id}/students/export_csv/` - Export students to CSV

## 📝 Questions

### Question Management
- `GET /api/questions/` - Service root/ping
- `POST /api/questions/upload/` - Upload questions from file
- `GET /api/questions/all/` - List all questions
- `GET /api/questions/health/` - Questions service health check
- `GET /api/questions/ping/` - Service ping endpoint

### Question Banks
- `GET /api/questions/questionbanklist/{course_id}/` - List question banks for course
- `GET /api/questions/questionbank/{id}/` - Get question bank details
- `POST /api/questions/questionbank/` - Create question bank
- `PUT /api/questions/questionbank/{id}/` - Update question bank
- `DELETE /api/questions/questionbank/{id}/` - Delete question bank

### Individual Questions
- `GET /api/questions/questionlist/{questionbank_id}/` - List questions in bank
- `GET /api/questions/question/{id}/` - Get question details
- `POST /api/questions/question/` - Create question
- `PUT /api/questions/question/{id}/` - Update question
- `DELETE /api/questions/question/{id}/` - Delete question

## 📊 Exams

### Exam Management
- `GET /api/exams/` - List exams
- `POST /api/exams/` - Create exam
- `GET /api/exams/{id}/` - Get exam details
- `PUT /api/exams/{id}/` - Update exam
- `DELETE /api/exams/{id}/` - Delete exam

### Exam Variants
- `GET /api/exams/variants/` - List exam variants
- `POST /api/exams/variants/` - Create variant
- `GET /api/exams/variants/{id}/` - Get variant details
- `PUT /api/exams/variants/{id}/` - Update variant
- `DELETE /api/exams/variants/{id}/` - Delete variant

### Exam Templates
- `GET /api/exams/templates/layout/` - Get template layouts
- `GET /api/exams/templates/layout/{id}/` - Get specific template layout

### Admin Template Management
- `GET /api/exams/admin/templates/` - List admin templates
- `POST /api/exams/admin/templates/create/` - Create template
- `PUT /api/exams/admin/templates/{id}/update/` - Update template
- `DELETE /api/exams/admin/templates/{id}/delete/` - Delete template
- `POST /api/exams/admin/templates/{id}/set-default/` - Set default template

### Export History
- `GET /api/exams/export_history/` - List export history
- `POST /api/exams/export_history/` - Create export history entry

## 📈 Analytics

### Overview & Health
- `GET /api/analytics/health/` - Analytics service health check
- `GET /api/analytics/instructor/overview/` - Instructor overview analytics

### Performance Analytics
- `GET /api/analytics/questions/` - Question performance analytics
- `GET /api/analytics/grade-distribution/` - Grade distribution analytics
- `GET /api/analytics/performance-metrics/` - Performance metrics
- `GET /api/analytics/similarity-flags/` - Similarity flags for cheating detection

### Course Analytics
- `GET /api/analytics/courses/` - Course analytics
- `GET /api/analytics/search-courses/` - Search courses for analytics
- `GET /api/analytics/compare-courses/` - Compare course analytics
- `GET /api/analytics/course-statistics/{course_code}/` - Course statistics by code

### Trend Analysis
- `GET /api/analytics/trends/` - Year-over-year trends

### Student Reports
- `GET /api/analytics/student-report/{course_id}/{student_id}/` - Student report
- `GET /api/analytics/student-report/{course_id}/{student_id}/export/` - Export student report
- `GET /api/analytics/student-report/{course_id}/{student_id}/export/csv/` - Export as CSV
- `GET /api/analytics/student-report/{course_id}/{student_id}/export/docx/` - Export as DOCX

### Variant Analytics
- `GET /api/analytics/variant-set/{exam_id}/{variant_ids}/` - Variant set analytics

### Bulk Export
- `GET /api/analytics/course/{course_id}/bulk-export/` - Bulk export course data
- `GET /api/analytics/course/{course_id}/bulk-export/{format}/` - Bulk export in specific format

### Debug Endpoints (Development)
- `GET /api/analytics/debug-simple/` - Simple debug export
- `GET /api/analytics/debug-csv/` - Debug CSV export
- `GET /api/analytics/debug-pdf/` - Debug PDF export
- `GET /api/analytics/debug-docx/` - Debug DOCX export

## 📋 Results

### Results Management
- `GET /api/results/` - Results service root
- `POST /api/results/upload/` - Upload results
- `GET /api/results/health/` - Results service health check

### Exam Results
- `GET /api/results/instructor/exams/{exam_id}/results/` - Get all exam results
- `GET /api/results/instructor/exams/{exam_id}/results/{student_id}/` - Get student result
- `GET /api/results/instructor/courses/{course_id}/results/summary/` - Course results summary

### Export Results
- `GET /api/results/export/{exam_id}/csv/` - Export results as CSV
- `GET /api/results/export/{exam_id}/pdf/` - Export results as PDF
- `GET /api/results/export/{exam_id}/docx/` - Export results as DOCX

### OMR (Optical Mark Recognition)
- `POST /api/results/instructor/exams/{exam_id}/omr/import/` - Import OMR data
- `POST /api/results/instructor/exams/{exam_id}/omr/validate/` - Validate OMR data
- `GET /api/results/instructor/exams/{exam_id}/omr/templates/` - Get OMR templates
- `GET /api/results/instructor/exams/{exam_id}/omr/history/` - OMR import history

### Exam Results API
- `GET /api/results/exam-results/` - List exam results (ViewSet)
- `POST /api/results/exam-results/` - Create exam result
- `GET /api/results/exam-results/{id}/` - Get exam result details
- `PUT /api/results/exam-results/{id}/` - Update exam result
- `DELETE /api/results/exam-results/{id}/` - Delete exam result

## 🔧 Admin Endpoints

### Admin Authentication
- `POST /api/admin/login/` - Admin login
- `POST /api/admin/logout/` - Admin logout
- `POST /api/admin/refresh/` - Refresh admin session
- `GET /api/admin/csrf-token/` - Get CSRF token

### Admin Dashboard
- `GET /api/admin/stats/` - Admin dashboard statistics
- `GET /api/admin/health/` - Admin health check
- `GET /api/admin/recent-activity/` - Recent activity logs

### User Management
- `GET /api/admin/users/` - List all users
- `GET /api/admin/users/{user_id}/` - Get user details
- `POST /api/admin/users/update/` - Update user
- `DELETE /api/admin/users/delete/` - Delete user

### Instructor Management
- `GET /api/admin/instructors/` - List instructors
- `GET /api/admin/instructors/{instructor_id}/` - Get instructor details
- `POST /api/admin/instructors/bulk/` - Bulk instructor operations

### Course & Exam Overview
- `GET /api/admin/courses-overview/` - Course overview for admin
- `GET /api/admin/exams-overview/` - Exam overview for admin

### Global Settings (Advanced)
- `GET /api/admin/settings/` - Get global settings
- `POST /api/admin/settings/` - Create global setting
- `PUT /api/admin/settings/` - Update global setting

### Marking Schemes
- `GET /api/admin/settings/marking-schemes/` - Get marking schemes
- `POST /api/admin/settings/marking-schemes/` - Create marking scheme
- `PUT /api/admin/settings/marking-schemes/{id}/` - Update marking scheme

### Exam Formats
- `GET /api/admin/settings/exam-formats/` - Get exam formats
- `POST /api/admin/settings/exam-formats/` - Create exam format
- `PUT /api/admin/settings/exam-formats/{id}/` - Update exam format

### Privacy & Audit
- `GET /api/admin/privacy-audit-log/` - Privacy audit logs

### Templates
- `GET /api/admin/templates/` - Admin template management

## 🌐 Global Endpoints

### Health Checks
- `GET /api/health/` - Global health check
- `GET /api/courses/health/` - Courses service health
- `GET /api/questions/health/` - Questions service health
- `GET /api/users/health/` - Users service health
- `GET /api/analytics/health/` - Analytics service health
- `GET /api/results/health/` - Results service health

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Field-specific error message"]
  }
}
```

### Paginated Response
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/endpoint/?page=2",
  "previous": null,
  "results": [
    // Array of objects
  ]
}
```

## 🔒 HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content returned
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - HTTP method not supported
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## 🔄 Rate Limiting

- **Authenticated Users**: 1000 requests per hour
- **Anonymous Users**: 100 requests per hour

## 📖 Example Usage

### Create a Course
```bash
POST /api/courses/
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "description": "Basic computer science concepts and programming fundamentals",
  "term": "2025W1"
}
```

### Add Students to Course
```bash
POST /api/courses/1/students/import_csv/
Authorization: Bearer your-access-token
Content-Type: multipart/form-data

file: students.csv
```

### Create Exam
```bash
POST /api/exams/
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "title": "Midterm Exam",
  "course": 1,
  "exam_type": "midterm",
  "time_limit": 120,
  "weight": 30.0,
  "questions_per_variant": 20,
  "num_variants": 3,
  "easy_percentage": 30,
  "medium_percentage": 50,
  "hard_percentage": 20
}
```

### Upload Questions
```bash
POST /api/questions/upload/
Authorization: Bearer your-access-token
Content-Type: multipart/form-data

file: questions.csv
course_id: 1
```

### Get Analytics
```bash
GET /api/analytics/instructor/overview/
Authorization: Bearer your-access-token
```

## 🛠️ Development Tools

### Python SDK Example
```python
import requests

class ExamVaultAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_courses(self):
        """Get list of courses"""
        response = requests.get(f'{self.base_url}/api/courses/', headers=self.headers)
        return response.json()
    
    def create_exam(self, exam_data):
        """Create new exam"""
        response = requests.post(f'{self.base_url}/api/exams/', 
                               json=exam_data, headers=self.headers)
        return response.json()
    
    def get_analytics(self):
        """Get instructor analytics overview"""
        response = requests.get(f'{self.base_url}/api/analytics/instructor/overview/', 
                               headers=self.headers)
        return response.json()

# Usage
api = ExamVaultAPI('http://localhost:8000', 'your-access-token')
courses = api.get_courses()
```

### cURL Examples
```bash
# Get JWT Token
curl -X POST http://localhost:8000/api/users/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "instructor@test.com", "password": "password123"}'

# List Courses
curl -X GET http://localhost:8000/api/courses/ \
  -H "Authorization: Bearer your-access-token"

# Create Question Bank
curl -X POST http://localhost:8000/api/questions/questionbank/ \
  -H "Authorization: Bearer your-access-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Chapter 1 Questions", "course": 1}'
```

## 🔗 Related Documentation

- [Testing Guide](./TESTING_GUIDE.md) - API testing procedures
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md) - Common API issues
- [Exam Creation Guide](./EXAM_CREATION_GUIDE.md) - Exam workflow documentation

## 📞 Support

For API support:

1. **Check error responses** for specific error messages
2. **Verify authentication** tokens are valid and not expired
3. **Check the [troubleshooting guide](./TROUBLESHOOTING_GUIDE.md)** for common issues
4. **Review endpoint documentation** for required parameters
5. **Test with curl** or Postman to isolate issues

---

*This documentation covers all available ExamVault API endpoints. For implementation details, refer to the service-specific README files in the codebase.*
