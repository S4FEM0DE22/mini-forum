from rest_framework import viewsets, generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, Post, Comment, Category, Report, Tag
from .serializers import (
    UserSerializer,
    PostSerializer,
    CommentSerializer,
    CommentCreateSerializer,
    CategorySerializer,
    ReportSerializer,
    TagSerializer,
)
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from .permissions import IsOwnerOrAdmin, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import CustomTokenObtainPairSerializer
from rest_framework.decorators import action
from django.db.models import Count
from rest_framework.permissions import IsAuthenticated as DRFIsAuthenticated
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.conf import settings


# -------------------------------
# User ViewSets
# -------------------------------
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsOwnerOrAdmin]

    def partial_update(self, request, *args, **kwargs):
        # Only admin users can change is_staff or role
        user = request.user
        is_admin = (
            getattr(user, "role", None) == "admin"
            or getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        )
        # If the payload tries to change is_staff or role and user is not admin, forbid
        data = request.data
        if ("is_staff" in data or "role" in data) and not is_admin:
            return Response({"detail": "ต้องเป็น Admin เท่านั้นที่จะเปลี่ยน role/is_staff"}, status=403)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        # Only admins can delete users
        user = request.user
        is_admin = (
            getattr(user, "role", None) == "admin"
            or getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        )
        if not is_admin:
            return Response({"detail": "ต้องเป็น Admin เท่านั้นที่จะลบผู้ใช้"}, status=403)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


# สำหรับดึงข้อมูลตัวเอง
class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)


# -------------------------------
# Post ViewSet
# -------------------------------
class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    # allow anyone to read; creating requires auth; editing/deleting allowed for owner or admin
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]
    # Accept JSON and multipart/form-data (for file uploads)
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    @action(detail=False, methods=['get'], url_path='popular')
    def popular(self, request):
        # Example: order by like count
        popular_posts = Post.objects.annotate(like_count=Count('likes')).order_by('-like_count')[:5]
        serializer = self.get_serializer(popular_posts, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        # Attach the requesting user as the post author
        serializer.save(user=self.request.user)

    def get_queryset(self):
        """Allow filtering posts by query params: ?tag=<id|name> and ?category=<id|name>

        Examples:
        - /api/posts/?tag=5 (filter by tag id)
        - /api/posts/?tag=python (filter by tag name, case-insensitive)
        - /api/posts/?category=3 (filter by category id)
        - /api/posts/?category=General (filter by category name)
        """
        qs = Post.objects.all().order_by('-created_at')
        req = getattr(self, 'request', None)
        if not req:
            return qs

        # Support multiple filters:
        # - repeated params: /api/posts/?tag=1&tag=2
        # - csv params: /api/posts/?tags=1,2
        # Tag filter takes precedence over category filter.
        tags = req.query_params.getlist('tag') or []
        categories = req.query_params.getlist('category') or []

        # also accept legacy csv params 'tags' / 'categories'
        tags_csv = req.query_params.get('tags')
        cats_csv = req.query_params.get('categories')
        if tags_csv and not tags:
            tags = [t.strip() for t in str(tags_csv).split(',') if t.strip()]
        if cats_csv and not categories:
            categories = [c.strip() for c in str(cats_csv).split(',') if c.strip()]

        try:
            # Build tag Q
            from django.db.models import Q
            tag_q = Q()
            if tags:
                id_vals = [int(t) for t in tags if str(t).isdigit()]
                name_vals = [t for t in tags if not str(t).isdigit()]
                if id_vals:
                    tag_q |= Q(tags__id__in=id_vals)
                for n in name_vals:
                    tag_q |= Q(tags__name__iexact=n)

            # Build category Q
            cat_q = Q()
            if categories:
                id_vals = [int(c) for c in categories if str(c).isdigit()]
                name_vals = [c for c in categories if not str(c).isdigit()]
                if id_vals:
                    cat_q |= Q(category_id__in=id_vals)
                for n in name_vals:
                    cat_q |= Q(category__name__iexact=n)

            # Combine: if both tag and category filters present, return posts that match ANY (OR)
            combined_q = Q()
            if tags:
                combined_q |= tag_q
            if categories:
                combined_q |= cat_q

            if combined_q:
                qs = qs.filter(combined_q)
                return qs.distinct()
        except Exception:
            # In case of bad param values, just return unfiltered qs
            return qs

        # Support a generic search param to match title partially (case-insensitive)
        try:
            q = req.query_params.get('search') or req.query_params.get('q')
            if q:
                # simple partial match on title
                qs = qs.filter(title__icontains=str(q))
                return qs.distinct()
        except Exception:
            pass

        # If filtering by many-to-many (tags), avoid duplicates
        return qs.distinct()

    @action(detail=True, methods=['post'], url_path='like-toggle', permission_classes=[permissions.IsAuthenticated])
    def like_toggle(self, request, pk=None):
        post = self.get_object()
        user = request.user
        if user in post.likes.all():
            post.likes.remove(user)
            liked = False
        else:
            post.likes.add(user)
            liked = True
        return Response({
            'liked': liked,
            'total_likes': post.total_likes()
        })


class PostLikeToggleAPIView(APIView):
    permission_classes = [DRFIsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        user = request.user
        if user in post.likes.all():
            post.likes.remove(user)
            liked = False
        else:
            post.likes.add(user)
            liked = True
        return Response({'liked': liked, 'total_likes': post.total_likes()})


# -------------------------------
# Comment ViewSet
# -------------------------------
class CommentViewSet(viewsets.ModelViewSet):
    # Base queryset; we'll further filter based on query params (e.g. ?post=123)
    queryset = Comment.objects.all().order_by('-created_at')
    # Default serializer (used for GET). For POST we prefer the create serializer which accepts multipart/form-data
    serializer_class = CommentSerializer
    # allow read to everyone; creating requires auth; editing/deleting allowed for owner or admin
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin]
    # Accept JSON and multipart for comment edits/creates
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        """Filter comments by query parameters.

        Frontend calls `/comments/?post=<id>` or `/comments/?user=<id>`.
        Ensure we return only the comments that match those filters so comments are scoped per-post.
        """
        qs = Comment.objects.all().order_by('-created_at')
        req = getattr(self, 'request', None)
        if req:
            post_id = req.query_params.get('post')
            user_id = req.query_params.get('user')
            if post_id:
                qs = qs.filter(post_id=post_id)
            if user_id:
                qs = qs.filter(user_id=user_id)
        return qs

    def get_serializer_class(self):
        # Use create serializer for POST requests to accept file uploads correctly
        req = getattr(self, 'request', None)
        if req and req.method and req.method.upper() == 'POST':
            return CommentCreateSerializer
        return CommentSerializer

    @action(detail=True, methods=['post'], url_path='like-toggle', permission_classes=[permissions.IsAuthenticated])
    def like_toggle(self, request, pk=None):
        comment = self.get_object()
        user = request.user
        if user in comment.likes.all():
            comment.likes.remove(user)
            liked = False
        else:
            comment.likes.add(user)
            liked = True
        return Response({
            'liked': liked,
            'total_likes': comment.total_likes()
        })


# สำหรับสร้างและดึง comment ของ post หนึ่ง
class CommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    # Accept both JSON payloads and multipart/form-data (image uploads)
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        # Use the create serializer for POST, and the full serializer for GET
        if self.request and self.request.method and self.request.method.upper() == 'POST':
            return CommentCreateSerializer
        return CommentSerializer

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        return Comment.objects.filter(post_id=post_id).order_by('-created_at')

    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        serializer.save(user=self.request.user, post_id=post_id)


# -------------------------------
# Category ViewSet
# -------------------------------
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


# -------------------------------
# Tag ViewSet
# -------------------------------
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'], url_path='popular')
    def popular(self, request):
        # Count posts per tag then order
        popular_tags = Tag.objects.annotate(num_posts=Count('posts')).order_by('-num_posts')[:5]
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)


# -------------------------------
# Report ViewSet
# -------------------------------
class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [IsOwnerOrAdmin]

    def destroy(self, request, *args, **kwargs):
        # Allow deletion only by the report owner or admin-like users
        report = self.get_object()
        user = request.user
        is_admin = (
            getattr(user, "role", None) == "admin"
            or getattr(user, "is_staff", False)
            or getattr(user, "is_superuser", False)
        )
        if report.user == user or is_admin:
            return super().destroy(request, *args, **kwargs)
        return Response({"detail": "ต้องเป็นเจ้าของรายงานหรือแอดมินเท่านั้นที่จะลบ"}, status=403)


class CustomTokenObtainPairView(TokenObtainPairView):
    # Use the application-level serializer which handles email-or-username
    # resolution and returns helpful validation messages.
    serializer_class = CustomTokenObtainPairSerializer


# -------------------------------
# Password reset views (development: send console email)
# -------------------------------
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data['identifier']

        # allow lookup by username or by email (case-insensitive)
        user = None
        ident = identifier.strip() if isinstance(identifier, str) else identifier
        try:
            if '@' in ident:
                # lookup by email (case-insensitive). If multiple users share an email, pick the first.
                user = User.objects.filter(email__iexact=ident).first()
            else:
                # lookup by username (case-insensitive)
                user = User.objects.filter(username__iexact=ident).first()
        except Exception:
            user = None

        # Do not reveal whether account exists
        if not user:
            return Response({'detail': 'If an account exists, a password reset email has been sent.'})

        token = PasswordResetTokenGenerator().make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        email = user.email
        # Link should point to the confirm route so opening it presents the new-password form
        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:5173')
        # Ensure no trailing slash
        if frontend_base.endswith('/'):
            frontend_base = frontend_base[:-1]
        reset_link = f"{frontend_base}/reset-password/confirm?uid={uid}&token={token}"

        # Send email (console backend will print in dev)
        subject = 'Password reset for Mini Forum'
        message = f'Use the following link to reset your password:\n{reset_link}\nIf you did not request this, ignore.'
        send_mail(subject, message, 'no-reply@localhost', [email], fail_silently=True)

        # In DEBUG, include the reset link in the API response to ease local development/testing.
        include_link = getattr(settings, 'DEBUG', False) or getattr(settings, 'INCLUDE_RESET_LINK_IN_RESPONSE', False)
        if include_link:
            return Response({'detail': 'If an account exists, a password reset email has been sent.', 'reset_link': reset_link})

        return Response({'detail': 'If an account exists, a password reset email has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user_obj']
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password has been reset successfully.'})
