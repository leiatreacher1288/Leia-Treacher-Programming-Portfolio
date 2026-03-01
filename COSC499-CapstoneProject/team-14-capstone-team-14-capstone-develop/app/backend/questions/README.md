# Questions Service

## Overview

The Questions service manages the question banking system in ExamVault, providing comprehensive tools for creating, organizing, and managing questions across multiple formats. This service supports multi-format import, intelligent categorization, and advanced question management features.

## 🏗️ Architecture

### Models

#### QuestionBank
Organizes questions into logical collections for easy management.

**Key Fields:**
- `title`: Bank name and identifier
- `description`: Detailed description of question bank
- `course`: Associated course
- `created_by`: User who created the bank
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

#### Question
Represents individual questions with comprehensive metadata.

**Core Fields:**
- `bank`: Associated question bank
- `prompt`: The question text
- `choices`: JSON array of answer choices
- `correct_answer`: JSON array of correct answers (supports multi-answer)
- `points`: Point value for the question
- `difficulty`: Difficulty level (Easy, Medium, Hard)
- `tags`: JSON array of categorization tags
- `explanation`: Explanation shown after answering

**Advanced Features:**
- `partial_credit_enabled`: Support for partial credit scoring
- `incorrect_penalty`: Penalty for incorrect selections
- `created_by`: Question creator
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

## 🔧 API Endpoints

### Question Bank Management

```http
GET    /api/question-banks/             # List all question banks
POST   /api/question-banks/             # Create new question bank
GET    /api/question-banks/{id}/        # Get bank details
PUT    /api/question-banks/{id}/        # Update bank
DELETE /api/question-banks/{id}/        # Delete bank
```

### Question Management

```http
GET    /api/questions/                  # List all questions
POST   /api/questions/                  # Create new question
GET    /api/questions/{id}/             # Get question details
PUT    /api/questions/{id}/             # Update question
DELETE /api/questions/{id}/             # Delete question
```

### Import Operations

```http
POST   /api/questions/import/           # Import questions from file
GET    /api/questions/import/preview/   # Preview import data
POST   /api/questions/import/validate/  # Validate import data
```

### Bulk Operations

```http
POST   /api/questions/bulk-update/      # Bulk update questions
DELETE /api/questions/bulk-delete/      # Bulk delete questions
POST   /api/questions/bulk-move/        # Move questions between banks
```

## 📊 Features

### Question Creation & Management
- **Multiple Choice Support**: Full multiple choice question support
- **Multi-Answer Questions**: Support for questions with multiple correct answers
- **Partial Credit**: Advanced scoring with partial credit support
- **Difficulty Levels**: Easy, Medium, Hard categorization
- **Tagging System**: Flexible categorization with tags
- **Explanations**: Detailed explanations for learning

### Import & Export
- **Multi-Format Import**: CSV, DOCX, PDF support
- **Bulk Operations**: Efficient bulk question management
- **Preview Functionality**: Preview imports before processing
- **Validation**: Comprehensive import validation
- **Error Handling**: Detailed error reporting for imports

### Organization & Categorization
- **Question Banks**: Logical grouping of questions
- **Course Association**: Questions tied to specific courses
- **Tagging System**: Flexible categorization
- **Difficulty Distribution**: Automatic difficulty tracking
- **Search & Filter**: Advanced search capabilities

### Advanced Features
- **Partial Credit Scoring**: Support for complex scoring scenarios
- **Penalty System**: Configurable penalties for incorrect answers
- **Audit Trails**: Complete tracking of question modifications
- **Version Control**: Track question changes over time
- **Performance Analytics**: Question performance tracking

## 🛠️ Usage Examples

### Creating a Question Bank

```python
from questions.models import QuestionBank

# Create question bank
bank = QuestionBank.objects.create(
    title="Introduction to Programming",
    description="Basic programming concepts and syntax",
    course=course,
    created_by=instructor
)
```

### Creating Questions

```python
from questions.models import Question

# Single answer question
question = Question.objects.create(
    bank=bank,
    prompt="What is the primary purpose of a variable in programming?",
    choices=[
        "To store data",
        "To display text",
        "To create functions",
        "To define classes"
    ],
    correct_answer=[0],  # First choice is correct
    points=1.0,
    difficulty=1,  # Easy
    tags=["variables", "basics"],
    explanation="Variables are used to store and manage data in programs."
)

# Multi-answer question
multi_question = Question.objects.create(
    bank=bank,
    prompt="Which of the following are valid data types in Python?",
    choices=[
        "int",
        "string",
        "boolean",
        "array"
    ],
    correct_answer=[0, 1, 2],  # Multiple correct answers
    points=2.0,
    difficulty=2,  # Medium
    partial_credit_enabled=True,
    incorrect_penalty=0.5,
    tags=["data-types", "python"]
)
```

### Importing Questions

```python
from questions.utils.file_import import import_questions_from_file

# Import from CSV
questions = import_questions_from_file(
    file_path="questions.csv",
    file_type="csv",
    bank=bank
)

# Import from DOCX
questions = import_questions_from_file(
    file_path="questions.docx",
    file_type="docx",
    bank=bank
)
```

### Bulk Operations

```python
from questions.models import Question

# Bulk update difficulty
Question.objects.filter(bank=bank).update(difficulty=2)

# Bulk move questions
questions = Question.objects.filter(tags__contains=["old-tag"])
for question in questions:
    question.bank = new_bank
    question.save()
```

## 📁 File Import Formats

### CSV Format
```csv
prompt,choices,correct_answer,points,difficulty,tags,explanation
"What is 2+2?",["3","4","5","6"],[1],1.0,1,"math,basics","Basic addition"
```

### DOCX Format
- **Plain Text**: Questions separated by blank lines
- **Structured**: Questions with numbered choices
- **Auto-Parsing**: Intelligent question detection

### PDF Format
- **Text Extraction**: OCR-based text extraction
- **Format Detection**: Automatic format recognition
- **Error Handling**: Robust error reporting

## 🔒 Security & Permissions

### Access Control
- **Bank Ownership**: Only bank creators can modify banks
- **Course Association**: Questions tied to specific courses
- **Instructor Permissions**: Role-based access to question management
- **Audit Trails**: Complete tracking of all modifications

### Data Validation
- **Input Validation**: Comprehensive validation of question data
- **Format Validation**: Import format validation
- **Content Validation**: Question content quality checks
- **Security Checks**: Malicious content detection

## 🧪 Testing

### Running Tests

```bash
# Run all question tests
python manage.py test questions

# Run specific test categories
python manage.py test questions.tests.test_models
python manage.py test questions.tests.test_import
python manage.py test questions.tests.test_api
```

### Test Coverage

The questions service includes comprehensive tests covering:
- Model validation and relationships
- Import functionality for all formats
- Bulk operations and performance
- API endpoint security
- Business logic validation
- Edge cases and error handling

## 📈 Performance Considerations

### Database Optimization
- **Indexed Fields**: Optimized queries on frequently accessed fields
- **Selective Loading**: Efficient relationship loading
- **Bulk Operations**: Optimized bulk question operations
- **Caching**: Redis-based caching for question data

### Import Performance
- **Background Processing**: Heavy imports use async processing
- **Batch Processing**: Large imports are processed in batches
- **Memory Management**: Efficient memory usage for large files
- **Progress Tracking**: Import progress updates and status

## 🔄 Migration History

### Recent Changes
- **v1.0**: Initial question management system
- **v1.1**: Added multi-format import support
- **v1.2**: Implemented partial credit scoring
- **v1.3**: Enhanced bulk operations
- **v1.4**: Added performance analytics
- **v1.5**: Improved import validation

## 📚 Related Documentation

- [API Documentation](../docs/api/README.md)
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING_GUIDE.md)

## 🤝 Contributing

When contributing to the questions service:

1. **Test Imports**: Ensure all import formats work correctly
2. **Validate Data**: Test with various question formats
3. **Performance**: Consider performance with large datasets
4. **Update Documentation**: Keep import guides current
5. **Security**: Validate all input data thoroughly

## 📞 Support

For issues related to the questions service:
- Check the [troubleshooting guide](../docs/TROUBLESHOOTING_GUIDE.md)
- Review the [API documentation](../docs/api/README.md)
- Create an issue with the `questions` label
