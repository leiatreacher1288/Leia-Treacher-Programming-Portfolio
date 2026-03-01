from django.core.management.base import BaseCommand

from questions.models import Question


class Command(BaseCommand):
    help = "Sanity check for questions: missing prompt/text or correct_answer."

    def handle(self, *args, **options):
        issues = 0
        for q in Question.objects.all():
            if not q.prompt or not q.prompt.strip():
                self.stdout.write(
                    self.style.ERROR(f"Question {q.id} missing prompt/text.")
                )
                issues += 1
            if (
                not q.correct_answer
                or not isinstance(q.correct_answer, list)
                or not q.correct_answer
            ):
                self.stdout.write(
                    self.style.WARNING(
                        f"Question {q.id} missing or empty correct_answer."
                    )
                )
                issues += 1
        if issues == 0:
            self.stdout.write(self.style.SUCCESS("All questions are valid."))
        else:
            self.stdout.write(self.style.WARNING(f"Found {issues} issues."))
