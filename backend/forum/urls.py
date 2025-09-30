from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomTokenObtainPairView,
    UserMeView,
    CommentListCreateView,
    PostViewSet,
    CommentViewSet,
    UserViewSet,
    CategoryViewSet,
    TagViewSet,
    ReportViewSet,
    PostLikeToggleAPIView,
)

from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from .views import PasswordResetRequestView, PasswordResetConfirmView

# --- Router ---
router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"posts", PostViewSet, basename='post')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r"categories", CategoryViewSet)
router.register(r"reports", ReportViewSet, basename='report')

# --- URL patterns ---
urlpatterns = [
    path("api/", include(router.urls)),  # เพิ่ม prefix api/
    path("api/users/me/", UserMeView.as_view(), name="user-me"),
    path("api/posts/<int:post_id>/comments/", CommentListCreateView.as_view(), name="comment-list-create"),
    path("api/posts/<int:pk>/like-toggle/", PostLikeToggleAPIView.as_view(), name="post-like-toggle"),
    path("api/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("api/auth/password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
]

# --- Media files ---
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
