# utils/csv_import.py

import csv
from io import TextIOWrapper
import re


def parse_csv_file(uploaded_file):
    """
    Parses the uploaded CSV file into a list of question dictionaries
    that can be validated and saved via the QuestionSerializer.
    """
    # This handles file decoding so we can read text (not bytes)
    decoded_file = TextIOWrapper(uploaded_file.file, encoding="utf-8")
    reader = csv.DictReader(decoded_file)

    questions = []

    for i, row in enumerate(reader, start=1):
        try:
            # Basic field extraction
            text = row.get("prompt", "").strip()
            explanation = row.get("explanation", "").strip()
            choices = {
                key.upper(): row[key].strip()
                for key in ["a", "b", "c", "d", "e"]  # Ensure A–E support
                if key in row and row[key].strip()
            }

            correct = row.get("correct_answer", "")
            correct_answer = [
                ans.strip().upper()
                for ans in re.split(r"[|,;]", correct)  # ← accept | , or ;
                if ans.strip()
            ]

            tags_raw = row.get("tags", "")
            tags = [tag.strip() for tag in tags_raw.split("|") if tag.strip()]

            difficulty = (
                int(row.get("difficulty", 0))
                if row.get("difficulty", "").isdigit()
                else None
            )
            questions.append(
                {
                    "prompt": text,
                    "explanation": explanation,
                    "choices": choices,
                    "correct_answer": correct_answer,
                    "difficulty": difficulty,
                    "tags": tags,
                }
            )

        except Exception as e:
            # Add some context in case of bad data
            raise ValueError(f"Error parsing row {i}: {str(e)}")

    return questions
