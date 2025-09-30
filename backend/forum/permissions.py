from rest_framework.permissions import BasePermission, SAFE_METHODS

# ------------------------
# Admin Only
# ------------------------
class IsAdminUser(BasePermission):
    """
    อนุญาตเฉพาะผู้ใช้ที่ role == 'admin'
    """
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user and
            getattr(user, "is_authenticated", False) and
            (
                getattr(user, "role", None) == "admin"
                or getattr(user, "is_staff", False)
                or getattr(user, "is_superuser", False)
            )
        )

# ------------------------
# Owner or Admin
# ------------------------
class IsOwnerOrAdmin(BasePermission):
    """
    อนุญาตเข้าถึงถ้าเป็นเจ้าของ object หรือ admin
    """
    def has_object_permission(self, request, view, obj):
        # Allow everyone to perform safe (read-only) requests
        if request.method in SAFE_METHODS:
            return True
        # Admin ได้สิทธิ์เต็ม
        user = request.user
        if (
            getattr(user, "role", None) == "admin"
            or getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        ):
            return True

        # ถ้า object มี field user (เช่น Post, Comment)
        if hasattr(obj, "user"):
            return obj.user == request.user

        # ถ้า object เป็น User เอง (profile)
        if obj == request.user:
            return True

        return False

# ------------------------
# Authenticated or Read-Only
# ------------------------
class IsAuthenticatedOrReadOnly(BasePermission):
    """
    อนุญาตให้ทุกคนอ่านได้ แต่เขียน/แก้ไข/ลบ ต้องล็อกอิน
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)
