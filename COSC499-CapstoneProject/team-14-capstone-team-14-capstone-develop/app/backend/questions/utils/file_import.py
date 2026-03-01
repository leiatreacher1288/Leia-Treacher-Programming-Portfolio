import csv
from io import TextIOWrapper
import re
from typing import Any, Dict, List

# You will need to install python-docx and PyPDF2 for docx/pdf support
try:
    import docx
except ImportError:
    docx = None
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None


def parse_txt_file(uploaded_file) -> List[Dict]:
    decoded_file = TextIOWrapper(uploaded_file.file, encoding="utf-8")
    content = decoded_file.read()
    # TODO: Implement a robust parser for your TXT format
    # For now, treat each line as a question prompt
    questions = []
    for line in content.splitlines():
        if line.strip():
            questions.append({"prompt": line.strip()})
    return questions


def _row_to_question(row: Dict) -> Dict:
    # This should match your CSV logic
    text = row.get("prompt", "").strip()
    explanation = row.get("explanation", "").strip()
    choices = {
        key.upper(): row[key].strip()
        for key in ["a", "b", "c", "d", "e"]
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
        int(row.get("difficulty", 0)) if row.get("difficulty", "").isdigit() else None
    )
    return {
        "prompt": text,
        "explanation": explanation,
        "choices": choices,
        "correct_answer": correct_answer,
        "tags": tags,
        "difficulty": difficulty,
    }  # utils/file_import.py


try:
    import PyPDF2
    import pdfplumber

    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

try:
    from docx import Document

    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False


def get_file_type(filename: str) -> str:
    """Get file type from filename extension"""
    if filename.lower().endswith(".csv"):
        return "csv"
    elif filename.lower().endswith(".pdf"):
        return "pdf"
    elif filename.lower().endswith(".docx"):
        return "docx"
    else:
        return "unknown"


def parse_file(uploaded_file) -> List[Dict[str, Any]]:
    """
    Parse uploaded file based on its type and return list of question dictionaries
    """
    filename = uploaded_file.name
    file_type = get_file_type(filename)

    if file_type == "csv":
        return parse_csv_file(uploaded_file)
    elif file_type == "pdf":
        return parse_pdf_file(uploaded_file)
    elif file_type == "docx":
        return parse_docx_file(uploaded_file)
    else:
        raise ValueError(f"Unsupported file type: {filename}")


def parse_csv_file(uploaded_file) -> List[Dict[str, Any]]:
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
            raise ValueError(f"Error parsing CSV row {i}: {str(e)}")

    return questions


def parse_pdf_file(uploaded_file) -> List[Dict[str, Any]]:
    """
    Parse PDF file to extract multiple choice questions
    """
    if not PDF_AVAILABLE:
        raise ValueError(
            "PDF parsing libraries are not installed. Please install PyPDF2 and pdfplumber."
        )

    # Reset file pointer to beginning
    uploaded_file.file.seek(0)

    # Check if it's actually a PDF by reading the first few bytes
    first_bytes = uploaded_file.file.read(10)
    uploaded_file.file.seek(0)  # Reset again

    if not first_bytes.startswith(b"%PDF"):
        raise ValueError(
            "File does not appear to be a valid PDF. PDF files should start with '%PDF'."
        )

    full_text = ""

    try:
        # Try with pdfplumber first (better text extraction)
        with pdfplumber.open(uploaded_file.file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
    except Exception as pdf_error:
        # Fallback to PyPDF2
        try:
            uploaded_file.file.seek(0)  # Reset file pointer
            pdf_reader = PyPDF2.PdfReader(uploaded_file.file)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n"
        except Exception as fallback_error:
            raise ValueError(
                f"Could not extract text from PDF. Primary error: {str(pdf_error)}. Fallback error: {str(fallback_error)}"
            )

    if not full_text.strip():
        raise ValueError(
            "Could not extract any text from PDF file. The PDF might be image-based or corrupted."
        )

    return parse_text_content(full_text, "pdf")


def parse_docx_file(uploaded_file) -> List[Dict[str, Any]]:
    """
    Parse DOCX file to extract multiple choice questions
    """
    if not DOCX_AVAILABLE:
        raise ValueError(
            "DOCX parsing library is not installed. Please install python-docx."
        )

    # Reset file pointer to beginning
    uploaded_file.file.seek(0)

    try:
        doc = Document(uploaded_file.file)
        full_text = ""
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():  # Only add non-empty paragraphs
                full_text += paragraph.text + "\n"
    except Exception as e:
        raise ValueError(
            f"Error reading DOCX file: {str(e)}. Please ensure the file is a valid Word document."
        )

    if not full_text.strip():
        raise ValueError(
            "Could not extract any text from DOCX file. The document might be empty or corrupted."
        )

    return parse_text_content(full_text, "docx")


def parse_text_content(text: str, source_type: str) -> List[Dict[str, Any]]:
    """
    Parse text content to extract multiple choice questions
    Supports various question formats commonly found in academic documents
    """
    questions = []

    # Normalize text but preserve line structure for question parsing
    text = re.sub(r"\r\n", "\n", text)  # Convert Windows line endings
    text = re.sub(r"\r", "\n", text)  # Convert Mac line endings
    text = re.sub(
        r"\n\s*\n\s*\n+", "\n\n", text
    )  # Normalize multiple blank lines to double
    text = text.strip()

    # Try to split into question blocks using various patterns
    question_blocks = []

    # Pattern 1: Look for numbered questions (1., 2., Q1, Question 1, etc.)
    numbered_pattern = r"\n(?=(?:Question\s*\d+|Q\s*\d+|\d+[\.\)])\s*[^\d])"
    blocks = re.split(numbered_pattern, text, flags=re.IGNORECASE)

    if len(blocks) > 1:
        question_blocks = [block.strip() for block in blocks if block.strip()]
    else:
        # Pattern 2: Split by double newlines (paragraph breaks)
        potential_blocks = text.split("\n\n")
        # Only use this if we get reasonable sized blocks
        if len(potential_blocks) > 1 and all(
            len(block.strip()) > 20 for block in potential_blocks if block.strip()
        ):
            question_blocks = [
                block.strip() for block in potential_blocks if block.strip()
            ]
        else:
            # Pattern 3: Look for multiple consecutive choice patterns
            # Find positions where we have A. B. C. D. pattern
            choice_group_pattern = (
                r"\n\s*[A-E][\.\)]\s*[^\n]+(?:\n\s*[A-E][\.\)]\s*[^\n]+)+"
            )

            choice_groups = list(re.finditer(choice_group_pattern, text, re.IGNORECASE))
            if len(choice_groups) > 1:
                # Split text based on choice group positions
                prev_end = 0
                for match in choice_groups:
                    # Include some text before the choices as the question
                    start = max(prev_end, match.start() - 200)
                    block = text[start : match.end()].strip()
                    if block:
                        question_blocks.append(block)
                    prev_end = match.end()
            else:
                question_blocks = [text]  # Treat entire text as one question

    if not question_blocks:
        question_blocks = [text]  # Treat entire text as one question

    for i, block in enumerate(question_blocks):
        if not block.strip():
            continue

        try:
            question = extract_question_from_block(block.strip(), i + 1)
            if question and question.get("prompt") and question.get("choices"):
                questions.append(question)
        except Exception as e:
            # Log the error but continue processing other questions
            print(
                f"Warning: Error parsing question block {i + 1} from {source_type}: {str(e)}"
            )
            continue

    # If no structured questions found, try to extract from the whole text
    if not questions and text.strip():
        # Look for any multiple choice pattern in the entire text
        choice_pattern = r"([A-E])[\.\)]\s*([^\n\r]+)"
        choices_matches = re.findall(choice_pattern, text, re.IGNORECASE)

        if len(choices_matches) >= 2:  # At least 2 choices found
            # Extract question prompt (text before first choice)
            first_choice_match = re.search(r"[A-E][\.\)]\s*", text, re.IGNORECASE)
            if first_choice_match:
                prompt = text[: first_choice_match.start()].strip()
                # Clean up prompt
                prompt = re.sub(
                    r"^(?:Question\s*\d*[:\.]?\s*|Q\s*\d*[:\.]?\s*|\d+[\.\)]\s*)",
                    "",
                    prompt,
                    flags=re.IGNORECASE,
                )

                if prompt:
                    choices = {}
                    for letter, choice_text in choices_matches:
                        choices[letter.upper()] = choice_text.strip()

                    # Look for correct answer
                    correct_answer = []
                    correct_patterns = [
                        r"(?:correct|answer|key)[\s:]*([A-E])",
                        r"([A-E])\s*(?:is\s*)?(?:correct|right)",
                        r"answer[\s:]*([A-E])",
                    ]

                    for pattern in correct_patterns:
                        match = re.search(pattern, text, re.IGNORECASE)
                        if match:
                            correct_answer = [match.group(1).upper()]
                            break

                    if not correct_answer and choices:
                        correct_answer = [
                            list(choices.keys())[0]
                        ]  # Default to first choice

                    questions.append(
                        {
                            "prompt": prompt,
                            "explanation": "",
                            "choices": choices,
                            "correct_answer": correct_answer,
                            "difficulty": 1,
                            "tags": [f"imported-from-{source_type}"],
                        }
                    )

        # If still no questions, create a template
        if not questions:
            questions.append(
                {
                    "prompt": f"Question extracted from {source_type} (please review and edit): "
                    + text[:200]
                    + ("..." if len(text) > 200 else ""),
                    "explanation": "",
                    "choices": {
                        "A": "Option A (please edit)",
                        "B": "Option B (please edit)",
                        "C": "Option C (please edit)",
                        "D": "Option D (please edit)",
                    },
                    "correct_answer": ["A"],
                    "difficulty": 1,
                    "tags": [f"imported-from-{source_type}", "needs-editing"],
                }
            )

    return questions


def extract_question_from_block(block: str, question_num: int) -> Dict[str, Any] | None:
    """
    Extract a single question from a text block
    """
    # Clean up the block
    block = block.strip()
    if not block:
        return None

    # Initialize question data
    question_data = {
        "prompt": "",
        "explanation": "",
        "choices": {},
        "correct_answer": [],
        "difficulty": 1,
        "tags": ["imported"],
    }

    # Look for multiple choice patterns with flexible formatting
    choice_patterns = [
        r"([A-E])[\.\)]\s*([^\n\r]+)",  # A. answer or A) answer
        r"([A-E])\s*[:\-]\s*([^\n\r]+)",  # A: answer or A - answer
        r"\b([A-E])\s+([^\n\r]{10,})",  # A followed by substantial text
    ]

    choices_matches = []
    for pattern in choice_patterns:
        matches = re.findall(pattern, block, re.IGNORECASE)
        if len(matches) >= 2:  # Need at least 2 choices
            choices_matches = matches
            break

    if choices_matches:
        # Extract choices
        for letter, choice_text in choices_matches:
            # Clean up choice text
            choice_text = choice_text.strip()
            # Remove trailing punctuation and clean up
            choice_text = re.sub(r"^[\.\-\:]+\s*", "", choice_text)
            choice_text = re.sub(r"\s*[\.\,]*$", "", choice_text)

            if choice_text:  # Only add non-empty choices
                question_data["choices"][letter.upper()] = choice_text

        # Extract question prompt (text before the first choice)
        if choices_matches:
            first_choice_letter = choices_matches[0][0]
            # Find the position of the first choice in the block
            first_choice_pattern = rf"{re.escape(first_choice_letter)}[\.\):\-]\s*"
            first_choice_match = re.search(first_choice_pattern, block, re.IGNORECASE)

            if first_choice_match:
                prompt = block[: first_choice_match.start()].strip()
            else:
                # Fallback: take first line or first sentence
                lines = block.split("\n")
                prompt = lines[0].strip() if lines else ""
        else:
            prompt = f"Question {question_num} (extracted from document)"

        # Clean up prompt
        prompt = re.sub(
            r"^(?:Question\s*\d*[:\.]?\s*|Q\s*\d*[:\.]?\s*|\d+[\.\)]\s*)",
            "",
            prompt,
            flags=re.IGNORECASE,
        )
        prompt = prompt.strip()

        if not prompt:
            prompt = f"Question {question_num}"

        question_data["prompt"] = prompt

        # Look for correct answer indicators with various patterns
        correct_patterns = [
            r"(?:correct\s*(?:answer)?|answer|key)[\s:]*([A-E])",
            r"([A-E])\s*(?:is\s*)?(?:correct|right|answer)",
            r"answer[\s:]*([A-E])",
            r"correct[\s:]*([A-E])",
            r"key[\s:]*([A-E])",
            r"\b([A-E])\s*\*",  # A* for correct answer
            r"\*\s*([A-E])",  # *A for correct answer
        ]

        # Search in the entire block for correct answer patterns
        for pattern in correct_patterns:
            matches = re.findall(pattern, block, re.IGNORECASE)
            if matches:
                # Take the last match (often the most relevant)
                correct_letter = matches[-1].upper()
                if correct_letter in question_data["choices"]:
                    question_data["correct_answer"] = [correct_letter]
                    break

        # If no correct answer found, default to first choice
        if not question_data["correct_answer"] and question_data["choices"]:
            question_data["correct_answer"] = [list(question_data["choices"].keys())[0]]

    else:
        # No clear multiple choice format found
        # Try to create a question from the text
        lines = [line.strip() for line in block.split("\n") if line.strip()]

        if lines:
            # Use first substantial line as prompt
            prompt = lines[0]
            # Clean up common question numbering
            prompt = re.sub(
                r"^(?:Question\s*\d*[:\.]?\s*|Q\s*\d*[:\.]?\s*|\d+[\.\)]\s*)",
                "",
                prompt,
                flags=re.IGNORECASE,
            )
            prompt = prompt.strip()

            if not prompt:
                prompt = f"Question {question_num} (extracted from document)"

            question_data["prompt"] = prompt

            # Create placeholder choices from remaining text or defaults
            remaining_text = " ".join(lines[1:]) if len(lines) > 1 else ""

            if len(remaining_text) > 50:
                # Try to split remaining text into choices
                parts = re.split(r"[;,]|\sand\s|\sor\s", remaining_text)
                parts = [p.strip() for p in parts if p.strip()]

                if len(parts) >= 2:
                    letters = ["A", "B", "C", "D", "E"]
                    for i, part in enumerate(parts[:5]):  # Max 5 choices
                        if part:
                            question_data["choices"][letters[i]] = part

            # If still no choices, create defaults
            if not question_data["choices"]:
                question_data["choices"] = {
                    "A": "Option A (please edit)",
                    "B": "Option B (please edit)",
                    "C": "Option C (please edit)",
                    "D": "Option D (please edit)",
                }

            question_data["correct_answer"] = [list(question_data["choices"].keys())[0]]
        else:
            return None  # No usable content

    # Ensure we have at least a prompt and some choices
    if not question_data["prompt"] or not question_data["choices"]:
        return None

    # Ensure we have at least 2 choices
    if len(question_data["choices"]) < 2:
        return None

    return question_data


def validate_question_data(question_data: Dict[str, Any]) -> bool:
    """
    Validate that question data has required fields
    """
    required_fields = ["prompt", "choices", "correct_answer"]

    for field in required_fields:
        if field not in question_data or not question_data[field]:
            return False

    # Check that choices is a dict with at least 2 options
    if (
        not isinstance(question_data["choices"], dict)
        or len(question_data["choices"]) < 2
    ):
        return False

    # Check that correct_answer contains valid choice letters
    valid_choices = set(question_data["choices"].keys())
    correct_answers = question_data.get("correct_answer", [])
    if not all(answer in valid_choices for answer in correct_answers):
        return False

    return True
