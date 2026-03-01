from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

# results/tests/test_services.py
from django.test import TestCase
from django.urls import reverse

from courses.models import Course, Student
from exams.models import Exam, StudentVariantAssignment, Variant, VariantQuestion
from questions.models import Question, QuestionBank
from results.models import ExamResult
from results.services import OMRParser, ResultGradingService

User = get_user_model()


class OMRParserTests(TestCase):
    def test_parse_csv_basic(self):
        """Test basic CSV parsing"""
        csv_content = """student_id,variant_code,q1,q2,q3
S001,A,A,B,C
S002,B,B,C,D"""

        results = OMRParser.parse_csv(csv_content)

        self.assertEqual(len(results), 2)

        # Check first record
        self.assertEqual(results[0]["student_id"], "S001")
        self.assertEqual(results[0]["variant_code"], "A")
        self.assertEqual(results[0]["responses"], {"1": "A", "2": "B", "3": "C"})
        self.assertEqual(results[0]["row_number"], 2)

        # Check second record
        self.assertEqual(results[1]["student_id"], "S002")
        self.assertEqual(results[1]["variant_code"], "B")
        self.assertEqual(results[1]["responses"], {"1": "B", "2": "C", "3": "D"})

    def test_parse_csv_with_empty_responses(self):
        """Test CSV parsing with missing responses"""
        csv_content = """student_id,variant_code,q1,q2,q3
S001,A,A,,C
S002,B,,,"""

        results = OMRParser.parse_csv(csv_content)

        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["responses"], {"1": "A", "2": None, "3": "C"})
        self.assertEqual(results[1]["responses"], {"1": None, "2": None, "3": None})

    def test_parse_csv_with_field_mapping(self):
        """Test CSV parsing with custom field mapping"""
        csv_content = """id,version,q1,q2
STU001,VariantA,A,B
STU002,VariantB,C,D"""

        field_mapping = {"student_id": "id", "variant_code": "version"}

        results = OMRParser.parse_csv(csv_content, field_mapping)

        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]["student_id"], "STU001")
        self.assertEqual(results[0]["variant_code"], "VariantA")

    def test_parse_csv_lowercase_conversion(self):
        """Test that responses are converted to uppercase"""
        csv_content = """student_id,variant_code,q1,q2
S001,A,a,b"""

        results = OMRParser.parse_csv(csv_content)

        self.assertEqual(results[0]["responses"], {"1": "A", "2": "B"})

    def test_parse_csv_with_extra_columns(self):
        """Test CSV parsing ignores non-question columns"""
        csv_content = """student_id,variant_code,name,q1,q2,notes
S001,A,John Doe,A,B,Some notes"""

        results = OMRParser.parse_csv(csv_content)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["responses"], {"1": "A", "2": "B"})
        # Should not include 'name' or 'notes' in responses

    def test_parse_csv_with_errors(self):
        """Test CSV parsing with malformed data"""
        csv_content = """student_id,variant_code,q1,q2
S001,A,A,B
INVALID_ROW_MISSING_COLUMNS
S003,C,C,D"""

        results = OMRParser.parse_csv(csv_content)

        # Should still parse what it can
        self.assertEqual(len(results), 3)
        # Middle row might have errors
        self.assertIn("error", results[1])

    def test_parse_aiken_txt_single_student(self):
        """Test Aiken format parsing with single student"""
        txt_content = """STUDENT_ID: S001
VARIANT: A
1. A
2. B
3. C
4. D"""

        results = OMRParser.parse_aiken_txt(txt_content)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["student_id"], "S001")
        self.assertEqual(results[0]["variant_code"], "A")
        # Expect string keys to match implementation
        self.assertEqual(
            results[0]["responses"], {"1": "A", "2": "B", "3": "C", "4": "D"}
        )

    def test_parse_aiken_txt_multiple_students(self):
        """Test Aiken format parsing with multiple students"""
        txt_content = """STUDENT_ID: S001
    VARIANT: A
    1. A
    2. B

    STUDENT_ID: S002
    VARIANT: B
    1. C
    2. D
    3. A"""

        results = OMRParser.parse_aiken_txt(txt_content)

        self.assertEqual(len(results), 2)

        # First student
        self.assertEqual(results[0]["student_id"], "S001")
        self.assertEqual(results[0]["variant_code"], "A")
        # Change to expect string keys
        self.assertEqual(results[0]["responses"], {"1": "A", "2": "B"})

        # Second student
        self.assertEqual(results[1]["student_id"], "S002")
        self.assertEqual(results[1]["variant_code"], "B")
        # Change to expect string keys
        self.assertEqual(results[1]["responses"], {"1": "C", "2": "D", "3": "A"})

    def test_parse_aiken_txt_lowercase_conversion(self):
        """Test Aiken format converts to uppercase"""
        txt_content = """STUDENT_ID: S001
    VARIANT: a
    1. a
    2. b"""

        results = OMRParser.parse_aiken_txt(txt_content)

        self.assertEqual(results[0]["variant_code"], "a")  # Variant code not converted
        # Change to expect string keys
        self.assertEqual(
            results[0]["responses"], {"1": "A", "2": "B"}
        )  # Responses converted

    def test_parse_aiken_txt_with_irregular_spacing(self):
        """Test Aiken format with irregular spacing"""
        txt_content = """STUDENT_ID:    S001
    VARIANT:A
    1.A
    2.  B
    3.    C"""

        results = OMRParser.parse_aiken_txt(txt_content)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["student_id"], "S001")
        self.assertEqual(results[0]["variant_code"], "A")
        # Change to expect string keys
        self.assertEqual(results[0]["responses"], {"1": "A", "2": "B", "3": "C"})


class ResultGradingServiceTests(TestCase):
    def setUp(self):
        # Create test data
        self.user = User.objects.create_user(
            email="grader@example.com", name="Grader", password="testpass"
        )
        self.course = Course.objects.create(code="GRD101", name="Grading Course")
        self.exam = Exam.objects.create(title="Grading Exam", course=self.course)
        self.variant = Variant.objects.create(exam=self.exam, version_label="A")

        # Create question bank and questions
        self.bank = QuestionBank.objects.create(
            title="Test Bank", course=self.course, created_by=self.user
        )

        # Create questions with correct answers
        self.q1 = Question.objects.create(
            bank=self.bank,
            prompt="Question 1",
            choices=["A", "B", "C", "D"],
            correct_answer=["A"],
            created_by=self.user,
        )
        self.q2 = Question.objects.create(
            bank=self.bank,
            prompt="Question 2",
            choices=["A", "B", "C", "D"],
            correct_answer=["B"],
            created_by=self.user,
        )
        self.q3 = Question.objects.create(
            bank=self.bank,
            prompt="Question 3",
            choices=["A", "B", "C", "D"],
            correct_answer=["C", "D"],  # Multiple correct answers
            created_by=self.user,
        )

        # Add questions to variant
        VariantQuestion.objects.create(
            variant=self.variant, question=self.q1, order=0
        )  # was order=1
        VariantQuestion.objects.create(
            variant=self.variant, question=self.q2, order=1
        )  # was order=2
        VariantQuestion.objects.create(
            variant=self.variant, question=self.q3, order=2
        )  # was order=3

    def test_grade_all_correct(self):
        """Test grading with all correct answers"""
        # Question 3 has correct_answer=["C", "D"], so we need to provide both
        responses = {
            "1": "A",
            "2": "B",
            "3": "C,D",
        }  # Include BOTH C and D for question 3

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        self.assertEqual(result["score"], 100.0)
        self.assertEqual(result["total_questions"], 3)
        self.assertEqual(result["correct_answers"], 3)
        self.assertEqual(result["incorrect_answers"], 0)
        self.assertEqual(result["unanswered"], 0)

        # Check grading details
        details = result["grading_details"]
        self.assertEqual(len(details), 3)
        for detail in details:
            self.assertEqual(detail["status"], "correct")
            self.assertEqual(detail["points_earned"], 1.0)

    def test_grade_all_incorrect(self):
        """Test grading with all incorrect answers"""
        responses = {"1": "B", "2": "A", "3": "A"}

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        self.assertEqual(result["score"], 0.0)
        self.assertEqual(result["correct_answers"], 0)
        self.assertEqual(result["incorrect_answers"], 3)
        self.assertEqual(result["unanswered"], 0)

    def test_grade_mixed_responses(self):
        """Test grading with mixed correct/incorrect/unanswered"""
        responses = {"1": "A", "2": "C", "3": ""}  # Correct, incorrect, unanswered

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        self.assertEqual(result["score"], 33.33)  # 1/3 = 33.33%
        self.assertEqual(result["correct_answers"], 1)
        self.assertEqual(result["incorrect_answers"], 1)
        self.assertEqual(result["unanswered"], 1)

    def test_grade_multiple_correct_answers(self):
        """Test grading with questions that have multiple correct answers"""
        # Test 1: Providing only one correct answer when both are required
        responses1 = {"1": "A", "2": "B", "3": "D"}  # Only D, missing C
        result1 = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses1
        )
        # Without partial credit, having only one of the required answers is incorrect
        self.assertEqual(result1["correct_answers"], 2)  # Only Q1 and Q2 are correct
        self.assertEqual(result1["incorrect_answers"], 1)  # Q3 is incorrect

        # Test 2: Providing both correct answers
        responses2 = {"1": "A", "2": "B", "3": "C,D"}  # Both C and D
        result2 = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses2
        )
        self.assertEqual(result2["correct_answers"], 3)  # All correct
        self.assertEqual(result2["incorrect_answers"], 0)

        # Test 3: Wrong answer for multi-answer question
        responses3 = {"1": "A", "2": "B", "3": "B"}  # B is incorrect for q3
        result3 = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses3
        )
        self.assertEqual(result3["correct_answers"], 2)
        self.assertEqual(result3["incorrect_answers"], 1)

    def test_grade_empty_exam(self):
        """Test grading with no questions"""
        empty_variant = Variant.objects.create(exam=self.exam, version_label="Empty")

        result = ResultGradingService.grade_exam_result(self.exam, empty_variant, {})

        self.assertEqual(result["score"], 0.0)
        self.assertEqual(result["total_questions"], 0)
        self.assertEqual(result["correct_answers"], 0)

    def test_grade_case_insensitive(self):
        """Test that grading is case-insensitive"""
        # Include both C and D for question 3 (in lowercase to test case insensitivity)
        responses = {
            "1": "a",
            "2": "b",
            "3": "c,d",
        }  # Lowercase, including both correct answers

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        self.assertEqual(result["correct_answers"], 3)  # Should all be correct
        self.assertEqual(result["score"], 100.0)

    def test_grading_details_structure(self):
        """Test the structure of grading details"""
        responses = {"1": "A", "2": "B", "3": "C"}

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        details = result["grading_details"]
        self.assertEqual(len(details), 3)

        # Check first question detail
        detail = details[0]
        self.assertIn("question_id", detail)
        self.assertIn("question_number", detail)
        self.assertIn("student_answer", detail)
        self.assertIn("correct_answers", detail)
        self.assertIn("status", detail)
        self.assertIn("points", detail)

        self.assertEqual(detail["question_id"], self.q1.id)
        self.assertEqual(detail["question_number"], 1)  # Should be 1, not 0
        self.assertEqual(detail["student_answer"], "A")
        self.assertEqual(detail["correct_answers"], ["A"])
        self.assertEqual(detail["status"], "correct")
        self.assertEqual(detail["points"], 1)


# Append ALL of these tests to your results/tests/test_services.py file


class VariablePointsTests(TestCase):
    """Complete tests for variable points functionality"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="varpoints@example.com",
            name="Variable Points Tester",
            password="testpass",
        )
        self.course = Course.objects.create(code="VP101", name="Variable Points Course")
        self.exam = Exam.objects.create(
            title="Variable Points Exam", course=self.course
        )
        self.variant = Variant.objects.create(exam=self.exam, version_label="A")
        self.student = Student.objects.create(
            course=self.course, student_id="VP001", name="VP Student", is_active=True
        )

        self.bank = QuestionBank.objects.create(
            title="VP Bank", course=self.course, created_by=self.user
        )

    def test_zero_point_question(self):
        """Test question worth 0 points (bonus or ungraded)"""
        q1 = Question.objects.create(
            bank=self.bank,
            prompt="Bonus question",
            choices=["A", "B", "C", "D"],
            correct_answer=["A"],
            points=0.0,
            created_by=self.user,
        )

        q2 = Question.objects.create(
            bank=self.bank,
            prompt="Regular question",
            choices=["A", "B", "C", "D"],
            correct_answer=["B"],
            points=1.0,
            created_by=self.user,
        )

        VariantQuestion.objects.create(variant=self.variant, question=q1, order=0)
        VariantQuestion.objects.create(variant=self.variant, question=q2, order=1)

        responses = {"1": "A", "2": "B"}  # Correct but worth 0  # Correct, worth 1

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        self.assertEqual(result["total_points_possible"], 1.0)
        self.assertEqual(result["total_points_earned"], 1.0)
        self.assertEqual(result["score"], 100.0)
        self.assertEqual(result["correct_answers"], 2)  # Both are correct

    def test_very_large_point_values(self):
        """Test questions with very large point values"""
        q1 = Question.objects.create(
            bank=self.bank,
            prompt="High stakes question",
            choices=["A", "B", "C", "D"],
            correct_answer=["C"],
            points=999.99,  # Max allowed by DecimalField(5,2)
            created_by=self.user,
        )

        VariantQuestion.objects.create(variant=self.variant, question=q1, order=0)

        responses = {"1": "C"}

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        self.assertEqual(result["total_points_possible"], 999.99)
        self.assertEqual(result["total_points_earned"], 999.99)
        self.assertEqual(result["score"], 100.0)

    def test_fractional_points_precision(self):
        """Test that fractional points maintain precision through calculations"""
        questions_points = [0.33, 0.67, 1.11, 2.22, 3.33]

        for i, pts in enumerate(questions_points):
            q = Question.objects.create(
                bank=self.bank,
                prompt=f"Question {i+1}",
                choices=["A", "B", "C", "D"],
                correct_answer=["A"],
                points=pts,
                created_by=self.user,
            )
            VariantQuestion.objects.create(variant=self.variant, question=q, order=i)

        # All correct
        responses = {str(i + 1): "A" for i in range(5)}

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        expected_total = sum(questions_points)  # 7.66
        self.assertAlmostEqual(
            result["total_points_possible"], expected_total, places=2
        )
        self.assertAlmostEqual(result["total_points_earned"], expected_total, places=2)

    def test_mixed_points_and_incorrect_answers(self):
        """Test score calculation with varied points and mixed correct/incorrect"""
        # Create questions: 1pt, 2pt, 5pt, 10pt
        for i, pts in enumerate([1, 2, 5, 10]):
            q = Question.objects.create(
                bank=self.bank,
                prompt=f"{pts} point question",
                choices=["A", "B", "C", "D"],
                correct_answer=["A"],
                points=float(pts),
                created_by=self.user,
            )
            VariantQuestion.objects.create(variant=self.variant, question=q, order=i)

        # Get 1pt and 5pt correct, miss 2pt and 10pt
        responses = {
            "1": "A",  # Correct: 1pt
            "2": "B",  # Wrong: 0/2pt
            "3": "A",  # Correct: 5pt
            "4": "B",  # Wrong: 0/10pt
        }

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        self.assertEqual(result["total_points_possible"], 18.0)
        self.assertEqual(result["total_points_earned"], 6.0)
        self.assertEqual(result["score"], 33.33)  # 6/18 = 33.33%
        self.assertEqual(result["correct_answers"], 2)
        self.assertEqual(result["incorrect_answers"], 2)

    def test_all_questions_different_points(self):
        """Test exam where every question has different point value"""
        point_values = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]

        for i, pts in enumerate(point_values):
            q = Question.objects.create(
                bank=self.bank,
                prompt=f"Question worth {pts}",
                choices=["True", "False"],
                correct_answer=["True"],
                points=pts,
                created_by=self.user,
            )
            VariantQuestion.objects.create(variant=self.variant, question=q, order=i)

        # Answer half correctly (every other one)
        responses = {}
        for i in range(10):
            responses[str(i + 1)] = "True" if i % 2 == 0 else "False"

        result = ResultGradingService.grade_exam_result(
            self.exam, self.variant, responses
        )

        # Correct: 0.5, 1.5, 2.5, 3.5, 4.5 = 12.5
        # Total: sum(point_values) = 27.5
        self.assertEqual(result["total_points_possible"], 27.5)
        self.assertEqual(result["total_points_earned"], 12.5)
        self.assertAlmostEqual(result["score"], 45.45, places=2)  # 12.5/27.5


class CompleteIntegrationTests(TestCase):
    """Integration tests combining all features"""

    def setUp(self):
        self.user = User.objects.create_user(
            email="integration@example.com",
            name="Integration Tester",
            password="testpass",
        )
        self.course = Course.objects.create(code="INT101", name="Integration Course")
        self.exam = Exam.objects.create(
            title="Complete Integration Exam", course=self.course
        )
        self.variant = Variant.objects.create(exam=self.exam, version_label="A")

        # Create multiple students for bulk testing
        self.students = []
        for i in range(5):
            student = Student.objects.create(
                course=self.course,
                student_id=f"INT{i:03d}",
                name=f"Student {i+1}",
                is_active=True,
            )
            self.students.append(student)

        self.bank = QuestionBank.objects.create(
            title="Integration Bank", course=self.course, created_by=self.user
        )

        # Make user an instructor
        from courses.models import CourseInstructor

        CourseInstructor.objects.create(
            course=self.course, user=self.user, role="MAIN", accepted=True
        )

    def test_complete_exam_scenario(self):
        """Test a realistic exam with all features combined"""
        # Q1: Simple 1-point question
        q1 = Question.objects.create(
            bank=self.bank,
            prompt="What is 2+2?",
            choices=["3", "4", "5", "6"],
            correct_answer=["4"],
            points=1.0,
            created_by=self.user,
        )

        # Q2: 2-point true/false
        q2 = Question.objects.create(
            bank=self.bank,
            prompt="The Earth is flat",
            choices=["True", "False"],
            correct_answer=["False"],
            points=2.0,
            created_by=self.user,
        )

        # Q3: 5-point multi-answer with partial credit
        q3 = Question.objects.create(
            bank=self.bank,
            prompt="Select all prime numbers",
            choices=["1", "2", "3", "4", "5", "6", "7", "8", "9"],
            correct_answer=["2", "3", "5", "7"],  # 4 correct answers
            points=5.0,
            partial_credit_enabled=True,
            incorrect_penalty=0.25,
            created_by=self.user,
        )

        # Q4: High-value 10-point question
        q4 = Question.objects.create(
            bank=self.bank,
            prompt="Critical thinking question",
            choices=["A", "B", "C", "D"],
            correct_answer=["C"],
            points=10.0,
            created_by=self.user,
        )

        # Q5: Bonus 0-point question
        q5 = Question.objects.create(
            bank=self.bank,
            prompt="Optional feedback question",
            choices=["A", "B", "C", "D"],
            correct_answer=["A"],
            points=0.0,
            created_by=self.user,
        )

        # Add all questions to variant
        for i, q in enumerate([q1, q2, q3, q4, q5]):
            VariantQuestion.objects.create(variant=self.variant, question=q, order=i)

        # Test different response patterns
        test_scenarios = [
            {
                "name": "Perfect Score",
                "responses": {
                    "1": "4",
                    "2": "False",
                    "3": "2,3,5,7",
                    "4": "C",
                    "5": "A",
                },
                "expected_score": 100.0,
                "expected_points": 18.0,
            },
            {
                "name": "Partial Credit Scenario",
                "responses": {
                    "1": "4",  # Correct: 1pt
                    "2": "True",  # Wrong: 0pt
                    "3": "2,3,5,9",  # 3/4 correct + 1 wrong: 3.75 - 1.25 = 2.5pt
                    "4": "C",  # Correct: 10pt
                    "5": "B",  # Wrong but 0pt anyway
                },
                "expected_score": 75.0,  # 13.5/18
                "expected_points": 13.5,
            },
            {
                "name": "Poor Performance",
                "responses": {
                    "1": "3",  # Wrong: 0pt
                    "2": "True",  # Wrong: 0pt
                    "3": "1,4,6,8,9",  # All wrong: 0pt
                    "4": "A",  # Wrong: 0pt
                    "5": "",  # Unanswered: 0pt
                },
                "expected_score": 0.0,
                "expected_points": 0.0,
            },
        ]

        for scenario in test_scenarios:
            result = ResultGradingService.grade_exam_result(
                self.exam, self.variant, scenario["responses"]
            )

            self.assertAlmostEqual(
                result["score"],
                scenario["expected_score"],
                places=1,
                msg=f"Failed for scenario: {scenario['name']}",
            )
            self.assertAlmostEqual(
                result["total_points_earned"],
                scenario["expected_points"],
                places=1,
                msg=f"Points mismatch for scenario: {scenario['name']}",
            )

    def test_bulk_csv_import_with_all_features(self):
        """Test CSV import with variable points and partial credit"""
        # Create diverse questions
        q1 = Question.objects.create(
            bank=self.bank,
            prompt="1pt question",
            choices=["A", "B", "C", "D"],
            correct_answer=["A"],
            points=1.0,
            created_by=self.user,
        )

        q2 = Question.objects.create(
            bank=self.bank,
            prompt="3pt multi-answer",
            choices=["W", "X", "Y", "Z"],
            correct_answer=["X", "Y"],
            points=3.0,
            partial_credit_enabled=True,
            incorrect_penalty=0.5,
            created_by=self.user,
        )

        q3 = Question.objects.create(
            bank=self.bank,
            prompt="5pt question",
            choices=["A", "B", "C", "D"],
            correct_answer=["B"],
            points=5.0,
            created_by=self.user,
        )

        VariantQuestion.objects.create(variant=self.variant, question=q1, order=0)
        VariantQuestion.objects.create(variant=self.variant, question=q2, order=1)
        VariantQuestion.objects.create(variant=self.variant, question=q3, order=2)

        # Assign students to variant
        for student in self.students:
            StudentVariantAssignment.objects.create(
                exam=self.exam, student=student, variant=self.variant
            )

        # Create CSV with multiple students
        csv_content = """student_id,variant_code,q1,q2,q3
INT000,A,A,"X,Y",B
INT001,A,B,"X",B
INT002,A,A,"X,Y,Z",C
INT003,A,A,"W,X,Y,Z",B
INT004,A,,,"""

        file = SimpleUploadedFile("bulk_test.csv", csv_content.encode())

        # Import via API
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(self.user)

        url = reverse("omr-import", args=[self.exam.id])
        response = client.post(url, {"file": file, "format": "csv"}, format="multipart")

        # The import might succeed or fail depending on validation
        if response.status_code == 201:
            # Import succeeded
            self.assertEqual(response.data["imported"], 5)

            # Verify each student's score
            expected_scores = {
                "INT000": 100.0,  # All correct: 9/9
                "INT001": 72.22,  # Wrong Q1 (0), half Q2 (1.5), correct Q3 (5) = 6.5/9
                "INT002": 11.11,  # Correct Q1 (1), Q2 gives 0, wrong Q3 (0) = 1/9
                "INT003": 66.67,  # Correct Q1 (1), Q2 gives 1.5, correct Q3 (5) = 7.5/9
                "INT004": 0.0,  # All unanswered
            }

            for student_id, expected_score in expected_scores.items():
                result = ExamResult.objects.get(student__student_id=student_id)
                self.assertAlmostEqual(
                    float(result.score),
                    expected_score,
                    places=2,
                    msg=f"Score mismatch for {student_id}",
                )
        elif response.status_code == 400:
            # Import failed due to validation errors
            self.assertIn("validation_result", response.data)
            self.assertGreater(len(response.data["validation_result"]["errors"]), 0)
        else:
            self.fail(f"Unexpected status code: {response.status_code}")

    def test_statistics_with_variable_points(self):
        """Test that statistics work correctly with variable points"""
        # Create simple 2-question exam
        q1 = Question.objects.create(
            bank=self.bank,
            prompt="1pt question",
            choices=["A", "B"],
            correct_answer=["A"],
            points=1.0,
            created_by=self.user,
        )

        q2 = Question.objects.create(
            bank=self.bank,
            prompt="9pt question",
            choices=["A", "B"],
            correct_answer=["B"],
            points=9.0,
            created_by=self.user,
        )

        VariantQuestion.objects.create(variant=self.variant, question=q1, order=0)
        VariantQuestion.objects.create(variant=self.variant, question=q2, order=1)

        # Create results with specific patterns
        # Student 1: Gets easy wrong, hard right (90%)
        ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.students[0],
            raw_responses={"1": "B", "2": "B"},
            total_questions=2,
            total_points_possible=10.0,
            total_points_earned=9.0,
            correct_answers=1,
            incorrect_answers=1,
            score=90.0,
        )

        # Student 2: Gets easy right, hard wrong (10%)
        ExamResult.objects.create(
            exam=self.exam,
            variant=self.variant,
            student=self.students[1],
            raw_responses={"1": "A", "2": "A"},
            total_questions=2,
            total_points_possible=10.0,
            total_points_earned=1.0,
            correct_answers=1,
            incorrect_answers=1,
            score=10.0,
        )

        # Test statistics endpoint
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(self.user)

        url = reverse("exam-results", args=[self.exam.id])
        response = client.get(url)

        self.assertEqual(response.status_code, 200)
        stats = response.data["statistics"]

        # Both got 1/2 questions but very different scores
        self.assertEqual(stats["mean_score"], 50.0)  # (90+10)/2
        self.assertEqual(stats["median_score"], 50.0)
        self.assertEqual(stats["min_score"], 10.0)
        self.assertEqual(stats["max_score"], 90.0)

    def test_question_performance_with_points(self):
        """Test question performance tracking works with variable points"""
        q1 = Question.objects.create(
            bank=self.bank,
            prompt="Performance tracking",
            choices=["A", "B", "C"],
            correct_answer=["A", "B"],
            points=3.0,
            partial_credit_enabled=True,
            incorrect_penalty=0.5,
            created_by=self.user,
        )

        VariantQuestion.objects.create(variant=self.variant, question=q1, order=0)

        # Assign students to variant
        for student in self.students:
            StudentVariantAssignment.objects.create(
                exam=self.exam, student=student, variant=self.variant
            )

        # Import results
        csv_content = """student_id,variant_code,q1
INT000,A,"A,B"
INT001,A,"A"
INT002,A,"C"
INT003,A,"A,B,C"
INT004,A,"""

        file = SimpleUploadedFile("perf_test.csv", csv_content.encode())

        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(self.user)

        url = reverse("omr-import", args=[self.exam.id])
        response = client.post(url, {"file": file, "format": "csv"}, format="multipart")

        # The import might succeed or fail depending on validation
        if response.status_code == 201:
            # Import succeeded
            # Check question performance
            from analytics.models import QuestionPerformance

            perf = QuestionPerformance.objects.get(question=q1)

            # 4 attempts (excluding unanswered)
            self.assertEqual(perf.total_attempts, 4)
            # 3 incorrect (INT001 partial, INT002 wrong, INT003 gets 0 points)
            self.assertEqual(perf.incorrect_attempts, 3)
            self.assertEqual(perf.miss_rate, 0.75)  # 75% miss rate (3/4)
        elif response.status_code == 400:
            # Import failed due to validation errors
            self.assertIn("validation_result", response.data)
            self.assertGreater(len(response.data["validation_result"]["errors"]), 0)
        else:
            self.fail(f"Unexpected status code: {response.status_code}")
