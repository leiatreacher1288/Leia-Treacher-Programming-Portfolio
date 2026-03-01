# ExamVault User Workflows Guide

## Table of Contents
- [ExamVault User Workflows Guide](#examvault-user-workflows-guide)
  - [Table of Contents](#table-of-contents)
  - [Default User Accounts](#default-user-accounts)
  - [Administrator Workflows](#administrator-workflows)
  - [Instructor Workflows](#instructor-workflows)
  - [Question Import Guide](#question-import-guide)
  - [CSV Format Specifications](#csv-format-specifications)
  - [Analytics Dashboard Guide](#analytics-dashboard-guide)
  - [Project Handover Information](#project-handover-information)
    - [Repository Information](#repository-information)
    - [Development Team](#development-team)
    - [Key Dependencies and Versions](#key-dependencies-and-versions)
    - [Support \& Contact](#support--contact)



## Default User Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@example.com | admin123 | System administration |
| Instructor | instructor@test.com | test123 | Course/exam management |

## Administrator Workflows

1. **Login**: Navigate to `/admin-panel/login`
    - Use secure username/password authentication
    - Passwords are hashed and stored securely
    - All login attempts are logged for auditing

2. **Dashboard**: View comprehensive system overview
    - System usage statistics and metrics
    - Active user counts by role
    - Recent system activity logs
    - Performance monitoring alerts

3. **User Management**: 
    - **Create Instructor Accounts**: Add new instructors with email verification
    - **Update User Information**: Edit instructor profiles and permissions
    - **Deactivate Accounts**: Disable accounts while preserving data integrity
    - **Role Assignment**: Manage role-based access control (Admin/Instructor)
    - **Audit Trail**: View user activity logs (logins, edits, imports)

4. **Global Settings Configuration**:
    - **Marking Schemes**: Set system-wide grading parameters
    - **Exam Formats**: Configure default exam templates and layouts
    - **Privacy Settings**: Manage data retention and anonymization policies
    - **System Parameters**: Upload limits, timeout settings, feature toggles

5. **Privacy and Compliance Management**:
    - **Data Anonymization**: Configure automatic student data anonymization for analytics
    - **PII Management**: Delete or archive personal identifiable information per policy
    - **Compliance Monitoring**: Ensure FIPPA/GDPR compliance
    - **Data Retention**: Set and enforce data lifecycle policies
    - **Export Controls**: Manage data export permissions and formats

6. **System Monitoring**:
    - **Audit Logs**: View comprehensive system activity logs
    - **Security Events**: Monitor authentication attempts and access violations
    - **Performance Metrics**: Track system health and resource usage
    - **Error Tracking**: Review system errors and exceptions
    - **Database Management**: Access pgAdmin for direct database operations

**Admin Panel Security Features:**
- Secure authentication management with timeout
- Two-factor authentication support (optional)
- IP-based access restrictions
- Comprehensive audit logging of all admin actions
- Encrypted data transmission and storage

## Instructor Workflows

1. **Registration/Login**: Self-register or login at `/login`
    - Secure authentication with role-based access
    - Password recovery available via email

2. **Course Management**: 
    - **Create Course**: Navigate to Courses → Create New Course
    - **Configure Details**: Enter course code, name, term, year
    - **Student Roster**: Add/edit/manage student enrollments
    - **Collaboration**: Share courses with co-instructors or TAs
    - **Templates**: Create reusable course templates for future terms

3. **Question Bank Management**:
    - **Build Question Banks**: Create dedicated banks per course/topic
    - **Add Questions**: Manual entry with correct answers and metadata
    - **Import Questions**: Bulk import from CSV, PDF, or DOCX files
    - **Metadata Management**: Tag questions by topic, difficulty, type
    - **Review & Edit**: Validate and modify imported questions
    - **Reusability**: Track question usage frequency across exams
    - **Export**: Archive question banks for backup or sharing

4. **Exam Creation & Configuration**:
    - **Select Course**: Choose course → Create Exam
    - **Configure Parameters**:
      - Number of exam versions/variants
      - Questions per exam
      - Mandatory questions
      - Difficulty distribution
      - Time limits and attempt restrictions
    - **Question Selection**: Add from question banks or individual questions
    - **Variant Generation**:
      - Single randomized variant
      - Multiple randomized variants (shuffled questions/answers)
      - Question pool substitution options
    - **Answer Keys**: Define, edit, and validate answer keys per variant
    - **Marking Schemes**: Configure per-question weighting, negative marking
    - **Export Options**: Generate print-ready DOCX/PDF with version codes
    - **Student Tracking**: Track which student receives which variant

5. **Results Import & Analysis**:
    - **Import Methods**:
      - Manual score entry
      - OMR (Optical Mark Recognition) data upload (CSV)
      - System validates variant matching and completeness
    - **Analytics Dashboard**:
      - **Item-Level Analysis**: Point biserial, discrimination index
      - **Exam Statistics**: Mean, median, standard deviation
      - **Visualizations**: Score histograms, difficulty scatter plots
      - **Performance Tracking**: Compare across exams and years
    - **Student Reports**:
      - Individual performance reports with percentile rankings
      - Per-topic breakdown (if questions are tagged)
      - Bulk report generation (PDF/CSV)
    - **Academic Integrity**:
      - Analyze results for suspicious similarity patterns
      - Flag potential collusion based on statistical analysis
    - **Export Results**: Generate reports in CSV or PDF format

6. **Collaboration Features**:
    - Share courses with co-instructors
    - Concurrent editing with activity tracking
    - Role-based permissions for TAs

7. **Usability Features**:
    - Onboarding guides and tooltips
    - Pre-filled exam templates
    - First-time user walkthroughs
    - Desktop-optimized interface


## Question Import Guide

**Supported Formats**: CSV (recommended), PDF, DOCX

## CSV Format Specifications

**Required CSV Headers:**
- `prompt` - The question text
- `a`, `b`, `c`, `d`, `e` - Answer choices (A through E)
- `correct_answer` - Correct answer letter(s), pipe-separated for multiple answers
- `explanation` - Optional explanation text
- `difficulty` - Difficulty level (1-5)
- `tags` - Pipe-separated tags

**Example CSV Format:**
```csv
prompt,a,b,c,d,correct_answer,explanation,difficulty,tags
"What is 2+2?","2","3","4","5","C","Basic arithmetic","1","math|basic"
"Which are prime numbers?","1","2","3","4","B|C","2 and 3 are prime","2","math|prime"
```

**Import Process:**
1. Navigate to Question Bank in your course
2. Click "Import Questions" button
3. Select file(s) (supports multiple file upload)
4. Review imported questions for accuracy
5. Edit or delete any problematic questions
6. Save to question bank

**PDF/DOCX Import Notes:**
- PDFs must contain selectable text (not scanned images)
- DOCX files should follow a structured format
- Complex formatting may require manual review after import

## Analytics Dashboard Guide

**Instructor Analytics:**
- **Course Performance Metrics**: Average scores, completion rates
- **Question Analysis**: Difficulty assessment, discrimination index
- **Student Progress Tracking**: Individual and class performance trends
- **Similarity Detection**: Similarity analysis between uploaded student responses

**Admin Analytics:**
- **System Usage Statistics**: User engagement, exam frequency
- **Performance Monitoring**: System health and response times
- **User Management Metrics**: Registration trends, role distribution

**Export Options:**
- PDF reports for formal documentation
- CSV exports for data analysis
- Excel files for advanced calculations

## Project Handover Information

### Repository Information
- **Repository**: team-14-capstone-team-14-capstone
- **Owner**: UBCO-COSC499-S2025
- **Default Branch**: develop

### Development Team
- **Jaitra Patel** - Full-stack Development, Documentation.
- **Jeffrey Paller** - Backend Development, Infrastructure, Testing, API Design.
- **Jeel Patel** - Full-stack Development, UI/UX, Documentation.
- **Richard Pillaca Burga** - Full-stack Development, UI/UX, Project Management.
- **Leia Treacher** - Frontend Development, Documentation.
- **Abdullah Alkaf** - DevOps, Full-stack Development, UI/UX, Database Design.

### Key Dependencies and Versions

**Backend (Python):**
- Django 4.2.22
- Django REST Framework 3.16.0
- PostgreSQL 14 (via psycopg2-binary 2.9.9)
- Python 3.11+

**Frontend (Node.js):**
- React 19.1.0
- TypeScript 5.8.3
- Vite 6.3.5
- Tailwind CSS 3.4.17
- Node.js 18+ required

**Infrastructure:**
- Docker & Docker Compose
- Nginx (Alpine)
- PostgreSQL 14
- pgAdmin (for database management)

### Support & Contact

For issues or questions:
1. Check the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md)
2. Review application logs: `docker-compose logs`
3. Consult the `/docs` directory for additional documentation
4. Create an issue on GitHub repository
5. Contact the development team members listed above

---

**Version**: 1.0.0  
**Last Updated**: August 2025  
**Documentation Status**: Complete

This manual provides comprehensive guidance for installation, development, deployment, and maintenance of the ExamVault system. For technical support or feature requests, please refer to the project repository and development team contacts listed above.
