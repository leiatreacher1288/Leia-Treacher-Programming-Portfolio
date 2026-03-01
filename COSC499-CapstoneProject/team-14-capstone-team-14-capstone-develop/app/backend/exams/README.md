# Exams Service

## Overview

The Exams service is the core examination management system in ExamVault, handling exam creation, variant generation, PDF/DOCX export, and anti-cheating features. This service provides comprehensive tools for creating paper-based exams with multiple variants and analyzing uploaded results with advanced security measures.

## 🏗️ Architecture

### Models

#### Exam
The central model representing an examination with configurable parameters.

**Key Fields:**
- `title`: Exam title and identifier
- `description`: Detailed exam description
- `exam_type`: Type of exam (quiz, midterm, final, practice)
- `course`: Associated course
- `time_limit`: Duration in minutes (0 for unlimited)
- `weight`: Percentage of course grade
- `required_to_pass`: Whether exam is required to pass course

**Variant Generation Settings:**
- `num_variants`: Number of variants to generate (1-26)
- `questions_per_variant`: Questions per variant
- `randomize_questions`: Whether to randomize question order
- `randomize_choices`: Whether to randomize answer choices
- `allow_reuse`: Whether to allow question reuse between variants

**Difficulty Distribution:**
- `easy_percentage`: Percentage of easy questions
- `medium_percentage`: Percentage of medium questions
- `hard_percentage`: Percentage of hard questions
- `unknown_percentage`: Percentage of unknown difficulty

**Availability:**
- `available_from`: Start date/time
- `available_until`: End date/time
- `show_answers_after`: Whether to show answers after submission

#### ExamSection
Organizes questions into logical sections within an exam.

**Features:**
- `title`: Section title
- `instructions`: Section-specific instructions
- `order`: Section ordering
- `question_banks`: Associated question banks
- `configured_question_count`: Target questions per section

#### Variant
Different versions of an exam to prevent cheating.

**Key Features:**
- `version_label`: Version identifier (A, B, C, etc.)
- `questions`: Questions assigned to this variant
- `is_locked`: Whether variant is locked for editing
- `exported_at`: Export timestamp

#### StudentVariantAssignment
Tracks which student receives which variant for paper exams to enable proper grading of uploaded results.

**Features:**
- `student`: Assigned student
- `exam`: Associated exam
- `variant`: Assigned variant
- `seat_number`: Physical seat assignment
- `row_number`: Row assignment for seating
- `notes`: Administrative notes

#### ExamTemplate
Reusable exam layout templates for consistency.

**Features:**
- `name`: Template name
- `layout_data`: JSON configuration
- `is_default`: Whether template is default
- `created_by`: Template creator

#### ExamExportHistory
Tracks exam export operations for audit trails.

**Export Formats:**
- PDF: Portable Document Format
- DOCX: Microsoft Word format
- Both: Multiple format export

## 🔧 API Endpoints

### Exam Management

```http
GET    /api/exams/                    # List all exams
POST   /api/exams/                    # Create new exam
GET    /api/exams/{id}/               # Get exam details
PUT    /api/exams/{id}/               # Update exam
DELETE /api/exams/{id}/               # Delete exam
```

### Variant Management

```http
GET    /api/exams/{id}/variants/      # List exam variants
POST   /api/exams/{id}/variants/      # Generate variants
GET    /api/exams/{id}/variants/{variant_id}/  # Get variant details
PUT    /api/exams/{id}/variants/{variant_id}/  # Update variant
DELETE /api/exams/{id}/variants/{variant_id}/  # Delete variant
```

### Student Assignment

```http
GET    /api/exams/{id}/assignments/   # List student assignments
POST   /api/exams/{id}/assignments/   # Assign variants to students
PUT    /api/exams/{id}/assignments/{assignment_id}/  # Update assignment
DELETE /api/exams/{id}/assignments/{assignment_id}/  # Remove assignment
```

### Export Operations

```http
POST   /api/exams/{id}/export/        # Export exam variants
GET    /api/exams/{id}/export-history/  # Get export history
```

### Template Management

```http
GET    /api/exam-templates/           # List exam templates
POST   /api/exam-templates/           # Create template
GET    /api/exam-templates/{id}/      # Get template details
PUT    /api/exam-templates/{id}/      # Update template
DELETE /api/exam-templates/{id}/      # Delete template
```

## 📊 Features

### Exam Creation & Configuration
- **Flexible Exam Types**: Quiz, midterm, final, practice exams
- **Time Limits**: Configurable duration with unlimited option
- **Weight-Based Scoring**: Percentage-based grade contribution
- **Difficulty Distribution**: Automatic question selection by difficulty
- **Question Randomization**: Randomize questions and answer choices
- **Variant Generation**: Multiple exam versions for security

### Anti-Cheating Features
- **Variant Assignment**: Unique exam versions per student for paper exams
- **Seating Arrangements**: Physical seat and row assignments for distributed exams
- **Question Shuffling**: Randomize question order across variants
- **Choice Shuffling**: Randomize answer choices within questions
- **Export Tracking**: Complete audit trail of exam exports

### Question Management
- **Section Organization**: Logical grouping of questions
- **Question Banks**: Reusable question collections
- **Mandatory Questions**: Required questions across all variants
- **Question Budgeting**: Control total question pool size
- **Partial Credit**: Support for multi-answer questions

### Export & Documentation
- **Multiple Formats**: PDF and DOCX export support
- **Custom Instructions**: Exam-specific instructions and formatting
- **Academic Integrity**: Built-in integrity statements
- **Template System**: Reusable exam layouts
- **Export History**: Complete audit trail

## 🛠️ Usage Examples

### Creating an Exam

```python
from exams.models import Exam, ExamSection

# Create exam
exam = Exam.objects.create(
    title="Midterm Exam",
    description="Covers chapters 1-5",
    exam_type="midterm",
    course=course,
    time_limit=90,
    weight=25.0,
    num_variants=3,
    questions_per_variant=20,
    easy_percentage=30,
    medium_percentage=50,
    hard_percentage=20,
    randomize_questions=True,
    randomize_choices=True,
    created_by=instructor
)

# Add section
section = ExamSection.objects.create(
    exam=exam,
    title="Multiple Choice",
    instructions="Choose the best answer",
    order=1,
    configured_question_count=15
)
```

### Generating Variants

```python
from exams.models import Variant

# Generate variants
variants = exam.generate_variants()

# Assign variants to students
from exams.models import StudentVariantAssignment

for i, student in enumerate(students):
    variant = variants[i % len(variants)]
    StudentVariantAssignment.objects.create(
        student=student,
        exam=exam,
        variant=variant,
        seat_number=f"A{i+1}",
        row_number="1"
    )
```

### Exporting Exams

```python
from exams.services import ExamExportService

# Export exam variants
export_service = ExamExportService(exam)
export_result = export_service.export_variants(
    format="both",  # PDF and DOCX
    variants=exam.variants.all()
)

# Track export
ExamExportHistory.objects.create(
    exam=exam,
    exported_by=user,
    export_format="both",
    variants_exported=exam.variants.all()
)
```

## 🔒 Security & Anti-Cheating

### Variant Security
- **Unique Variants**: Students receive different exam versions for paper distribution
- **Question Shuffling**: Questions and answers are shuffled

### Export Security
- **Controlled Exports**: Only authorized users can export exams
- **Export Tracking**: All exports are logged with user and timestamp
- **Format Control**: Support for multiple export formats
- **Variant Locking**: Prevent unauthorized variant modifications

### Access Control
- **Instructor Permissions**: Role-based access to exam management
- **Course Association**: Exams are tied to specific courses
- **Time Restrictions**: Configurable availability windows
- **Audit Trails**: Complete logging of all exam operations

## 🧪 Testing

### Running Tests

```bash
# Run all exam tests
python manage.py test exams

# Run specific test categories
python manage.py test exams.tests.test_models
python manage.py test exams.tests.test_views
python manage.py test exams.tests.test_variants
python manage.py test exams.tests.test_export
```

### Test Coverage

The exams service includes comprehensive tests covering:
- Model validation and relationships
- Variant generation algorithms
- Export functionality
- Anti-cheating features
- API endpoint security
- Business logic validation

## 📈 Performance Considerations

### Database Optimization
- **Indexed Fields**: Optimized queries on exam and variant fields
- **Selective Loading**: Efficient relationship loading for large datasets
- **Caching**: Redis-based caching for exam configurations

### Scalability
- **Background Processing**: Heavy operations use async processing
- **Batch Operations**: Efficient bulk variant generation
- **Pagination**: API responses are paginated for large datasets
- **Export Optimization**: Efficient PDF/DOCX generation

## 🔄 Migration History

### Recent Changes
- **v1.0**: Initial exam management system
- **v1.1**: Added variant generation
- **v1.2**: Implemented anti-cheating features
- **v1.3**: Added export functionality
- **v1.4**: Add 6 step wizard for better flow
- **v1.5**: Enhanced template system with marking scheme

## 📚 Related Documentation

- [API Documentation](../docs/api/README.md)
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING_GUIDE.md)

## 🤝 Contributing

When contributing to the exams service:

1. **Security First**: Always consider anti-cheating implications
2. **Test Variants**: Ensure variant generation works correctly
3. **Validate Exports**: Test export functionality thoroughly
4. **Update Documentation**: Keep API docs and guides current
5. **Consider Performance**: Test with large datasets

## 📞 Support

For issues related to the exams service:
- Check the [troubleshooting guide](../docs/TROUBLESHOOTING_GUIDE.md)
- Review the [API documentation](../docs/api/README.md)
- Create an issue with the `exams` label
