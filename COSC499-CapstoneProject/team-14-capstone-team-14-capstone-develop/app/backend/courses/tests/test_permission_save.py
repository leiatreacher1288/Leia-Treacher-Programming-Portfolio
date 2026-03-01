from django.contrib.auth import get_user_model

# courses/tests/test_permission_save.py
# ---------------------------------------------------------------------------
# Permissions‑defaults (“Save Permissions”) test‑suite
# ---------------------------------------------------------------------------
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Course, CourseInstructor

User = get_user_model()


class PermissionSaveAPITests(APITestCase):
    def setUp(self):
        # ----------------------- users ------------------------------------
        self.main = User.objects.create_user(
            email="main@mail.com", name="Main", password="pw"
        )
        self.sec_full = User.objects.create_user(
            email="sec@mail.com", name="Sec", password="pw"
        )
        self.sec_limited = User.objects.create_user(
            email="seclim@mail.com", name="SecLim", password="pw"
        )
        self.ta_limited = User.objects.create_user(
            email="ta@mail.com", name="TA", password="pw"
        )
        self.outsider = User.objects.create_user(
            email="out@mail.com", name="Out", password="pw"
        )

        # ----------------------- course + roles ---------------------------
        self.course = Course.objects.create(code="CS101", name="x", term="W25")

        CourseInstructor.objects.bulk_create(
            [
                CourseInstructor(
                    course=self.course,
                    user=self.main,
                    role=CourseInstructor.Role.MAIN,
                    access=CourseInstructor.Access.FULL,
                    accepted=True,
                ),
                CourseInstructor(
                    course=self.course,
                    user=self.sec_full,
                    role=CourseInstructor.Role.SEC,
                    access=CourseInstructor.Access.FULL,
                    accepted=True,
                ),
                CourseInstructor(
                    course=self.course,
                    user=self.sec_limited,
                    role=CourseInstructor.Role.SEC,
                    access=CourseInstructor.Access.LIMITED,
                    accepted=True,
                ),
                CourseInstructor(
                    course=self.course,
                    user=self.ta_limited,
                    role=CourseInstructor.Role.TA,
                    access=CourseInstructor.Access.LIMITED,
                    accepted=True,
                ),
            ]
        )

        self.token_url = reverse("token_obtain_pair")

    # ------------------------------------------------------------------ #
    # helpers
    # ------------------------------------------------------------------ #
    def _auth(self, user):
        resp = self.client.post(
            self.token_url, {"email": user.email, "password": "pw"}, format="json"
        )
        token = resp.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def _url(self, role):
        """
        PUT /api/courses/<pk>/default_access/<role>/
        """
        return reverse(
            "course-default-access", kwargs={"pk": self.course.pk, "role": role}
        )

    # ------------------------------------------------------------------ #
    # positive cases
    # ------------------------------------------------------------------ #
    def test_main_can_update_default_ta_access(self):
        self._auth(self.main)
        resp = self.client.put(self._url("TA"), {"access": "NONE"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.default_ta_access, "NONE")

    def test_full_secondary_can_update_own_role_default(self):
        self._auth(self.sec_full)
        resp = self.client.put(self._url("SEC"), {"access": "LIMITED"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.course.refresh_from_db()
        self.assertEqual(self.course.default_sec_access, "LIMITED")

    # ------------------------------------------------------------------ #
    # negative / edge cases
    # ------------------------------------------------------------------ #
    def test_limited_secondary_cannot_update(self):
        self._auth(self.sec_limited)
        resp = self.client.put(self._url("TA"), {"access": "FULL"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_limited_ta_cannot_update(self):
        self._auth(self.ta_limited)
        resp = self.client.put(self._url("OTH"), {"access": "FULL"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_change_main_default(self):
        self._auth(self.main)
        resp = self.client.put(self._url("MAIN"), {"access": "LIMITED"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_invalid_access_value(self):
        self._auth(self.main)
        resp = self.client.put(self._url("TA"), {"access": "SUPER"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------ #
    # functional: default is USED when inviting a new instructor
    # ------------------------------------------------------------------ #
    def test_invite_respects_stored_default(self):
        # 1) change TA default → NONE
        self._auth(self.main)
        self.client.put(self._url("TA"), {"access": "NONE"}, format="json")

        # 2) invite a brand‑new TA
        new_ta = User.objects.create_user(
            email="brandta@mail.com", name="BrandTA", password="pw"
        )
        invite_url = reverse("course-add-instructor", args=[self.course.pk])
        self.client.post(
            invite_url, {"email": new_ta.email, "role": "TA"}, format="json"
        )

        link = CourseInstructor.objects.get(course=self.course, user=new_ta)
        self.assertEqual(link.access, CourseInstructor.Access.NONE)
