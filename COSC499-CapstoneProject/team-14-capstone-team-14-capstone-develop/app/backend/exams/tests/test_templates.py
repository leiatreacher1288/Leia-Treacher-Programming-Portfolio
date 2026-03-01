from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from ..models import ExamTemplate

User = get_user_model()


class ExamTemplateAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="test@example.com", password="testpass123", name="Test User"
        )
        self.client.force_authenticate(user=self.user)

        self.sample_template_data = {
            "name": "Test Template",
            "layout_data": {
                "instructions": ["No notes allowed", "Use dark pen"],
                "footer": "Faculty of Computer Science",
                "academic_integrity": {
                    "enabled": True,
                    "text": "I confirm academic integrity",
                },
                "sections": [
                    {
                        "name": "Section A",
                        "title": "Section A",
                        "question_bank_id": 1,
                        "instructions": "Answer all questions",
                        "num_questions": 5,
                    }
                ],
            },
        }

    def test_create_template(self):
        """Test creating a new template."""
        response = self.client.post(
            "/api/exams/templates/layout/", self.sample_template_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        template = ExamTemplate.objects.first()
        self.assertEqual(template.name, "Test Template")
        self.assertEqual(template.created_by, self.user)
        self.assertEqual(
            template.layout_data["instructions"], ["No notes allowed", "Use dark pen"]
        )

    def test_get_templates(self):
        """Test getting all templates for a user."""
        # Create a template
        ExamTemplate.objects.create(
            name="Test Template",
            created_by=self.user,
            layout_data=self.sample_template_data["layout_data"],
        )

        response = self.client.get("/api/exams/templates/layout/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Test Template")

    def test_get_template_detail(self):
        """Test getting a specific template."""
        template = ExamTemplate.objects.create(
            name="Test Template",
            created_by=self.user,
            layout_data=self.sample_template_data["layout_data"],
        )

        response = self.client.get(f"/api/exams/templates/layout/{template.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Test Template")

    def test_update_template(self):
        """Test updating a template."""
        template = ExamTemplate.objects.create(
            name="Test Template",
            created_by=self.user,
            layout_data=self.sample_template_data["layout_data"],
        )

        updated_data = {
            "name": "Updated Template",
            "layout_data": self.sample_template_data["layout_data"],
        }

        response = self.client.put(
            f"/api/exams/templates/layout/{template.id}/", updated_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        template.refresh_from_db()
        self.assertEqual(template.name, "Updated Template")

    def test_delete_template(self):
        """Test deleting a template."""
        template = ExamTemplate.objects.create(
            name="Test Template",
            created_by=self.user,
            layout_data=self.sample_template_data["layout_data"],
        )

        response = self.client.delete(f"/api/exams/templates/layout/{template.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(ExamTemplate.objects.filter(id=template.id).exists())

    def test_template_validation(self):
        """Test template data validation."""
        invalid_data = {
            "name": "Test Template",
            "layout_data": {
                "instructions": "not a list",  # Should be a list
                "footer": "Test footer",
                "academic_integrity": {"enabled": True, "text": "Test"},
                "sections": [],
            },
        }

        response = self.client.post(
            "/api/exams/templates/layout/", invalid_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_isolation(self):
        """Test that users can only see their own templates."""
        other_user = User.objects.create_user(
            email="other@example.com", password="testpass123", name="Other User"
        )

        # Create template for other user
        ExamTemplate.objects.create(
            name="Other Template",
            created_by=other_user,
            layout_data=self.sample_template_data["layout_data"],
        )

        # Current user should not see other user's template
        response = self.client.get("/api/exams/templates/layout/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_template_validation_with_missing_title(self):
        """Test template validation with missing title in sections"""
        invalid_data = {
            "name": "Test Template",
            "layout_data": {
                "instructions": ["No notes allowed", "Use dark pen"],
                "footer": "Faculty of Computer Science",
                "academic_integrity": {
                    "enabled": True,
                    "text": "I confirm academic integrity",
                },
                "sections": [
                    {
                        "name": "Section A",
                        # Missing 'title' field
                        "question_bank_id": 1,
                        "instructions": "Answer all questions",
                        "num_questions": 5,
                    }
                ],
            },
        }

        response = self.client.post(
            "/api/exams/templates/layout/", invalid_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check that the error response contains information about the missing title
        self.assertIn("title", str(response.data))

    def test_template_serialization_with_complex_data(self):
        """Test template serialization with complex layout data"""
        complex_template_data = {
            "name": "Complex Template",
            "layout_data": {
                "instructions": [
                    "No calculators allowed",
                    "Show all work",
                    "Use blue or black pen only",
                ],
                "footer": "This exam is property of the University",
                "academic_integrity": {
                    "enabled": True,
                    "text": "I pledge that I have neither given nor received unauthorized assistance on this exam",
                },
                "sections": [
                    {
                        "name": "Multiple Choice",
                        "title": "Multiple Choice Section",
                        "question_bank_id": 1,
                        "instructions": "Choose the best answer for each question",
                        "num_questions": 10,
                    },
                    {
                        "name": "Short Answer",
                        "title": "Short Answer Section",
                        "question_bank_id": 2,
                        "instructions": "Provide brief but complete answers",
                        "num_questions": 5,
                    },
                ],
            },
        }

        response = self.client.post(
            "/api/exams/templates/layout/", complex_template_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        template = ExamTemplate.objects.get(name="Complex Template")
        self.assertEqual(len(template.instructions), 3)
        self.assertEqual(len(template.sections), 2)
        self.assertTrue(template.academic_integrity["enabled"])
