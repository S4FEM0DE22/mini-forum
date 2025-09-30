from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission

# ------------------------
# User
# ------------------------
class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("user", "User"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="user")
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True, default="avatars/default-avatar.png")
    social_link = models.URLField(blank=True, null=True)
    # Store multiple social links (facebook/twitter/instagram/github) as JSON
    try:
        # Django >= 3.1
        from django.db.models import JSONField
        social = JSONField(default=dict, blank=True, null=True)
    except Exception:
        # Fallback: if JSONField not available, use TextField and store JSON string
        social = models.TextField(blank=True, null=True, default='{}')

    groups = models.ManyToManyField(
        Group,
        related_name="forum_user_set",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="forum_user_permissions",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    def save(self, *args, **kwargs):
        if self.role == "admin":
            self.is_staff = True
            self.is_superuser = True
        super().save(*args, **kwargs)


# ------------------------
# Category
# ------------------------
class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# ------------------------
# Tag
# ------------------------
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ------------------------
# Post
# ------------------------
class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    # Allow title to be optional so users can post images without typing text
    title = models.CharField(max_length=255, blank=True, null=True)
    # Allow body to be empty so users can post images without text
    body = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="posts/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name="liked_posts", blank=True)
    tags = models.ManyToManyField(Tag, related_name="posts", blank=True)

    def total_likes(self):
        return self.likes.count()

    def __str__(self):
        return self.title
    
    class Meta:
        # Default ordering: newest posts first
        ordering = ["-created_at"]


# ------------------------
# Comment
# ------------------------
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    # Allow comment body to be empty when an image is provided
    body = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to="comments/", blank=True, null=True)
    likes = models.ManyToManyField(User, related_name="liked_comments", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user} - {self.body[:30]}"

    def total_likes(self):
        return self.likes.count()


# ------------------------
# Report
# ------------------------
class Report(models.Model):
    ACTION_CHOICES = [
        ('delete', 'ลบ'),
        ('edit', 'แก้ไข'),
    ]
    REPORT_TYPE_CHOICES = [
        ('post', 'โพสต์'),
        ('comment', 'คอมเมนต์'),
    ]
    # Historically the DB contains a non-null `report_type` column. Add the field
    # back to the model and give it a default so inserts from the API succeed.
    report_type = models.CharField(max_length=10, choices=REPORT_TYPE_CHOICES, default='post')
    post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, blank=True)
    comment = models.ForeignKey(Comment, on_delete=models.SET_NULL, null=True, blank=True)
    # Allow reason to be optional (blank/null) so users can file reports without filling it.
    reason = models.TextField(blank=True, null=True)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        target = self.post or self.comment
        return f"Report by {self.user} on {target}"
