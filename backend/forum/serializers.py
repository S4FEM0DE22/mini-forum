from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Post, Comment, Category, Report, Tag
import json
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth import get_user_model

User = get_user_model()

# ------------------------
# User Serializers
# ------------------------
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    # writable social JSON (handles JSONField or text storage)
    social = serializers.JSONField(required=False)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        val = getattr(instance, 'social', None)
        if val is None:
            data['social'] = {}
        elif isinstance(val, str):
            try:
                data['social'] = json.loads(val)
            except Exception:
                data['social'] = {}
        else:
            data['social'] = val
        # Ensure avatar is always an absolute URL (or frontend default path)
        try:
            avatar_field = getattr(instance, 'avatar', None)
            if avatar_field and getattr(avatar_field, 'url', None):
                # instance avatar stored in media - return full URL using request if available
                request = self.context.get('request')
                avatar_url = avatar_field.url
                if request is not None:
                    # Build absolute URL
                    avatar_abs = request.build_absolute_uri(avatar_url)
                else:
                    # Fallback to MEDIA_URL relative path
                    from django.conf import settings
                    avatar_abs = (settings.MEDIA_URL.rstrip('/') + '/' + avatar_url.lstrip('/')) if avatar_url else None
                data['avatar'] = avatar_abs
            else:
                # No avatar set for user: point to media default avatar path if backend serves it,
                # otherwise frontend will fallback to /default-avatar.png
                from django.conf import settings
                default_path = 'avatars/default-avatar.png'
                request = self.context.get('request')
                if request is not None:
                    data['avatar'] = request.build_absolute_uri(settings.MEDIA_URL + default_path)
                else:
                    data['avatar'] = settings.MEDIA_URL + default_path
        except Exception:
            # On any error, leave whatever the serializer produced (may be None) so frontend fallback applies
            pass
        return data

    class Meta:
        model = User
        fields = ["id", "username", "email", "bio", "avatar", "role", "is_staff", "is_active", "social"]
        # allow is_staff to be writable via API, but guard in the viewset
        read_only_fields = ["id", "role", "is_active"]


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "password", "email"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data.get("email", "")
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


# ------------------------
# Category Serializer
# ------------------------
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]

    def validate_name(self, value):
        # When updating, allow the same name on the same instance
        if hasattr(self, 'instance') and self.instance is not None:
            # If name unchanged (case-insensitive), it's fine
            if str(self.instance.name).lower() == str(value).lower():
                return value
            # Otherwise exclude this instance when checking uniqueness
            if Category.objects.filter(name__iexact=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("หมวดหมู่นี้มีอยู่แล้ว")
            return value

        # Create: ensure name doesn't already exist
        if Category.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("หมวดหมู่นี้มีอยู่แล้ว")
        return value


# ------------------------
# Tag Serializer
# ------------------------
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']


# ------------------------
# Comment Serializers
# ------------------------
class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.IntegerField(source='total_likes', read_only=True)
    liked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "post", "body", "image", "user", "created_at", "likes_count", "liked_by_user"]
        read_only_fields = ["id", "user", "created_at", "likes_count", "liked_by_user"]

    def get_liked_by_user(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            return user in obj.likes.all()
        return False


class CommentCreateSerializer(serializers.ModelSerializer):
    post = serializers.PrimaryKeyRelatedField(queryset=Post.objects.all())

    class Meta:
        model = Comment
        fields = ["post", "body", "image"]

    def validate(self, attrs):
        # Ensure post present and allow comments that contain either text or an image (or both)
        if 'post' not in attrs or attrs.get('post') is None:
            raise serializers.ValidationError({'post': 'post is required'})
        body = attrs.get('body')
        image = attrs.get('image')
        if (not body or str(body).strip() == '') and not image:
            raise serializers.ValidationError('ต้องใส่ข้อความหรือรูปภาพอย่างน้อยอย่างใดอย่างหนึ่ง')
        return attrs

    def create(self, validated_data):
        # Attach requesting user if available
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            validated_data['user'] = user
        return super().create(validated_data)


# ------------------------
# Post Serializer
# ------------------------
class PostSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True
    )
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.IntegerField(source="total_likes", read_only=True)
    liked_by_user = serializers.SerializerMethodField()
    likes = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    tags = TagSerializer(many=True, required=False)

    class Meta:
        model = Post
        fields = [
            "id", "user", "category", "category_id",
            "title", "body", "image", "comments", "created_at",
            "likes", "likes_count", "total_likes",
            "liked_by_user", "tags"
        ]
        read_only_fields = [
            "id", "user", "category", "comments", "created_at",
            "likes_count", "liked_by_user"
        ]

    def get_user(self, obj):
        if obj.user:
            return {
                "id": obj.user.id,
                "username": obj.user.username,
                "avatar": obj.user.avatar.url if obj.user.avatar else None
            }
        return {"id": None, "username": "Anonymous", "avatar": None}

    def get_social(self, obj):
        val = getattr(obj, 'social', None)
        if val is None:
            return {}
        # if it's a string, try to parse JSON
        if isinstance(val, str):
            try:
                import json
                return json.loads(val)
            except Exception:
                return {}
        return val

    def get_liked_by_user(self, obj):
        user = self.context.get("request").user
        if user.is_authenticated:
            return user in obj.likes.all()
        return False

    def validate_tags(self, value):
        # Accept tags provided as JSON string (from multipart/form-data) or as list
        try:
            if isinstance(value, str):
                import json as _json
                value = _json.loads(value)
        except Exception:
            # If parsing failed, let later logic handle invalid content
            pass

        if isinstance(value, (list, tuple)):
            if len(value) > 5:
                raise serializers.ValidationError("โพสต์สามารถมีได้ไม่เกิน 5 Tag")
            return value

        # If we couldn't interpret tags as a list, it's invalid
        raise serializers.ValidationError('แท็กต้องเป็นรายการของชื่อ/วัตถุ')

    def create(self, validated_data):
        # Pull tags out (may be parsed already by DRF) or embedded as JSON string in initial_data
        tags_data = validated_data.pop('tags', None)
        post = super().create(validated_data)

        # Support tags passed as JSON string in multipart requests
        if tags_data is None and isinstance(getattr(self, 'initial_data', None), dict) and 'tags' in self.initial_data:
            raw = self.initial_data.get('tags')
            try:
                import json as _json
                tags_data = _json.loads(raw) if isinstance(raw, str) else raw
            except Exception:
                tags_data = None

        if tags_data:
            # Ensure tag count limit respected
            if isinstance(tags_data, (list, tuple)) and len(tags_data) > 5:
                raise serializers.ValidationError("โพสต์สามารถมีได้ไม่เกิน 5 Tag")
            for tag in tags_data:
                name = tag.get('name') if isinstance(tag, dict) else tag
                if name:
                    tag_obj, _ = Tag.objects.get_or_create(name=name)
                    post.tags.add(tag_obj)

        # Support category provided directly in form-data (e.g., 'category' or 'category_id')
        try:
            cat_input = None
            if isinstance(getattr(self, 'initial_data', None), dict):
                cat_input = self.initial_data.get('category') or self.initial_data.get('category_id')
            if cat_input:
                if str(cat_input).isdigit():
                    post.category = Category.objects.get(pk=int(cat_input))
                else:
                    post.category = Category.objects.filter(name__iexact=str(cat_input)).first()
                post.save()
        except Exception:
            # ignore category assignment errors here
            pass

        return post

    def validate(self, attrs):
        # Require at least one of title/body/image when creating/updating a post
        title = attrs.get('title')
        body = attrs.get('body')
        image = attrs.get('image')
        if (not title or str(title).strip() == '') and (not body or str(body).strip() == '') and not image:
            raise serializers.ValidationError('โพสต์ต้องมีหัวข้อหรือเนื้อหาหรือรูปภาพอย่างน้อยหนึ่งอย่าง')
        return attrs

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        instance = super().update(instance, validated_data)

        # If tags not provided in parsed validated_data, attempt to read from raw initial_data (multipart)
        if tags_data is None and isinstance(getattr(self, 'initial_data', None), dict) and 'tags' in self.initial_data:
            raw = self.initial_data.get('tags')
            try:
                import json as _json
                tags_data = _json.loads(raw) if isinstance(raw, str) else raw
            except Exception:
                tags_data = None

        if tags_data is not None:
            # Enforce maximum tag count
            if isinstance(tags_data, (list, tuple)) and len(tags_data) > 5:
                raise serializers.ValidationError("โพสต์สามารถมีได้ไม่เกิน 5 Tag")
            instance.tags.clear()
            for tag in tags_data:
                name = tag.get('name') if isinstance(tag, dict) else tag
                if name:
                    tag_obj, _ = Tag.objects.get_or_create(name=name)
                    instance.tags.add(tag_obj)

        # Also support updating category via raw initial_data keys
        try:
            if isinstance(getattr(self, 'initial_data', None), dict):
                cat_input = self.initial_data.get('category') or self.initial_data.get('category_id')
                if cat_input is not None:
                    if str(cat_input).isdigit():
                        instance.category = Category.objects.get(pk=int(cat_input))
                    else:
                        instance.category = Category.objects.filter(name__iexact=str(cat_input)).first()
                    instance.save()
        except Exception:
            pass

        return instance


# ------------------------
# Report Serializer
# ------------------------
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'user', 'post', 'comment', 'report_type', 'reason', 'action', 'resolved', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        # Prevent reporting your own content
        target_post = validated_data.get('post')
        target_comment = validated_data.get('comment')
        if user and user.is_authenticated:
            if target_post and getattr(target_post, 'user', None) == user:
                raise serializers.ValidationError('ไม่สามารถรายงานโพสต์ของตัวเองได้')
            if target_comment and getattr(target_comment, 'user', None) == user:
                raise serializers.ValidationError('ไม่สามารถรายงานคอมเมนต์ของตัวเองได้')
        validated_data['user'] = user
        # Ensure reason is present (may be empty string or None)
        if 'reason' not in validated_data:
            validated_data['reason'] = ''
        return super().create(validated_data)


# ------------------------
# JWT Custom Token Serializer
# ------------------------
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'

    def validate(self, attrs):
        identifier = attrs.get(self.username_field)
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError('กรุณากรอกชื่อผู้ใช้/อีเมลและรหัสผ่าน')

        ident = str(identifier).strip()
        # Prefer email lookup when identifier looks like an email; use case-insensitive match.
        # Otherwise attempt a case-insensitive username lookup so users can enter different case.
        user_obj = None
        if '@' in ident:
            user_obj = User.objects.filter(email__iexact=ident).first()
        else:
            user_obj = User.objects.filter(username__iexact=ident).first()

        # If we found a user via email or username, resolve the exact username for authentication.
        username = user_obj.username if user_obj else ident

        # Authenticate with the resolved username
        user = authenticate(username=username, password=password)
        if user is None:
            # authentication failed (wrong credentials or inactive)
            raise serializers.ValidationError("ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง")

        # set the resolved username so super().validate will succeed
        attrs[self.username_field] = username
        data = super().validate(attrs)

        # include some user info in the token response
        data['username'] = user.username
        data['avatar'] = user.avatar.url if getattr(user, 'avatar', None) else None
        return data


# ------------------------
# Password Reset Serializers
# ------------------------
class PasswordResetRequestSerializer(serializers.Serializer):
    # Accept either username or email for requesting a password reset
    identifier = serializers.CharField()

    def validate_identifier(self, value):
        # Normalize input: trim whitespace so lookups are more forgiving
        if value is None:
            raise serializers.ValidationError('This field is required')
        return str(value).strip()

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    # Allow minimum 6 characters for password to match frontend guidance
    new_password = serializers.CharField(min_length=6)

    def validate(self, attrs):
        try:
            uid = attrs.get('uid')
            token = attrs.get('token')
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = get_user_model().objects.get(pk=uid_decoded)
        except Exception:
            raise serializers.ValidationError('Invalid uid')

        if not PasswordResetTokenGenerator().check_token(user, token):
            raise serializers.ValidationError('Invalid or expired token')

        attrs['user_obj'] = user
        return attrs
