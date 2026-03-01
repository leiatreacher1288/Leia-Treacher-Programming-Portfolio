import re

from django.db import connection
from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Question, QuestionBank
from .serializers import QuestionBankSerializer, QuestionSerializer
from .utils.file_import import (
    parse_csv_file,
    parse_docx_file,
    parse_pdf_file,
    parse_txt_file,
)


class QuestionCSVUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        upload_file = request.FILES.get("file")
        question_bank_id = request.POST.get("question_bank_id")
        exam_id = request.POST.get("exam_id")

        if not upload_file or not question_bank_id:
            return Response(
                {"error": "file and question_bank_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question_bank = QuestionBank.objects.get(id=question_bank_id)
        except QuestionBank.DoesNotExist:
            return Response(
                {"error": "Invalid question bank ID or unauthorized."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get exam if exam_id is provided
        exam = None
        if exam_id:
            try:
                from exams.models import Exam

                exam = Exam.objects.get(id=exam_id)
            except Exam.DoesNotExist:
                return Response(
                    {"error": "Invalid exam ID."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Detect file type
        filename = upload_file.name.lower()
        if filename.endswith(".csv"):
            parser = parse_csv_file
        elif filename.endswith(".txt"):
            parser = parse_txt_file
        elif filename.endswith(".docx"):
            parser = parse_docx_file
        elif filename.endswith(".pdf"):
            parser = parse_pdf_file
        else:
            return Response(
                {"error": "Unsupported file type."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            parsed_questions = parser(upload_file)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        saved = 0
        errors = []
        saved_question_ids = []

        for i, data in enumerate(parsed_questions, start=1):
            data["bank"] = question_bank.id
            data["created_by"] = request.user.id

            # ----- NORMALISE correct_answer (already present) -----
            raw_correct = data.get("correct_answer")
            if isinstance(raw_correct, str):
                data["correct_answer"] = [
                    part.strip().upper()
                    for part in re.split(r"[;,]", raw_correct)
                    if part.strip()
                ]
            # ------------------------------------------------------

            # ----- NEW: CONVERT choices LIST → dict ---------------
            if isinstance(data.get("choices"), list):
                data["choices"] = {
                    chr(65 + i): str(text)
                    for i, text in enumerate(data["choices"])  # A, B, C, …
                    if str(text).strip()  # drop empties
                }
            # ------------------------------------------------------

            serializer = QuestionSerializer(data=data)
            if serializer.is_valid():
                question = serializer.save()
                saved_question_ids.append(question.id)
                saved += 1
            else:
                errors.append({"row": i, "errors": serializer.errors})

        # Add questions to exam if exam_id was provided
        if exam and saved_question_ids:
            exam.questions.add(*saved_question_ids)

        return Response(
            {
                "saved": saved,
                "failed": len(errors),
                "errors": errors,
                "saved_question_ids": saved_question_ids,
            },
            status=status.HTTP_200_OK,
        )


class QuestionsHealthCheckView(APIView):
    authentication_classes = []  # public endpoint
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_status = "connected"
        except Exception:
            db_status = "unreachable"

        return Response({"status": "ok", "service": "questions", "database": db_status})


class PingView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "message": (
                    "Questions service is reachable. "
                    "Placeholder for page to be developed"
                )
            }
        )


class AllQuestionsView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = QuestionSerializer

    def get(self, request):
        """Get all questions with optional filtering"""
        # Get questions from question banks that belong to courses owned by the user
        questions = Question.objects.filter(
            bank__course__instructors=request.user
        ).select_related("bank", "bank__course", "created_by")

        # Apply filters
        search = request.query_params.get("search")
        if search:
            questions = questions.filter(
                Q(prompt__icontains=search)
                | Q(tags__contains=[search])
                | Q(id__icontains=search)
            )

        difficulty = request.query_params.get("difficulty")
        if difficulty:
            questions = questions.filter(difficulty=difficulty)

        course = request.query_params.get("course")
        if course:
            questions = questions.filter(bank__course_id=course)

        tags = request.query_params.get("tags")
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
            for tag in tag_list:
                questions = questions.filter(tags__contains=[tag])

        serializer = self.serializer_class(questions, many=True)
        return Response(serializer.data)


class QuestionBankView(APIView):  # APIView is more suitable for RESTful APIs
    permission_classes = [
        IsAuthenticated
    ]  # Ensure only authenticated users can access this view
    serializer_class = QuestionBankSerializer

    # gets the question bank that matches the pk
    def get(self, request, pk):
        data = QuestionBank.objects.get(pk=pk)
        serializer = self.serializer_class(data)
        return Response(serializer.data)

    # create a course for the user
    # @api_view(['POST'])
    def post(self, request):
        current_user = self.request.user  # get the currrent logged in user
        print("current user = ", current_user)
        # need to add the user pk to the data
        data = request.data  # the current data from the frontend

        serializer = self.serializer_class(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        data = QuestionBank.objects.get(pk=pk)
        data.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # update a question bank
    def put(self, request, pk):
        data = QuestionBank.objects.get(pk=pk)  # or Question.objects.get
        serializer = QuestionBankSerializer(data, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        data = QuestionBank.objects.get(pk=pk)
        serializer = self.serializer_class(data, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionBankListView(APIView):  # APIView is more suitable for RESTful APIs
    permission_classes = [
        IsAuthenticated
    ]  # Ensure only authenticated users can access this view
    serializer_class = QuestionBankSerializer

    # returns the list of question banks by course and the number of questions
    def get(self, request, course_id):
        data = QuestionBank.objects.filter(course=course_id)
        # data = QuestionBank.objects.annotate(question_count=Count('questions'))
        # .filter(course = course_id)
        serializer = self.serializer_class(
            data, context={"request": request}, many=True
        )
        return Response(serializer.data)


class QuestionView(APIView):  # APIView is more suitable for RESTful APIs
    permission_classes = [
        IsAuthenticated
    ]  # Ensure only authenticated users can access this view
    serializer_class = QuestionSerializer

    # get the question by the id
    def get(self, request, pk):
        data = Question.objects.get(pk=pk)
        serializer = self.serializer_class(data)
        return Response(serializer.data)

    # create a new question
    def post(self, request):
        # need to add the current logged in user's pk to the data
        current_user = self.request.user  # get the currrent logged in user
        # need to add the user pk to the data
        data = request.data  # the current data from the frontend
        data["created_by"] = current_user.pk  # added the user to the data

        serializer = QuestionSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        data = Question.objects.get(pk=pk)
        data.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def put(self, request, pk):
        obj = Question.objects.get(pk=pk)  # Fixed: was QuestionBank instead of Question
        serializer = self.serializer_class(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        data = Question.objects.get(pk=pk)
        serializer = self.serializer_class(data, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class QuestionListView(APIView):  # APIView is more suitable for RESTful APIs
    permission_classes = [
        IsAuthenticated
    ]  # Ensure only authenticated users can access this view
    serializer_class = QuestionSerializer

    # returns the list of questions by question bank
    def get(self, request, questionbank_id):
        data = Question.objects.filter(bank=questionbank_id)
        serializer = self.serializer_class(
            data, context={"request": request}, many=True
        )
        return Response(serializer.data)
