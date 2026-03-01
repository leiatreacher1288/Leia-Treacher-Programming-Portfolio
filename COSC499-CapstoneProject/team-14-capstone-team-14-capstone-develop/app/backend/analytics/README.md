# Analytics Service

## Overview

The Analytics service provides comprehensive data analysis and reporting capabilities for ExamVault, including student performance analytics from uploaded OMR results, similarity detection, and detailed insights for instructors and administrators. This service processes uploaded exam results, generates reports, and provides actionable insights for educational improvement.

## 🏗️ Architecture

### Models

#### QuestionPerformance
Tracks question-level performance across all exams and variants.

**Key Fields:**
- `question`: Associated question
- `total_attempts`: Total number of attempts
- `incorrect_attempts`: Number of incorrect attempts
- `miss_rate`: Calculated miss rate percentage

#### SimilarityCheck
Records similarity analysis between student answer sets for collusion detection.

**Key Fields:**
- `exam_variant`: Associated exam variant
- `student_a_id`: First student identifier
- `student_b_id`: Second student identifier
- `similarity_score`: Similarity percentage (0-100)
- `flagged`: Whether score exceeds threshold
- `checked_at`: Analysis timestamp

#### SimilarityFlag
Enhanced similarity detection with severity levels and review workflow.

**Key Fields:**
- `exam`: Associated exam
- `variant`: Specific exam variant
- `student1`: First student
- `student2`: Second student
- `similarity_score`: Similarity percentage
- `severity`: Risk level (low, medium, high)
- `status`: Review status (pending, reviewed, dismissed, confirmed)
- `flagged_questions`: JSON array of identical answer questions
- `reviewer`: User who reviewed the flag
- `notes`: Review notes and comments

#### ScoreDistribution
Aggregated statistics for entire exams across all variants.

**Key Fields:**
- `exam`: Associated exam
- `mean`: Average score
- `median`: Median score
- `std_dev`: Standard deviation
- `histogram_json`: Bucketed histogram data
- `generated_at`: Analysis timestamp

## 🔧 API Endpoints

### Performance Analytics

```http
GET    /api/analytics/performance/       # Get performance analytics
GET    /api/analytics/performance/{exam_id}/  # Get exam-specific performance
GET    /api/analytics/questions/         # Get question performance data
GET    /api/analytics/students/          # Get student performance data
```

### Similarity Detection Analytics

```http
GET    /api/analytics/similarity/        # Get similarity analysis
GET    /api/analytics/similarity/{exam_id}/  # Get exam-specific similarity
POST   /api/analytics/similarity/scan/   # Trigger similarity scan
GET    /api/analytics/flags/             # Get similarity flags
PUT    /api/analytics/flags/{id}/        # Update flag status
```

### Score Analytics

```http
GET    /api/analytics/scores/            # Get score distributions
GET    /api/analytics/scores/{exam_id}/  # Get exam-specific scores
POST   /api/analytics/scores/generate/   # Generate score analysis
```

### Export Operations

```http
POST   /api/analytics/export/            # Export analytics data
GET    /api/analytics/export/history/    # Get export history
GET    /api/analytics/export/{id}/       # Download export file
```

## 📊 Features

### Performance Analytics
- **Question Performance**: Track individual question success rates
- **Student Performance**: Analyze student performance patterns
- **Exam Analytics**: Comprehensive exam-level insights
- **Trend Analysis**: Performance trends over time
- **Comparative Analysis**: Compare performance across exams

### Similarity Detection
- **Answer Pattern Analysis**: Detect similar answer patterns in uploaded results
- **Collusion Detection**: Identify potential collaboration in paper exam results
- **Flag Management**: Review and manage similarity flags
- **Severity Assessment**: Risk-based flag categorization
- **Review Workflow**: Structured review process

### Score Analytics
- **Distribution Analysis**: Statistical score distributions
- **Histogram Generation**: Visual score distributions
- **Statistical Measures**: Mean, median, standard deviation
- **Performance Benchmarks**: Set and track performance goals
- **Trend Analysis**: Score trends over time

### Reporting & Export
- **Comprehensive Reports**: Detailed performance reports
- **Multiple Formats**: CSV, PDF, Excel export
- **Customizable Reports**: Configurable report parameters
- **Scheduled Reports**: Automated report generation
- **Uploaded Results Analytics**: Performance monitoring from OMR imports

## 🛠️ Usage Examples

### Question Performance Analysis

```python
from analytics.models import QuestionPerformance

# Get question performance
performance = QuestionPerformance.objects.get(question=question)
print(f"Miss rate: {performance.miss_rate:.2%}")

# Analyze all questions in an exam
exam_questions = Question.objects.filter(exams=exam)
performances = QuestionPerformance.objects.filter(question__in=exam_questions)

for perf in performances:
    print(f"Question {perf.question.id}: {perf.miss_rate:.2%} miss rate")
```

### Similarity Analysis

```python
from analytics.models import SimilarityCheck, SimilarityFlag

# Run similarity check
check = SimilarityCheck.objects.create(
    exam_variant=variant,
    student_a_id="student1",
    student_b_id="student2",
    similarity_score=85.5,
    flagged=True
)

# Create similarity flag
flag = SimilarityFlag.objects.create(
    exam=exam,
    variant=variant,
    student1=student1,
    student2=student2,
    similarity_score=85.5,
    severity="medium",
    flagged_questions=[1, 3, 5, 7]
)
```

### Score Distribution Analysis

```python
from analytics.models import ScoreDistribution
from analytics.services import ScoreAnalysisService

# Generate score distribution
service = ScoreAnalysisService(exam)
distribution = service.generate_distribution()

# Access statistics
print(f"Mean: {distribution.mean}")
print(f"Median: {distribution.median}")
print(f"Std Dev: {distribution.std_dev}")
```

### Export Analytics Data

```python
from analytics.services import AnalyticsExportService

# Export performance data
export_service = AnalyticsExportService()
export_result = export_service.export_performance(
    exam=exam,
    format="csv",
    include_details=True
)

# Export similarity flags
similarity_export = export_service.export_similarity_flags(
    exam=exam,
    status="pending"
)
```

## 🔒 Security & Privacy

### Data Privacy
- **Anonymized Data**: Student data is anonymized in analytics
- **Access Control**: Role-based access to analytics data
- **Audit Trails**: Complete tracking of analytics operations
- **Data Retention**: Configurable data retention policies

### Similarity Analysis Ethics
- **False Positive Management**: Careful handling of similarity flags
- **Review Process**: Structured review workflow
- **Evidence Collection**: Detailed evidence for flags
- **Appeal Process**: Support for student appeals

### Access Control
- **Instructor Access**: Course-specific analytics
- **Admin Access**: System-wide analytics
- **Student Privacy**: Limited access to personal data
- **Export Controls**: Controlled data export

## 🧪 Testing

### Running Tests

```bash
# Run all analytics tests
python manage.py test analytics

# Run specific test categories
python manage.py test analytics.tests.test_models
python manage.py test analytics.tests.test_services
python manage.py test analytics.tests.test_api
```

### Test Coverage

The analytics service includes comprehensive tests covering:
- Model validation and calculations
- Similarity analysis algorithms
- Score distribution calculations
- Export functionality
- API endpoint security
- Performance optimization

## 📈 Performance Considerations

### Database Optimization
- **Indexed Fields**: Optimized queries on analytics fields
- **Aggregation**: Efficient statistical calculations
- **Caching**: Redis-based caching for analytics data
- **Background Processing**: Heavy calculations use async processing

### Scalability
- **Batch Processing**: Large datasets processed in batches
- **Incremental Updates**: Efficient updates for new data
- **Memory Management**: Optimized memory usage for large analyses
- **Progress Tracking**: Progress updates for long analytics operations

## 🔄 Migration History

### Recent Changes
- **v1.0**: Initial analytics system
- **v1.1**: Added similarity detection
- **v1.2**: Implemented score distributions
- **v1.3**: Enhanced export functionality
- **v1.4**: Added review workflow
- **v1.5**: Improved performance optimization

## 📚 Related Documentation

- [API Documentation](../docs/api/README.md)
- [Testing Guide](../docs/TESTING_GUIDE.md)
- [Troubleshooting Guide](../docs/TROUBLESHOOTING_GUIDE.md)

## 🤝 Contributing

When contributing to the analytics service:

1. **Privacy First**: Always consider student privacy implications
2. **Test Algorithms**: Ensure similarity detection is accurate
3. **Performance**: Test with large datasets
4. **Documentation**: Keep analytics guides current
5. **Ethics**: Consider fairness in similarity detection and flagging

## 📞 Support

For issues related to the analytics service:
- Check the [troubleshooting guide](../docs/TROUBLESHOOTING_GUIDE.md)
- Review the [API documentation](../docs/api/README.md)
- Create an issue with the `analytics` label
