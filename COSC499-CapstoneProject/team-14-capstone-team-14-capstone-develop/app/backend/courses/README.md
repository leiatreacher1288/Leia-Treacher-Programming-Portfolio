# Courses Service

## Overview

The Courses service manages all course-related functionality in ExamVault, including course creation, instructor assignments, student enrollment, and course analytics. This is a core service that provides the foundation for exam management and student organization.

## 🏗️ Architecture

### Models

#### Course
The central model representing an academic course.

**Key Fields:**
- `code`: Unique course identifier (max 10 characters)
- `name`: Course title (e.g., "Introduction to Algorithms")
- `description`: Detailed course description
- `term`: Academic term (e.g., "Fall 2025")
- `banner`: Optional course banner image
- `creator`: User who created the course
- `instructor`: Optional display name override
- `instructors`: Many-to-many relationship with users through CourseInstructor

**Access Control:**
- `default_sec_access`: Default access for Secondary Instructors
- `default_ta_access`: Default access for Teaching Assistants
- `default_oth_access`: Default access for Other instructors

#### CourseInstructor
Manages instructor-course relationships with role-based access control.

**Roles:**
- `MAIN`: Primary instructor with full access
- `SEC`: Secondary instructor
- `TA`: Teaching Assistant
- `OTH`: Other instructor roles

**Access Levels:**
- `FULL`: Complete access to course and exams
- `LIMITED`: View-only access
- `NONE`: No access

#### Student
Represents enrolled students in a course.

**Key Features:**
- Anonymous student support with `anonymous_id`
- Preferred name support
- Section-based organization
- Enrollment tracking with drop dates

#### CourseActivity
Tracks all activities within a course for collaboration and audit purposes.

**Activity Types:**
- Course operations (created, updated)
- Exam operations (created, updated, deleted, exported)
- Question operations (added, removed)
- Student operations (added, removed)
- Instructor operations (added, removed)

#### CourseExportHistory
Tracks course export operations for compliance and audit trails.

## 🔧 API Endpoints

### Course Management

```http
GET    /api/courses/                    # List all courses
POST   /api/courses/                    # Create new course
GET    /api/courses/{id}/               # Get course details
PUT    /api/courses/{id}/               # Update course
DELETE /api/courses/{id}/               # Delete course
```

### Instructor Management

```http
GET    /api/courses/{id}/instructors/   # List course instructors
POST   /api/courses/{id}/instructors/   # Add instructor
PUT    /api/courses/{id}/instructors/{user_id}/  # Update instructor access
DELETE /api/courses/{id}/instructors/{user_id}/  # Remove instructor
```

### Student Management

```http
GET    /api/courses/{id}/students/      # List enrolled students
POST   /api/courses/{id}/students/      # Add student
PUT    /api/courses/{id}/students/{student_id}/  # Update student
DELETE /api/courses/{id}/students/{student_id}/  # Remove student
```

### Course Activities

```http
GET    /api/courses/{id}/activities/    # Get course activity log
```

## 📊 Features

### Course Creation & Management
- **Flexible Course Setup**: Create courses with detailed metadata
- **Instructor Assignment**: Multi-role instructor system with access control
- **Student Enrollment**: Bulk student import and management
- **Course Analytics**: Performance tracking and insights

### Collaboration Features
- **Multi-Instructor Support**: Multiple instructors per course
- **Role-Based Access**: Granular permissions for different instructor types
- **Activity Tracking**: Complete audit trail of course changes
- **Collaboration Features**: Multi-instructor course management

### Student Management
- **Anonymous Students**: Support for anonymous exam takers
- **Section Organization**: Group students by sections
- **Enrollment Tracking**: Complete enrollment lifecycle management
- **Bulk Operations**: Import/export student rosters

### Export & Compliance
- **Course Export**: Complete course data export
- **Audit Trails**: Detailed activity logging
- **Compliance Ready**: GDPR and privacy compliance features

## 🛠️ Usage Examples

### Creating a Course

```python
from courses.models import Course, CourseInstructor

# Create course
course = Course.objects.create(
    code="COSC101",
    name="Introduction to Computer Science",
    description="Fundamental concepts of programming",
    term="Fall 2025",
    creator=user
)

# Add instructor
CourseInstructor.objects.create(
    course=course,
    user=instructor,
    role=CourseInstructor.Role.MAIN,
    access=CourseInstructor.Access.FULL,
    accepted=True
)
```

### Managing Students

```python
from courses.models import Student

# Add student
student = Student.objects.create(
    course=course,
    name="John Doe",
    student_id="12345",
    email="john@example.com",
    section="A01"
)

# Anonymous student
anonymous_student = Student.objects.create(
    course=course,
    name="Anonymous",
    student_id="ANON001",
    is_anonymous=True,
    anonymous_id="A001"
)
```

### Activity Tracking

```python
from courses.models import CourseActivity

# Log course activity
CourseActivity.objects.create(
    course=course,
    user=user,
    activity_type=CourseActivity.ActivityType.EXAM_CREATED,
    description="Created midterm exam",
    entity_type="exam",
    entity_id=exam.id
)
```

## 🔒 Security & Permissions

### Access Control
- **Course Creator**: Full access to course and all features
- **Main Instructor**: Full access to course management
- **Secondary Instructor**: Configurable access levels
- **Teaching Assistant**: Limited access for grading
- **Other Instructors**: Minimal access for specific tasks

### Data Privacy
- **Anonymous Students**: Support for privacy-compliant anonymous testing
- **Audit Trails**: Complete activity logging for compliance
- **Data Export**: Controlled export with tracking

## 🧪 Testing

### Running Tests

```bash
# Run all course tests
python manage.py test courses

# Run specific test files
python manage.py test courses.tests.test_models
python manage.py test courses.tests.test_views
python manage.py test courses.tests.test_api
```

### Test Coverage

The courses service includes comprehensive tests covering:
- Model validation and relationships
- API endpoint functionality
- Permission and access control
- Business logic validation
- Edge cases and error handling

## 📈 Performance Considerations

### Database Optimization
- **Indexed Fields**: Optimized queries on frequently accessed fields
- **Selective Loading**: Efficient relationship loading
- **Caching**: Redis-based caching for course data

### Scalability
- **Bulk Operations**: Efficient bulk student/instructor management
- **Pagination**: API responses are paginated for large datasets
- **Background Tasks**: Heavy operations use async processing

## 🔄 Migration History

### Recent Changes
- **v1.0**: Initial course management system
- **v1.1**: Added multi-instructor support
- **v1.2**: Implemented role-based access control
- **v1.3**: Added anonymous student support
- **v1.4**: Enhanced activity tracking and audit trails

## 📚 Related Documentation

- [API Documentation](../docs/api/README.md)
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING_GUIDE.md)

## 🤝 Contributing

When contributing to the courses service:

1. **Follow Django Best Practices**: Use Django conventions and patterns
2. **Write Tests**: All new features must include tests
3. **Update Documentation**: Keep this README and API docs current
4. **Consider Permissions**: Always consider access control implications
5. **Test Edge Cases**: Consider anonymous students and multi-instructor scenarios

## 📞 Support

For issues related to the courses service:
- Check the [troubleshooting guide](../docs/TROUBLESHOOTING_GUIDE.md)
- Review the [API documentation](../docs/api/README.md)
- Create an issue with the `courses` label
