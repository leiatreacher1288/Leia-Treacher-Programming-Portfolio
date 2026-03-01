"""
PDF Export functionality for exam variants
"""

import datetime
from io import BytesIO
import textwrap
from typing import List, Optional, Tuple

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from .models import Exam


class PDFExporter:
    """Handles PDF export of exam variants with UBC professional formatting"""

    @staticmethod
    def export_variants_to_pdf_files(
        exam: Exam, variant_ids: Optional[List[int]] = None
    ) -> List[Tuple[str, bytes]]:
        """
        Export variants to PDF format with UBC professional formatting.
        Returns a list of tuples: [(filename, pdf_bytes), ...]
        """
        result_files = []

        # If variant_ids is None, export all variants
        if variant_ids is None:
            variant_ids = list(exam.variants.values_list("id", flat=True))

        for vid in variant_ids:
            variant = exam.variants.get(id=vid)
            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)

            # Set margins to 1 inch
            margin = 1 * inch
            page_width, page_height = letter
            page_width - 2 * margin
            page_height - 2 * margin

            # 1. UBC-STYLE HEADER AREA
            y_position = page_height - margin - 50

            # Course code and title
            if hasattr(exam, "course") and exam.course:
                c.setFont("Times-Bold", 14)
                course_text = f"[{exam.course.code}] {exam.title}"
                text_width = c.stringWidth(course_text, "Times-Bold", 14)
                c.drawString((page_width - text_width) / 2, y_position, course_text)
                y_position -= 30

            # Course title
            if hasattr(exam, "course") and exam.course:
                c.setFont("Times-Roman", 12)
                course_title_text = f"Course Title: {exam.course.name}"
                text_width = c.stringWidth(course_title_text, "Times-Roman", 12)
                c.drawString(
                    (page_width - text_width) / 2, y_position, course_title_text
                )
                y_position -= 25

            # Date
            exam_date = getattr(exam, "available_from", None)
            if not exam_date:
                exam_date = getattr(exam, "created_at", datetime.datetime.now())
            if isinstance(exam_date, str):
                exam_date = datetime.datetime.fromisoformat(
                    exam_date.replace("Z", "+00:00")
                )
            date_text = f"Date: {exam_date.strftime('%B %Y')}"
            text_width = c.stringWidth(date_text, "Times-Roman", 12)
            c.drawString((page_width - text_width) / 2, y_position, date_text)
            y_position -= 30

            # Variant label
            variant_text = f"Variant {variant.version_label}"
            c.setFont("Times-Bold", 14)
            text_width = c.stringWidth(variant_text, "Times-Bold", 14)
            c.drawString((page_width - text_width) / 2, y_position, variant_text)
            y_position -= 60

            # 2. STUDENT INFO SECTION
            # Name and Student ID
            c.setFont("Times-Bold", 12)
            c.drawString(margin, y_position, "Name:")
            c.drawString(margin + 200, y_position, "Student ID:")
            y_position -= 20

            c.setFont("Times-Roman", 12)
            c.drawString(margin + 50, y_position, "_____________________________")
            c.drawString(margin + 250, y_position, "_____________________________")
            y_position -= 30

            # Signature
            c.setFont("Times-Bold", 12)
            c.drawString(margin, y_position, "Signature:")
            c.setFont("Times-Roman", 12)
            c.drawString(margin + 80, y_position, "____________________________")
            y_position -= 50

            # 3. INSTRUCTIONS BLOCK (only if exam_instructions is not empty)
            if hasattr(exam, "exam_instructions") and exam.exam_instructions.strip():
                c.setFont("Times-Italic", 12)
                # Split by line breaks and handle each line separately
                instruction_lines = exam.exam_instructions.split("\n")
                for line in instruction_lines:
                    if line.strip():  # Only process non-empty lines
                        # Wrap long lines if needed
                        wrapped_lines = textwrap.wrap(line.strip(), width=70)
                        for wrapped_line in wrapped_lines:
                            c.drawString(margin + 20, y_position, wrapped_line)
                            y_position -= 18
                    else:
                        # Add spacing for empty lines
                        y_position -= 10
                y_position -= 10

            # Time and marks info (only if both are set and non-zero)
            time_limit = getattr(exam, "time_limit", 0)
            total_points = getattr(exam, "total_points", 0)

            if time_limit and total_points and time_limit > 0 and total_points > 0:
                c.setFont("Times-Roman", 12)
                time_marks_text = f"• You have {time_limit} minutes to write this exam. A total of {total_points} marks are available."
                time_marks_lines = textwrap.wrap(time_marks_text, width=70)
                for line in time_marks_lines:
                    c.drawString(margin + 20, y_position, line)
                    y_position -= 18
                y_position -= 10

            # 4. ACADEMIC INTEGRITY STATEMENT
            if (
                hasattr(exam, "include_academic_integrity")
                and exam.include_academic_integrity
            ):
                y_position -= 20
                c.setFont("Times-Bold", 12)
                c.drawString(margin, y_position, "Academic Integrity Statement:")
                y_position -= 25

                c.setFont("Times-Roman", 12)
                # Use custom statement if provided, otherwise use default
                custom_statement = getattr(exam, "academic_integrity_statement", "")
                if custom_statement and custom_statement.strip():
                    statement = custom_statement
                else:
                    statement = "I confirm that I will not give or receive unauthorized aid on this examination. I understand that academic dishonesty includes, but is not limited to, cheating, plagiarism, and the unauthorized use of materials or devices."

                statement_lines = textwrap.wrap(statement, width=70)
                for line in statement_lines:
                    c.drawString(margin + 20, y_position, line)
                    y_position -= 18
                y_position -= 20

            # 5. QUESTIONS SECTION
            variant_questions = variant.variantquestion_set.select_related(
                "question", "section"
            ).order_by("order")

            # Group questions by section if sections exist
            if hasattr(exam, "sections") and exam.sections.exists():
                # Group questions by section using the stored section information
                questions_by_section = {}
                questions_without_section = []

                for vq in variant_questions:
                    section = vq.section
                    if section:
                        if section.id not in questions_by_section:
                            questions_by_section[section.id] = {
                                "section": section,
                                "questions": [],
                            }
                        questions_by_section[section.id]["questions"].append(vq)
                    else:
                        # Questions without sections go to a separate list
                        questions_without_section.append(vq)

                # Sort sections by order and render questions
                question_number = 1

                for section_id in sorted(
                    questions_by_section.keys(),
                    key=lambda x: questions_by_section[x]["section"].order,
                ):
                    section_data = questions_by_section[section_id]
                    section = section_data["section"]

                    # Check if we need a new page for section header
                    if y_position < margin + 150:
                        c.showPage()
                        y_position = page_height - margin - 50

                    # Section header
                    c.setFont("Times-Bold", 14)
                    # Check if title already starts with "Section" to avoid duplication
                    if section.title.startswith("Section "):
                        section_text = f"{section.title} — Multiple Choice"
                    else:
                        section_text = f"Section {section.title} — Multiple Choice"
                    c.drawString(margin, y_position, section_text)
                    y_position -= 25

                    # Add section point information based on marking scheme
                    if hasattr(exam, "marking_scheme") and exam.marking_scheme:
                        section_weighting = exam.marking_scheme.get(
                            "sectionWeighting", {}
                        )
                        # Try both string and number keys for section ID
                        section_id_str = str(section.id)
                        section_id_num = section.id
                        weight = section_weighting.get(
                            section_id_str, section_weighting.get(section_id_num, 1.0)
                        )

                        # Debug logging
                        print(f"🔍 PDF Export - Section {section.id}:")
                        print(f"   Section weighting: {section_weighting}")
                        print(f"   Section ID (str): {section_id_str}")
                        print(f"   Section ID (num): {section_id_num}")
                        print(f"   Weight: {weight}")

                        c.setFont("Times-Italic", 11)
                        points_text = f"Each question in this section is worth {weight} point{'s' if weight != 1 else ''}."
                        points_lines = textwrap.wrap(points_text, width=70)
                        for line in points_lines:
                            c.drawString(margin, y_position, line)
                            y_position -= 16
                        y_position -= 10

                    # Section instructions if provided
                    if section.instructions:
                        c.setFont("Times-Italic", 12)
                        section_lines = textwrap.wrap(section.instructions, width=70)
                        for line in section_lines:
                            c.drawString(margin, y_position, line)
                            y_position -= 18
                        y_position -= 10

                    # Questions in this section
                    for vq in section_data["questions"]:
                        question = vq.question

                        # Check if we need a new page
                        if y_position < margin + 100:
                            c.showPage()
                            y_position = page_height - margin - 50

                        # Add question (without individual marks)
                        c.setFont("Times-Bold", 12)
                        question_text = f"{question_number}. {question.prompt}"
                        question_lines = textwrap.wrap(question_text, width=70)
                        for line in question_lines:
                            c.drawString(margin, y_position, line)
                            y_position -= 20

                        # Get choices - use randomized if available
                        if vq.randomized_choices:
                            choices = vq.randomized_choices
                        else:
                            choices = question.choices

                        # Draw choices with proper indentation
                        c.setFont("Times-Roman", 12)
                        if isinstance(choices, dict):
                            for label, text in choices.items():
                                choice_text = f"{label}. {text}"
                                choice_lines = textwrap.wrap(choice_text, width=65)
                                for line in choice_lines:
                                    c.drawString(margin + 20, y_position, line)
                                    y_position -= 18

                        # Space between questions
                        y_position -= 15
                        question_number += 1

                # Handle questions without sections
                if questions_without_section:
                    # Check if we need a new page
                    if y_position < margin + 150:
                        c.showPage()
                        y_position = page_height - margin - 50

                    # Section header for questions without sections
                    c.setFont("Times-Bold", 14)
                    section_text = "Additional Questions — Multiple Choice"
                    c.drawString(margin, y_position, section_text)
                    y_position -= 25

                    for vq in questions_without_section:
                        question = vq.question

                        # Check if we need a new page
                        if y_position < margin + 100:
                            c.showPage()
                            y_position = page_height - margin - 50

                        # Add question (without individual marks)
                        c.setFont("Times-Bold", 12)
                        question_text = f"{question_number}. {question.prompt}"
                        question_lines = textwrap.wrap(question_text, width=70)
                        for line in question_lines:
                            c.drawString(margin, y_position, line)
                            y_position -= 20

                        # Get choices - use randomized if available
                        if vq.randomized_choices:
                            choices = vq.randomized_choices
                        else:
                            choices = question.choices

                        # Draw choices with proper indentation
                        c.setFont("Times-Roman", 12)
                        if isinstance(choices, dict):
                            for label, text in choices.items():
                                choice_text = f"{label}. {text}"
                                choice_lines = textwrap.wrap(choice_text, width=65)
                                for line in choice_lines:
                                    c.drawString(margin + 20, y_position, line)
                                    y_position -= 18

                        # Space between questions
                        y_position -= 15
                        question_number += 1
            else:
                # No sections - just add questions sequentially
                for idx, vq in enumerate(variant_questions, start=1):
                    question = vq.question

                    # Check if we need a new page
                    if y_position < margin + 100:
                        c.showPage()
                        y_position = page_height - margin - 50

                    # Question prompt (without individual marks)
                    c.setFont("Times-Bold", 12)
                    question_text = f"{idx}. {question.prompt}"
                    question_lines = textwrap.wrap(question_text, width=70)
                    for line in question_lines:
                        c.drawString(margin, y_position, line)
                        y_position -= 20

                    # Get choices - use randomized if available
                    if vq.randomized_choices:
                        choices = vq.randomized_choices
                    else:
                        choices = question.choices

                    # Draw choices with proper indentation
                    c.setFont("Times-Roman", 12)
                    if isinstance(choices, dict):
                        for label, text in choices.items():
                            choice_text = f"{label}. {text}"
                            choice_lines = textwrap.wrap(choice_text, width=65)
                            for line in choice_lines:
                                c.drawString(margin + 20, y_position, line)
                                y_position -= 18

                    # Space between questions
                    y_position -= 15

            # 6. FOOTER (if provided)
            if hasattr(exam, "footer_text") and exam.footer_text:
                # Add a page break to ensure footer is on a new page
                c.showPage()
                y_position = page_height - margin - 50

                c.setFont("Times-Roman", 10)
                c.setFont("Times-Italic", 10)
                footer_lines = textwrap.wrap(exam.footer_text, width=70)
                for line in footer_lines:
                    c.drawString(margin, y_position, line)
                    y_position -= 15

            # Save the PDF
            c.save()
            buffer.seek(0)

            filename = f"{exam.title}_Variant_{variant.version_label}.pdf"
            result_files.append((filename, buffer.getvalue()))

        return result_files
