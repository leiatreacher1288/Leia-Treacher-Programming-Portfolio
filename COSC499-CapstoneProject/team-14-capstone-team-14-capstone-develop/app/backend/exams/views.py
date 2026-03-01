import io
import logging
import traceback
import zipfile

from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from courses.models import Course, CourseActivity, CourseInstructor
from courses.serializers import CourseSerializer
from questions.models import Question, QuestionBank

from .models import (
    Exam,
    ExamExportHistory,
    ExamQuestion,
    ExamSection,
    ExamTemplate,
    StudentVariantAssignment,
    Variant,
    VariantQuestion,
)
from .serializers import (
    BulkQuestionAddSerializer,
    ExamCreateSerializer,
    ExamDetailSerializer,
    ExamExportHistorySerializer,
    ExamListSerializer,
    ExamSectionSerializer,
    ExamTemplateSerializer,
    VariantSerializer,
)
from .services import ExamExportService, ExamUpdateService, VariantGenerationService

logger = logging.getLogger(__name__)


class ExamViewSet(viewsets.ModelViewSet):
    """ViewSet for exam CRUD operations"""

    pagination_class = None  # Disable pagination for all exam endpoints
    serializer_class = ExamListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get all courses where the user is an instructor
        user_course_ids = CourseInstructor.objects.filter(
            user=self.request.user, accepted=True
        ).values_list("course_id", flat=True)

        # Get all exams for those courses
        queryset = Exam.objects.filter(course_id__in=user_course_ids)

        # Optional: filter by specific course if provided
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return (
            queryset.select_related("course")
            .prefetch_related("questions", "mandatory_questions", "sections")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        # use ExamCreateSerializer for *all* write actions
        if self.action in ("create", "update", "partial_update"):
            return ExamCreateSerializer  # ✅ writable fields
        elif self.action == "retrieve":
            return ExamDetailSerializer  # read-heavy representation
        return ExamListSerializer

    def perform_create(self, serializer):
        exam = serializer.save(created_by=self.request.user)

        # Log the activity
        if exam.course:
            CourseActivity.objects.create(
                course=exam.course,
                user=self.request.user,
                activity_type=CourseActivity.ActivityType.EXAM_CREATED,
                description=f"{self.request.user.name} created exam '{exam.title}'",
                entity_type="exam",
                entity_id=exam.id,
            )

    def update(self, request, *args, **kwargs):
        exam = self.get_object()
        response = super().update(request, *args, **kwargs)

        # Log the activity
        if response.status_code == 200 and exam.course:
            CourseActivity.objects.create(
                course=exam.course,
                user=request.user,
                activity_type=CourseActivity.ActivityType.EXAM_UPDATED,
                description=f"{request.user.name} updated exam '{exam.title}'",
                entity_type="exam",
                entity_id=exam.id,
            )

        return response

    def destroy(self, request, *args, **kwargs):
        exam = self.get_object()
        exam_title = exam.title
        exam_id = exam.id
        course = exam.course

        response = super().destroy(request, *args, **kwargs)

        # Log the activity
        if course:
            CourseActivity.objects.create(
                course=course,
                user=request.user,
                activity_type=CourseActivity.ActivityType.EXAM_DELETED,
                description=f"{request.user.name} deleted exam '{exam_title}'",
                entity_type="exam",
                entity_id=exam_id,
            )

        return response

    @action(detail=True, methods=["get"])
    def wizard_data(self, request, pk=None):
        """Get data needed for the exam wizard"""
        exam = self.get_object()

        # Get available question banks for the course
        course = exam.course
        if not course:
            return Response({"error": "Exam must have a course"}, status=400)

        question_banks = QuestionBank.objects.filter(course=course)

        # Add question count and difficulty breakdown like available_question_banks
        question_banks_data = []
        for bank in question_banks:
            questions = bank.questions.all()
            easy_count = sum(1 for q in questions if q.difficulty == 1)
            medium_count = sum(1 for q in questions if q.difficulty == 2)
            hard_count = sum(1 for q in questions if q.difficulty == 3)
            unknown_count = sum(1 for q in questions if q.difficulty is None)

            total_questions = questions.count()
            if total_questions > 0:
                easy_percent = round((easy_count / total_questions) * 100)
                medium_percent = round((medium_count / total_questions) * 100)
                hard_percent = round((hard_count / total_questions) * 100)
                unknown_percent = round((unknown_count / total_questions) * 100)
            else:
                easy_percent = medium_percent = hard_percent = unknown_percent = 0

            # Get unique tags from questions
            all_tags = []
            for question in questions:
                all_tags.extend(question.tags or [])
            unique_tags = list(set(all_tags))

            question_banks_data.append(
                {
                    "id": bank.id,
                    "title": bank.title,
                    "description": bank.description,
                    "easy": easy_percent,
                    "medium": medium_percent,
                    "hard": hard_percent,
                    "tags": unique_tags,
                    "question_count": total_questions,
                }
            )

        # Get exam sections
        sections_data = ExamSectionSerializer(exam.sections.all(), many=True).data

        # Get mandatory questions
        mandatory_questions = exam.mandatory_questions.all()
        mandatory_questions_data = []

        for question in mandatory_questions:
            # Get the question bank for this question
            bank = question.bank
            bank_info = (
                {"id": bank.id, "title": bank.title, "description": bank.description}
                if bank
                else None
            )

            mandatory_questions_data.append(
                {
                    "id": question.id,
                    "prompt": question.prompt,
                    "difficulty": (
                        question.get_difficulty_display()
                        if question.difficulty
                        else "Unknown"
                    ),
                    "tags": question.tags,
                    "fromBank": bank_info,
                }
            )

        return Response(
            {
                "exam": {
                    "id": exam.id,
                    "title": exam.title,
                    "description": exam.description,
                    "exam_type": exam.exam_type,
                    "course": course.id,
                    "course_code": course.code,
                    "course_term": course.term,
                    "time_limit": exam.time_limit,
                    "num_variants": exam.num_variants,
                    "questions_per_variant": exam.questions_per_variant,
                    "randomize_questions": exam.randomize_questions,
                    "randomize_choices": exam.randomize_choices,
                    "show_answers_after": exam.show_answers_after,
                    "easy_percentage": exam.easy_percentage,
                    "medium_percentage": exam.medium_percentage,
                    "hard_percentage": exam.hard_percentage,
                    "unknown_percentage": exam.unknown_percentage,
                    "question_budget": exam.question_budget,
                    "available_from": exam.available_from,
                    "available_until": exam.available_until,
                    "weight": exam.weight,
                    "required_to_pass": exam.required_to_pass,
                    "allow_reuse": exam.allow_reuse,
                    "exam_instructions": exam.exam_instructions,
                    "footer_text": exam.footer_text,
                    "academic_integrity_statement": exam.academic_integrity_statement,
                    "include_academic_integrity": exam.include_academic_integrity,
                    "marking_scheme": exam.marking_scheme,
                },
                "question_banks": question_banks_data,
                "sections": sections_data,
                "mandatory_questions": mandatory_questions_data,
            }
        )

    @action(detail=True, methods=["post"])
    def update_wizard_data(self, request, pk=None):
        """Update exam with wizard data"""
        import logging

        logger = logging.getLogger(__name__)
        logger.info(f"update_wizard_data called for exam {pk}")
        logger.info(f"Request data keys: {list(request.data.keys())}")

        exam = self.get_object()

        try:
            from datetime import datetime

            from django.utils import timezone

            # Update exam fields
            exam_fields = [
                "title",
                "description",
                "exam_type",
                "time_limit",
                "num_variants",
                "questions_per_variant",
                "randomize_questions",
                "randomize_choices",
                "show_answers_after",
                "easy_percentage",
                "medium_percentage",
                "hard_percentage",
                "unknown_percentage",
                "question_budget",
                "weight",
                "required_to_pass",
                "allow_reuse",
                "exam_instructions",
                "footer_text",
                "academic_integrity_statement",
                "include_academic_integrity",
                "marking_scheme",
            ]

            for field in exam_fields:
                if field in request.data:
                    setattr(exam, field, request.data[field])

            # Handle datetime fields with timezone awareness
            if "available_from" in request.data and request.data["available_from"]:
                try:
                    # Parse the date string and make it timezone-aware
                    date_str = request.data["available_from"]
                    if isinstance(date_str, str):
                        # Assuming the date is in YYYY-MM-DD format
                        naive_datetime = datetime.strptime(date_str, "%Y-%m-%d")
                        exam.available_from = timezone.make_aware(naive_datetime)
                    else:
                        exam.available_from = request.data["available_from"]
                except (ValueError, TypeError):
                    # If parsing fails, set to None
                    exam.available_from = None

            if "available_until" in request.data and request.data["available_until"]:
                try:
                    # Parse the date string and make it timezone-aware
                    date_str = request.data["available_until"]
                    if isinstance(date_str, str):
                        # Assuming the date is in YYYY-MM-DD format
                        naive_datetime = datetime.strptime(date_str, "%Y-%m-%d")
                        exam.available_until = timezone.make_aware(naive_datetime)
                    else:
                        exam.available_until = request.data["available_until"]
                except (ValueError, TypeError):
                    # If parsing fails, set to None
                    exam.available_until = None

            exam.save()

            # Update sections if provided
            if "sections" in request.data:
                # Get existing sections to preserve IDs
                existing_sections = list(exam.sections.all())

                # Update or create sections
                for i, section_data in enumerate(request.data["sections"]):
                    question_banks = section_data.pop("question_banks", [])

                    if i < len(existing_sections):
                        # Update existing section
                        section = existing_sections[i]
                        section.title = section_data.get("title", "")
                        section.instructions = section_data.get("instructions", "")
                        section.order = section_data.get("order", i)
                        section.configured_question_count = section_data.get(
                            "configured_question_count", 5
                        )
                        section.save()
                    else:
                        # Create new section
                        section = ExamSection.objects.create(
                            exam=exam,
                            title=section_data.get("title", ""),
                            instructions=section_data.get("instructions", ""),
                            order=section_data.get("order", i),
                            configured_question_count=section_data.get(
                                "configured_question_count", 5
                            ),
                        )

                    section.question_banks.set(question_banks)

                # Remove extra sections if we have fewer sections now
                if len(request.data["sections"]) < len(existing_sections):
                    for section in existing_sections[len(request.data["sections"]) :]:
                        section.delete()

            # Update mandatory questions if provided
            if "mandatory_question_ids" in request.data:
                exam.mandatory_questions.set(request.data["mandatory_question_ids"])

            # Add questions from selected question banks
            if "sections" in request.data:
                from questions.models import Question

                all_question_ids = set()

                # Collect all question IDs from all sections
                for section_data in request.data["sections"]:
                    question_banks = section_data.get("question_banks", [])
                    for bank_id in question_banks:
                        # Get all questions from this bank
                        bank_questions = Question.objects.filter(bank_id=bank_id)
                        all_question_ids.update(
                            bank_questions.values_list("id", flat=True)
                        )

                # Add all questions to the exam
                if all_question_ids:
                    exam.questions.add(
                        *Question.objects.filter(id__in=all_question_ids)
                    )

            if exam.course:
                CourseActivity.objects.create(
                    course=exam.course,
                    user=request.user,
                    activity_type=CourseActivity.ActivityType.EXAM_UPDATED,
                    description=f"{request.user.name} updated exam configuration for '{exam.title}'",
                    entity_type="exam",
                    entity_id=exam.id,
                )

            return Response(
                {"message": "Exam updated successfully", "exam_id": exam.id}
            )

        except Exception as e:
            import logging
            import traceback

            logger = logging.getLogger(__name__)
            logger.error(f"Error in update_wizard_data: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.error(f"Request data: {request.data}")
            return Response(
                {"error": f"Failed to update exam: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def available_question_banks(self, request, pk=None):
        """Get available question banks for the exam's course"""
        exam = self.get_object()
        course = exam.course

        if not course:
            return Response({"error": "Exam must have a course"}, status=400)

        question_banks = QuestionBank.objects.filter(course=course)

        # Add question count and difficulty breakdown
        banks_data = []
        for bank in question_banks:
            questions = bank.questions.all()
            easy_count = sum(1 for q in questions if q.difficulty == 1)
            medium_count = sum(1 for q in questions if q.difficulty == 2)
            hard_count = sum(1 for q in questions if q.difficulty == 3)
            unknown_count = sum(1 for q in questions if q.difficulty is None)

            total_questions = questions.count()
            if total_questions > 0:
                easy_percent = round((easy_count / total_questions) * 100)
                medium_percent = round((medium_count / total_questions) * 100)
                hard_percent = round((hard_count / total_questions) * 100)
                unknown_percent = round((unknown_count / total_questions) * 100)
            else:
                easy_percent = medium_percent = hard_percent = unknown_percent = 0

            # Get unique tags from questions
            all_tags = []
            for question in questions:
                all_tags.extend(question.tags or [])
            unique_tags = list(set(all_tags))

            banks_data.append(
                {
                    "id": bank.id,
                    "title": bank.title,
                    "description": f"{total_questions} questions | Tags: {', '.join(unique_tags[:3])}",
                    "easy": easy_percent,
                    "medium": medium_percent,
                    "hard": hard_percent,
                    "tags": unique_tags,
                    "question_count": total_questions,
                }
            )

        return Response(banks_data)

    @action(detail=True, methods=["post"])
    def add_questions(self, request, pk=None):
        """Add questions to an exam"""
        exam = self.get_object()
        serializer = BulkQuestionAddSerializer(data=request.data)

        if serializer.is_valid():
            question_ids = serializer.validated_data["question_ids"]
            existing_ids = set(exam.questions.values_list("id", flat=True))
            new_question_ids = [qid for qid in question_ids if qid not in existing_ids]

            if new_question_ids:
                new_questions = Question.objects.filter(id__in=new_question_ids)
                exam.questions.add(*new_questions)

                # Log the activity HERE with correct type
                if exam.course:
                    CourseActivity.objects.create(
                        course=exam.course,
                        user=request.user,
                        activity_type=CourseActivity.ActivityType.QUESTIONS_ADDED,  # Correct type
                        description=f"{request.user.name} added {len(new_question_ids)} questions to '{exam.title}'",
                        entity_type="exam",
                        entity_id=exam.id,
                    )

                return Response(
                    {
                        "message": f"Added {len(new_question_ids)} questions to exam",
                        "added_count": len(new_question_ids),
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"message": "All questions are already in the exam"},
                    status=status.HTTP_200_OK,
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def remove_questions(self, request, pk=None):
        """Remove questions from an exam"""
        exam = self.get_object()
        question_ids = request.data.get("question_ids", [])

        if not question_ids:
            return Response(
                {"error": "question_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remove questions from exam
        removed_count = exam.questions.filter(id__in=question_ids).count()
        exam.questions.remove(*question_ids)

        if removed_count > 0 and exam.course:
            CourseActivity.objects.create(
                course=exam.course,
                user=request.user,
                activity_type=CourseActivity.ActivityType.QUESTIONS_REMOVED,
                description=f"{request.user.name} removed {removed_count} questions from '{exam.title}'",
                entity_type="exam",
                entity_id=exam.id,
            )

        # Also remove from mandatory questions if they were mandatory
        exam.mandatory_questions.remove(*question_ids)

        return Response(
            {
                "message": f"Removed {removed_count} questions from exam",
                "removed_count": removed_count,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def toggle_mandatory(self, request, pk=None):
        """Toggle mandatory status of a question"""
        exam = self.get_object()
        question_id = request.data.get("question_id")
        is_mandatory = request.data.get("is_mandatory", False)

        if not question_id:
            return Response(
                {"error": "question_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            question = exam.questions.get(id=question_id)
            if is_mandatory:
                exam.mandatory_questions.add(question)
                message = "Question marked as mandatory"
            else:
                exam.mandatory_questions.remove(question)
                message = "Question removed from mandatory"

            return Response({"message": message}, status=status.HTTP_200_OK)
        except exam.questions.model.DoesNotExist:
            return Response(
                {"error": "Question not found in exam"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=True, methods=["post"])
    def reorder_questions(self, request, pk=None):
        """Reorder questions in an exam"""
        exam = self.get_object()
        question_orders = request.data.get("question_orders", {})

        if not isinstance(question_orders, dict):
            return Response(
                {
                    "error": (
                        "question_orders must be a dictionary mapping "
                        "question_id to order"
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                for question_id, order in question_orders.items():
                    try:
                        exam_question = ExamQuestion.objects.get(
                            exam=exam, question_id=question_id
                        )
                        exam_question.order = order
                        exam_question.save()
                    except ExamQuestion.DoesNotExist:
                        pass

            return Response({"message": "Questions reordered successfully"})
        except Exception as e:
            return Response(
                {"error": f"Failed to reorder questions: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def generate_variants(self, request, pk=None):
        """Generate exam variants using the VariantGenerationService"""
        exam = self.get_object()
        try:
            result = VariantGenerationService.generate_variants(exam)
            # The service returns a dict with variants_created, cheating_risk, etc.

            # Log the activity
            if exam.course:
                CourseActivity.objects.create(
                    course=exam.course,
                    user=request.user,
                    activity_type=CourseActivity.ActivityType.VARIANTS_GENERATED,
                    description=f"{request.user.name} generated {result['variants_created']} variants for '{exam.title}'",
                    entity_type="exam",
                    entity_id=exam.id,
                )

            return Response(result)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(traceback.format_exc())
            return Response(
                {"error": f"Failed to generate variants: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def export_docx(self, request, pk=None):
        """Export exam variants to DOCX format (or ZIP if >1, or single‐variant-all)."""
        exam = self.get_object()

        # 1) Determine if this is an explicit variant request or "export all"
        raw_variant_ids = request.data.get("variant_ids", None)
        if raw_variant_ids is not None:
            # user explicitly passed one or more IDs
            variant_ids = raw_variant_ids
            explicit_request = True
        else:
            # default to all variants
            variant_ids = list(exam.variants.values_list("id", flat=True))
            explicit_request = False

        try:
            # 2) If explicit request for exactly one variant → return bare .docx
            if explicit_request and len(variant_ids) == 1:
                vid = variant_ids[0]
                docx_bytes = ExamExportService.export_variants_to_docx(exam, [vid])
                ExamExportService.create_export_history(
                    exam=exam,
                    user=request.user,
                    export_format="docx",
                    variant_ids=[vid],
                )

                response = HttpResponse(
                    docx_bytes,
                    content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
                label = exam.variants.get(id=vid).version_label

                if exam.course:
                    CourseActivity.objects.create(
                        course=exam.course,
                        user=request.user,
                        activity_type=CourseActivity.ActivityType.EXAM_EXPORTED,
                        description=f"{request.user.name} exported '{exam.title}' variant {label} as DOCX",
                        entity_type="exam",
                        entity_id=exam.id,
                    )

                response["Content-Disposition"] = (
                    f'attachment; filename="{exam.title}_Variant_{label}.docx"'
                )
                return response

            # 3) Otherwise (either multi‐variant OR default/all path) → ZIP
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w") as zf:
                for vid in variant_ids:
                    variant = exam.variants.get(id=vid)
                    label = variant.version_label

                    # add the .docx
                    doc_bytes = ExamExportService.export_variants_to_docx(exam, [vid])
                    zf.writestr(f"{exam.title}_Variant_{label}.docx", doc_bytes)

                    # add the answer‐key CSV
                    csv_str = ExamExportService.generate_answer_key_csv(exam, [vid])
                    zf.writestr(
                        f"{exam.title}_Variant_{label}_AnswerKey.csv",
                        csv_str.encode("utf-8"),
                    )

            buf.seek(0)
            ExamExportService.create_export_history(
                exam=exam,
                user=request.user,
                export_format="zip",
                variant_ids=variant_ids,
            )
            response = HttpResponse(buf.read(), content_type="application/zip")
            response["Content-Disposition"] = (
                f'attachment; filename="{exam.title}_Variants.zip"'
            )
            return response

        except Exception as e:
            return Response(
                {"error": f"Failed to export variants: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def export_answer_key(self, request, pk=None):
        """Export answer key for exam variants in various formats"""
        exam = self.get_object()
        variant_ids = request.data.get("variant_ids")
        export_format = request.data.get("format", "csv")  # Accept format parameter

        try:
            logger.info(
                f"Export answer key request - Exam ID: {exam.id}, Format: {export_format}"
            )
            logger.info(f"Variant IDs: {variant_ids}")

            if export_format == "csv":
                # Generate individual CSV files for each variant and create a ZIP
                from io import BytesIO
                import zipfile

                # If variant_ids is None, export all variants
                if variant_ids is None:
                    variant_ids = list(exam.variants.values_list("id", flat=True))

                # Create ZIP file with individual answer key files
                buffer = BytesIO()
                with zipfile.ZipFile(buffer, "w") as zip_file:
                    for variant_id in variant_ids:
                        try:
                            variant = exam.variants.get(id=variant_id)
                            if variant:
                                # Generate CSV content for this specific variant
                                csv_content = ExamExportService.generate_answer_key_csv(
                                    exam, [variant_id]
                                )
                                filename = f"{exam.title}_Variant_{variant.version_label}_answer_key.csv"
                                zip_file.writestr(filename, csv_content)
                        except Exception as e:
                            logger.error(
                                f"Error generating answer key for variant {variant_id}: {str(e)}"
                            )
                            continue

                # Create export history
                ExamExportService.create_export_history(
                    exam=exam,
                    user=request.user,
                    export_format="csv",
                    variant_ids=variant_ids,
                )

                if exam.course:
                    num_variants = (
                        len(variant_ids) if variant_ids else exam.variants.count()
                    )
                    CourseActivity.objects.create(
                        course=exam.course,
                        user=request.user,
                        activity_type=CourseActivity.ActivityType.EXAM_EXPORTED,
                        description=f"{request.user.name} exported answer keys for {num_variants} variants as {export_format.upper()}",
                        entity_type="exam",
                        entity_id=exam.id,
                    )

                # Return the ZIP file
                buffer.seek(0)
                response = HttpResponse(
                    buffer.getvalue(), content_type="application/zip"
                )
                response["Content-Disposition"] = (
                    f'attachment; filename="{exam.title}_answer_keys.zip"'
                )
                return response

            elif export_format in ["pdf", "docx"]:
                # Generate answer key in PDF or DOCX format
                if export_format == "pdf":
                    logger.info("Generating PDF answer key...")
                    file_bytes = ExamExportService.generate_answer_key_pdf(
                        exam, variant_ids
                    )
                    content_type = "application/pdf"
                else:
                    logger.info("Generating DOCX answer key...")
                    file_bytes = ExamExportService.generate_answer_key_docx(
                        exam, variant_ids
                    )
                    content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

                # Create export history
                ExamExportService.create_export_history(
                    exam=exam,
                    user=request.user,
                    export_format=export_format,
                    variant_ids=variant_ids,
                )

                response = HttpResponse(file_bytes, content_type=content_type)
                response["Content-Disposition"] = (
                    f'attachment; filename="{exam.title}_answer_key.{export_format}"'
                )
                return response

            else:
                return Response(
                    {"error": "Invalid format. Must be 'csv', 'pdf', or 'docx'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            logger.error(f"Export answer key failed: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback

            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to export answer key: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def export_history(self, request, pk=None):
        """Get export history for an exam"""
        exam = self.get_object()
        history = exam.export_history.all()
        serializer = ExamExportHistorySerializer(history, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def update_settings(self, request, pk=None):
        """Update exam settings using the ExamUpdateService"""
        exam = self.get_object()

        try:
            updated_exam = ExamUpdateService.update_exam_settings(exam, request.data)
            serializer = ExamDetailSerializer(updated_exam)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Failed to update settings: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def assign_variants_to_students(self, request, pk=None):
        """Assign variants to students for this exam"""
        exam = self.get_object()

        # Get assignment strategy from request
        assignment_strategy = request.data.get("strategy", "round_robin")
        if assignment_strategy not in ["round_robin", "random", "seating_based"]:
            return Response(
                {
                    "error": (
                        "Invalid strategy. Must be 'round_robin', 'random', or "
                        "'seating_based'"
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get students for this exam's course
        from courses.models import Student

        students = Student.objects.filter(course=exam.course, is_active=True)

        if not students.exists():
            return Response(
                {"error": "No active students found for this course"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not exam.variants.exists():
            return Response(
                {"error": "No variants available. Generate variants first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Use the model method to assign variants
            assignments = StudentVariantAssignment.assign_variants_to_students(
                exam=exam, students=students, assignment_strategy=assignment_strategy
            )

            # Return assignment summary
            assignment_summary = {}
            for variant in exam.variants.all():
                variant_assignments = StudentVariantAssignment.objects.filter(
                    exam=exam, variant=variant
                )
                assignment_summary[f"Variant {variant.version_label}"] = {
                    "assigned_students": variant_assignments.count(),
                    "students": [
                        {
                            "name": assignment.student.display_name,
                            "student_id": assignment.student.display_id,
                            "seating": assignment.seating_info,
                        }
                        for assignment in variant_assignments
                    ],
                }

            return Response(
                {
                    "message": (
                        f"Successfully assigned variants to "
                        f"{len(assignments)} students"
                    ),
                    "strategy_used": assignment_strategy,
                    "assignments": assignment_summary,
                }
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to assign variants: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["get"])
    def student_assignments(self, request, pk=None):
        """Get current student-variant assignments for this exam"""
        exam = self.get_object()

        assignments = StudentVariantAssignment.objects.filter(exam=exam)

        assignment_data = []
        for assignment in assignments:
            assignment_data.append(
                {
                    "student": {
                        "id": assignment.student.id,
                        "name": assignment.student.display_name,
                        "student_id": assignment.student.display_id,
                        "email": assignment.student.email,
                        "section": assignment.student.section,
                    },
                    "variant": {
                        "id": assignment.variant.id,
                        "version_label": assignment.variant.version_label,
                    },
                    "seating": {
                        "seat_number": assignment.seat_number,
                        "row_number": assignment.row_number,
                        "formatted": assignment.seating_info,
                    },
                    "assigned_at": assignment.assigned_at,
                    "is_active": assignment.is_active,
                }
            )

        return Response(
            {
                "exam": {
                    "id": exam.id,
                    "title": exam.title,
                    "course": exam.course.code if exam.course else None,
                },
                "total_assignments": len(assignment_data),
                "assignments": assignment_data,
            }
        )

    @action(detail=True, methods=["get"])
    def analytics(self, request, pk=None):
        """Return analytics for the exam (without regenerating variants)"""
        exam = self.get_object()
        from .serializers import ExamDetailSerializer

        serializer = ExamDetailSerializer(exam)
        return Response(serializer.data.get("analytics"))

    @action(detail=True, methods=["post"])
    def export_variants(self, request, pk=None):
        """Export all variants as DOCX (zip), PDF (zip), or Answer Keys (zip)"""
        import logging

        logger = logging.getLogger(__name__)

        exam = self.get_object()
        variant_ids = request.data.get("variant_ids")
        export_format = request.data.get("format", "docx")

        logger.info(f"Export request - Exam ID: {pk}, Format: {export_format}")
        logger.info(f"Variant IDs: {variant_ids}")

        try:
            if export_format == "docx":
                logger.info("Starting DOCX export...")
                zip_bytes = ExamExportService.export_variants_to_zip(
                    exam, variant_ids, "docx"
                )
                filename = f"{exam.title}_variants_docx.zip"
                content_type = "application/zip"
            elif export_format == "pdf":
                logger.info("Starting PDF export...")
                zip_bytes = ExamExportService.export_variants_to_zip(
                    exam, variant_ids, "pdf"
                )
                filename = f"{exam.title}_variants_pdf.zip"
                content_type = "application/zip"
            elif export_format == "answer_key":
                logger.info("Starting answer key export...")
                zip_bytes = ExamExportService.export_answer_keys_to_zip(
                    exam, variant_ids
                )
                filename = f"{exam.title}_answer_keys.zip"
                content_type = "application/zip"
            else:
                return Response({"error": "Invalid export format"}, status=400)

            logger.info(f"Export completed successfully - Filename: {filename}")

            if exam.course:
                num_variants = (
                    len(variant_ids) if variant_ids else exam.variants.count()
                )
                CourseActivity.objects.create(
                    course=exam.course,
                    user=request.user,
                    activity_type=CourseActivity.ActivityType.EXAM_EXPORTED,
                    description=f"{request.user.name} exported {num_variants} variants as {export_format.upper()}",
                    entity_type="exam",
                    entity_id=exam.id,
                )

            response = HttpResponse(zip_bytes, content_type=content_type)
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            logger.error(f"Export failed with error: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            import traceback

            logger.error(f"Traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to export variants: {str(e)}"}, status=500
            )

    @action(detail=True, methods=["post"])
    def export_variant(self, request, pk=None):
        """Export a single variant as DOCX, PDF, CSV, or Answer Key"""
        exam = self.get_object()
        variant_id = request.data.get("variant_id")
        export_format = request.data.get("format", "docx")

        try:
            if export_format == "docx":
                files = ExamExportService.export_variants_to_docx_files(
                    exam, [variant_id]
                )
                filename, filebytes = files[0]
                content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif export_format == "pdf":
                files = ExamExportService.export_variants_to_pdf_files(
                    exam, [variant_id]
                )
                filename, filebytes = files[0]
                content_type = "application/pdf"
            elif export_format == "csv":
                # Export full exam as CSV
                csv_content = ExamExportService.generate_exam_csv(exam, [variant_id])
                variant = exam.variants.get(id=variant_id)
                filename = f"{exam.title}_Variant_{variant.version_label}.csv"
                filebytes = csv_content.encode("utf-8")
                content_type = "text/csv"
            elif export_format == "answer_key":
                # This is kept for backward compatibility
                csv_content = ExamExportService.generate_answer_key_csv(
                    exam, [variant_id]
                )
                filename = f"{exam.title}_Variant_{variant_id}_AnswerKey.csv"
                filebytes = csv_content.encode("utf-8")
                content_type = "text/csv"
            else:
                return Response({"error": "Invalid export format"}, status=400)

            # Add before response in both methods
            if exam.course:
                CourseActivity.objects.create(
                    course=exam.course,
                    user=request.user,
                    activity_type=CourseActivity.ActivityType.EXAM_EXPORTED,
                    description=f"{request.user.name} exported '{exam.title}' single variant as {export_format.upper()}",
                    entity_type="exam",
                    entity_id=exam.id,
                )

            response = HttpResponse(filebytes, content_type=content_type)
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response(
                {"error": f"Failed to export variant: {str(e)}"}, status=500
            )

    @action(detail=True, methods=["post"])
    def export_answer_keys_batch(self, request, pk=None):
        """Export all answer keys in the specified format as a ZIP file"""
        exam = self.get_object()
        variant_ids = request.data.get("variant_ids")
        export_format = request.data.get("format", "csv")

        try:
            buffer = io.BytesIO()

            with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                for variant_id in variant_ids:
                    variant = exam.variants.get(id=variant_id)

                    if export_format == "csv":
                        content = ExamExportService.generate_answer_key_csv(
                            exam, [variant_id]
                        )
                        filename = f"{exam.title}_Variant_{variant.version_label}_AnswerKey.csv"
                        zf.writestr(filename, content.encode("utf-8"))
                    elif export_format == "pdf":
                        content = ExamExportService.generate_answer_key_pdf(
                            exam, [variant_id]
                        )
                        filename = f"{exam.title}_Variant_{variant.version_label}_AnswerKey.pdf"
                        zf.writestr(filename, content)
                    elif export_format == "docx":
                        content = ExamExportService.generate_answer_key_docx(
                            exam, [variant_id]
                        )
                        filename = f"{exam.title}_Variant_{variant.version_label}_AnswerKey.docx"
                        zf.writestr(filename, content)

            buffer.seek(0)

            # Create export history
            ExamExportService.create_export_history(
                exam=exam,
                user=request.user,
                export_format=f"answer_keys_{export_format}_zip",
                variant_ids=variant_ids,
            )

            # Add before response in both methods
            if exam.course:
                CourseActivity.objects.create(
                    course=exam.course,
                    user=request.user,
                    activity_type=CourseActivity.ActivityType.EXAM_EXPORTED,
                    description=f"{request.user.name} exported {len(variant_ids)} variants as {export_format.upper()}",
                    entity_type="exam",
                    entity_id=exam.id,
                )

            response = HttpResponse(buffer.getvalue(), content_type="application/zip")
            response["Content-Disposition"] = (
                f'attachment; filename="{exam.title}_all_answer_keys_{export_format}.zip"'
            )
            return response

        except Exception as e:
            return Response(
                {"error": f"Failed to export answer keys: {str(e)}"}, status=500
            )

    @action(detail=True, methods=["post"])
    def export_exams_batch(self, request, pk=None):
        """Export all exam variants in the specified format as a ZIP file"""
        exam = self.get_object()
        variant_ids = request.data.get("variant_ids")
        export_format = request.data.get("format", "pdf")

        try:
            buffer = io.BytesIO()

            with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                if export_format == "csv":
                    # For CSV, use the generate_exam_csv method
                    for variant_id in variant_ids:
                        variant = exam.variants.get(id=variant_id)
                        content = ExamExportService.generate_exam_csv(
                            exam, [variant_id]
                        )
                        filename = f"{exam.title}_Variant_{variant.version_label}.csv"
                        zf.writestr(filename, content.encode("utf-8"))
                elif export_format == "pdf":
                    # Use existing PDF export
                    files = ExamExportService.export_variants_to_pdf_files(
                        exam, variant_ids
                    )
                    for filename, content in files:
                        zf.writestr(filename, content)
                elif export_format == "docx":
                    # Use existing DOCX export
                    files = ExamExportService.export_variants_to_docx_files(
                        exam, variant_ids
                    )
                    for filename, content in files:
                        zf.writestr(filename, content)

            buffer.seek(0)

            # Create export history
            ExamExportService.create_export_history(
                exam=exam,
                user=request.user,
                export_format=f"exams_{export_format}_zip",
                variant_ids=variant_ids,
            )

            # Add before response in both methods
            if exam.course:
                CourseActivity.objects.create(
                    course=exam.course,
                    user=request.user,
                    activity_type=CourseActivity.ActivityType.EXAM_EXPORTED,
                    description=f"{request.user.name} exported {len(variant_ids)} variants as {export_format.upper()}",
                    entity_type="exam",
                    entity_id=exam.id,
                )

            response = HttpResponse(buffer.getvalue(), content_type="application/zip")
            response["Content-Disposition"] = (
                f'attachment; filename="{exam.title}_all_variants_{export_format}.zip"'
            )
            return response

        except Exception as e:
            return Response({"error": f"Failed to export exams: {str(e)}"}, status=500)


# ViewSets for other models


class VariantViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for exam variants (read-only)"""

    serializer_class = VariantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Variant.objects.filter(exam__created_by=self.request.user)
            .select_related("exam")
            .prefetch_related("questions")
        )

    @action(detail=True, methods=["post"])
    def lock_variant(self, request, pk=None):
        """Lock a variant to prevent editing"""
        variant = self.get_object()

        try:
            # Check if there's already a locked set (using second-based grouping)
            from datetime import timedelta

            variant_time = variant.created_at
            second_start = variant_time.replace(microsecond=0)
            second_end = second_start + timedelta(seconds=1)

            existing_locked = Variant.objects.filter(
                exam=variant.exam, is_locked=True
            ).exclude(created_at__gte=second_start, created_at__lt=second_end)

            # If there's an existing locked set, unlock it first (this allows switching)
            if existing_locked.exists():
                existing_locked.update(is_locked=False)

            # Unlock all variants in the same exam first
            Variant.objects.filter(exam=variant.exam).update(is_locked=False)

            # Lock all variants in the same set (same second timestamp)
            from datetime import timedelta

            # Get the second range for this variant's creation time
            variant_time = variant.created_at
            second_start = variant_time.replace(microsecond=0)
            second_end = second_start + timedelta(seconds=1)

            variants_in_set = Variant.objects.filter(
                exam=variant.exam,
                created_at__gte=second_start,
                created_at__lt=second_end,
            )
            variants_in_set.update(is_locked=True)

            return Response(
                {
                    "message": "Variant set locked successfully",
                    "variant_id": variant.id,
                    "is_locked": True,
                    "locked_count": variants_in_set.count(),
                }
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to lock variant: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def unlock_variant(self, request, pk=None):
        """Unlock a variant to allow editing"""
        variant = self.get_object()

        if not variant.is_locked:
            return Response(
                {"error": "Variant is not locked"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            variant.is_locked = False
            variant.save()

            return Response(
                {
                    "message": f"Variant {variant.version_label} unlocked successfully",
                    "variant_id": variant.id,
                    "is_locked": False,
                }
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to unlock variant: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def delete_variant(self, request, pk=None):
        """Delete a variant"""
        variant = self.get_object()

        try:
            # Check if variant is locked
            if variant.is_locked:
                return Response(
                    {
                        "error": "Cannot delete a locked variant. Please unlock it first."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Delete the variant
            variant.delete()

            return Response(
                {
                    "message": f"Variant {variant.version_label} deleted successfully",
                    "variant_id": variant.id,
                }
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to delete variant: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def variant_sets(self, request):
        """Get variant sets grouped by creation date"""
        exam_id = request.query_params.get("exam_id")
        if not exam_id:
            return Response(
                {"error": "exam_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            exam = Exam.objects.get(id=exam_id, created_by=request.user)
            variants = (
                Variant.objects.filter(exam=exam)
                .prefetch_related(
                    "variantquestion_set__question", "variantquestion_set__section"
                )
                .order_by("created_at")
            )

            # Group variants by creation timestamp (same time = same set)
            variant_sets = {}
            for variant in variants:
                # Group by second to ensure each generation creates a unique set
                timestamp_key = variant.created_at.strftime("%Y-%m-%d-%H-%M-%S")
                if timestamp_key not in variant_sets:
                    variant_sets[timestamp_key] = {
                        "id": f"set-{timestamp_key}",
                        "name": variant.created_at.strftime("%B %d, %Y at %I:%M:%S %p"),
                        "variants": [],
                        "is_locked": False,
                        "created_at": variant.created_at,
                        "is_active": False,
                    }

                # Get the full variant data with questions using VariantSerializer
                try:
                    variant_serializer = VariantSerializer(variant)
                    variant_data = variant_serializer.data
                except Exception as e:
                    print(
                        f"DEBUG: Error serializing variant {variant.version_label}: {str(e)}"
                    )
                    # Fallback to basic data
                    variant_data = {
                        "id": variant.id,
                        "version_label": variant.version_label,
                        "is_locked": variant.is_locked,
                        "question_count": variant.variantquestion_set.count(),
                        "created_at": variant.created_at,
                        "questions": [],
                    }

                variant_sets[timestamp_key]["variants"].append(variant_data)

                # Check if any variant in this set is locked
                if variant.is_locked:
                    variant_sets[timestamp_key]["is_locked"] = True
                    variant_sets[timestamp_key]["is_active"] = True

            return Response(
                {"exam_id": exam_id, "variant_sets": list(variant_sets.values())}
            )
        except Exam.DoesNotExist:
            return Response(
                {"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to get variant sets: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def update_order(self, request, pk=None):
        """Update question order in a variant"""
        variant = self.get_object()
        question_orders = request.data.get("question_orders", {})

        try:
            ExamUpdateService.update_variant_order(
                variant.exam, variant.id, question_orders
            )
            return Response({"message": "Question order updated successfully"})
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"Failed to update order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def remove_question(self, request, pk=None):
        """Remove a question from a variant"""
        variant = self.get_object()
        question_id = request.data.get("question_id")
        if not question_id:
            return Response(
                {"error": "question_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            vq = variant.variantquestion_set.get(question_id=question_id)
            vq.delete()
            return Response(
                {"message": f"Question {question_id} removed from variant."},
                status=status.HTTP_200_OK,
            )
        except VariantQuestion.DoesNotExist:
            return Response(
                {"error": "Question not found in variant."},
                status=status.HTTP_404_NOT_FOUND,
            )


class ExamExportHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for exam export history (read-only)"""

    serializer_class = ExamExportHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExamExportHistory.objects.filter(
            exam__created_by=self.request.user
        ).select_related("exam", "exported_by")


# Additional views that are referenced in urls.py


class ExamListView(generics.ListAPIView):
    """
    List view for exams - alternative to ViewSet list action
    """

    serializer_class = ExamListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Exam.objects.filter(created_by=self.request.user)
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset.select_related("course", "created_by")


class ExamsHealthCheckView(APIView):
    """
    Health check endpoint for the exams app
    """

    permission_classes = []  # No authentication required for health check

    def get(self, request):
        return Response({"status": "healthy", "app": "exams"})


class CourseListView(generics.ListAPIView):
    """
    List all courses
    """

    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]


class CourseView(generics.RetrieveAPIView, generics.ListCreateAPIView):
    """
    Retrieve, list, or create courses
    """

    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if "pk" in kwargs:
            return self.retrieve(request, *args, **kwargs)
        return self.list(request, *args, **kwargs)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def template_layout_api(request):
    """Handle template CRUD operations."""

    if request.method == "GET":
        # Get user's own templates plus any default templates
        user_templates = ExamTemplate.objects.filter(created_by=request.user)
        default_templates = ExamTemplate.objects.filter(is_default=True)

        # Combine and remove duplicates (in case user created a default template)
        all_templates = list(user_templates) + list(default_templates)
        unique_templates = list(
            {template.id: template for template in all_templates}.values()
        )

        serializer = ExamTemplateSerializer(unique_templates, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        # Create a new template
        serializer = ExamTemplateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def template_layout_detail_api(request, template_id):
    """Handle individual template operations."""

    logger.info(f"🔍 Template detail API called with template_id: {template_id}")
    logger.info(f"🔍 User: {request.user}")

    try:
        # Allow access to default templates regardless of creator, or templates created by the user
        template = get_object_or_404(ExamTemplate, id=template_id)

        # Check if user can access this template
        if not template.is_default and template.created_by != request.user:
            logger.error(
                f"🔍 User {request.user.email} cannot access template {template_id} created by {template.created_by.email}"
            )
            return Response(
                {"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND
            )

        logger.info(f"🔍 Template found: {template.name}")
    except Exception as e:
        logger.error(f"🔍 Template not found or error: {e}")
        return Response(
            {"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = ExamTemplateSerializer(template)
        logger.info(f"🔍 Returning template data: {serializer.data}")
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = ExamTemplateSerializer(template, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        template.delete()
        return Response(
            {"message": "Template deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_templates_list(request):
    """Get all templates for admin management"""
    try:
        templates = ExamTemplate.objects.select_related("created_by").all()
        serializer = ExamTemplateSerializer(templates, many=True)
        return Response(
            {
                "success": True,
                "templates": serializer.data,
                "statistics": {
                    "total_templates": templates.count(),
                    "default_templates": templates.filter(is_default=True).count(),
                },
            }
        )
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_create_template(request):
    """Create a new template for admin"""
    try:
        data = request.data.copy()
        data["created_by"] = request.user.id

        # If setting as default, unset other defaults
        if data.get("is_default", False):
            ExamTemplate.objects.filter(is_default=True).update(is_default=False)

        serializer = ExamTemplateSerializer(data=data)
        if serializer.is_valid():
            template = serializer.save()
            return Response(
                {"success": True, "template": ExamTemplateSerializer(template).data}
            )
        else:
            return Response(
                {"success": False, "error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["PUT"])
@permission_classes([IsAdminUser])
def admin_update_template(request, template_id):
    """Update a template for admin"""
    try:
        template = ExamTemplate.objects.get(id=template_id)
        data = request.data.copy()

        # If setting as default, unset other defaults
        if data.get("is_default", False):
            ExamTemplate.objects.filter(is_default=True).update(is_default=False)

        serializer = ExamTemplateSerializer(template, data=data, partial=True)
        if serializer.is_valid():
            updated_template = serializer.save()
            return Response(
                {
                    "success": True,
                    "template": ExamTemplateSerializer(updated_template).data,
                }
            )
        else:
            return Response(
                {"success": False, "error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
    except ExamTemplate.DoesNotExist:
        return Response(
            {"success": False, "error": "Template not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_delete_template(request, template_id):
    """Delete a template for admin"""
    try:
        template = ExamTemplate.objects.get(id=template_id)
        template.delete()
        return Response({"success": True, "message": "Template deleted successfully"})
    except ExamTemplate.DoesNotExist:
        return Response(
            {"success": False, "error": "Template not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_default_template(request, template_id):
    """Set a template as default"""
    try:
        # Unset all current defaults
        ExamTemplate.objects.filter(is_default=True).update(is_default=False)

        # Set the new default
        template = ExamTemplate.objects.get(id=template_id)
        template.is_default = True
        template.save()

        return Response(
            {"success": True, "message": "Default template updated successfully"}
        )
    except ExamTemplate.DoesNotExist:
        return Response(
            {"success": False, "error": "Template not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"success": False, "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
