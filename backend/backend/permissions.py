from rest_framework import permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminUser(permissions.BasePermission):
    """Allow access only to admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow access to owner of object or admin."""
    def has_object_permission(self, request, view, obj):
        # admin ใช้ได้ทุกอย่าง
        if request.user.role == "admin":
            return True
        # เจ้าของ profile ใช้ได้
        return obj == request.user

class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """Allow read-only access to unauthenticated users."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)
