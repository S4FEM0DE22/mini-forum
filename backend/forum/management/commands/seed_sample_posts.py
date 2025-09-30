from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from forum.models import Post, Tag, Category
import random


SAMPLE_MARKER = "[SAMPLE_SEED]"


class Command(BaseCommand):
    help = 'Create demo users, tags, categories and 10 sample posts for local development.'

    def handle(self, *args, **options):
        User = get_user_model()

        # Create demo users
        demo_users = []
        usernames = ["alice_demo", "bob_demo", "charlie_demo"]
        for uname in usernames:
            user, created = User.objects.get_or_create(username=uname, defaults={
                'email': f'{uname}@example.com',
            })
            # Ensure demo accounts have a usable password for local testing
            try:
                # set a known demo password (idempotent)
                user.set_password('demo1234')
                user.save()
            except Exception:
                # If the user model doesn't support set_password for some reason, ignore
                pass
            demo_users.append(user)

        # Create some categories
        cat_names = ["General", "Help", "Announcements"]
        categories = []
        for name in cat_names:
            c, _ = Category.objects.get_or_create(name=name)
            categories.append(c)

        # Create some tags
        tag_names = ["python", "react", "django", "help", "announcement"]
        tags = []
        for t in tag_names:
            tag, _ = Tag.objects.get_or_create(name=t)
            tags.append(tag)

        # Simple sample titles and bodies
        sample_titles = [
            "Welcome to the mini-forum",
            "How to install the project locally",
            "Tips for writing clean code",
            "React + Django deployment notes",
            "Need help with authentication",
            "Showcase: small projects",
            "Weekly community update",
            "Best practices for testing",
            "How to contribute",
            "Server-side pagination examples",
        ]

        sample_bodies = [
            "This is a demo post created to showcase the forum UI and features.",
            "Run migrations, create a superuser, then start the dev server.",
            "Keep functions small and descriptive. Use meaningful names.",
            "Build a simple API with Django REST Framework and connect a React frontend.",
            "If you're getting 401s, check token handling and refresh flow.",
            "Share a small project you're proud of and get feedback.",
            "Announcements and highlights from the past week.",
            "Write unit tests for critical paths and consider integration tests.",
            "Open-source contribution steps: fork, branch, PR, and discuss.",
            "An example showing how to fetch pages from the API and render them.",
        ]

        # Create 10 posts
        created_count = 0
        for i in range(10):
            title = f"{sample_titles[i]} {SAMPLE_MARKER}"
            body = sample_bodies[i]
            # idempotent: skip if title already exists
            if Post.objects.filter(title=title).exists():
                continue

            user = random.choice(demo_users)
            category = random.choice(categories)

            post = Post.objects.create(
                user=user,
                category=category,
                title=title,
                body=body,
                created_at=timezone.now()
            )

            # assign 1-3 tags
            sample_tags = random.sample(tags, k=random.randint(1, min(3, len(tags))))
            for t in sample_tags:
                post.tags.add(t)

            created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Seed complete. Created {created_count} sample posts (if they didn't already exist)."))
