# courses/permissions.py
from rest_framework import permissions

from .models import CourseInstructor


class IsInstructorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow instructors of a course to edit it.
    Works with the new CourseInstructor through model.
    """

    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to authenticated users
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated

        # Write permissions check CourseInstructor with accepted=True
        return CourseInstructor.objects.filter(
            course=obj, user=request.user, accepted=True
        ).exists()
