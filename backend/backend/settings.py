import environ
from datetime import timedelta
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured

# ------------------------
# Environment
# ------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=True)
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["127.0.0.1", "localhost"])

# ------------------------
# Security / deployment-safe defaults
# ------------------------
# These are intentionally controlled by environment variables so production
# deployments can opt into stricter behavior. Sensible safe defaults are
# provided for local development (DEBUG=True) but when DEBUG=False we enforce
# a secure SECRET_KEY and encourage enabling cookie/HTTPS policies.

# Whether to redirect all HTTP -> HTTPS
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=False)

# HSTS: number of seconds to tell browsers to use HTTPS only. 0 disables HSTS.
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=True)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=False)

# Secure cookies
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=False)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=False)

# If running in production (DEBUG=False), perform a couple of sanity checks
if not DEBUG:
    # SECRET_KEY should be provided and not the development-ish default
    if not SECRET_KEY or SECRET_KEY.startswith("django-insecure-") or len(SECRET_KEY) < 50:
        raise ImproperlyConfigured(
            "The SECRET_KEY is not set to a secure value. Set the SECRET_KEY env variable to a long, random value when DEBUG=False."
        )

    # Recommend enabling HTTPS redirects and secure cookies in production
    if not SECURE_SSL_REDIRECT:
        # Log a warning via exception to force the operator to consider settings
        import warnings

        warnings.warn("SECURE_SSL_REDIRECT is False. Ensure your deployment redirects HTTP to HTTPS.")

# ------------------------
# Apps
# ------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",

    # Local
    "forum",
]

# ------------------------
# Middleware
# ------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ------------------------
# CORS
# ------------------------
CORS_ALLOW_ALL_ORIGINS = True

# ------------------------
# Database
# ------------------------
DATABASES = {
    "default": env.db(),  # ตัวอย่าง DATABASE_URL จาก .env
}

# ------------------------
# Redis Cache (Optional)
# ------------------------
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": env("REDIS_URL", default="redis://127.0.0.1:6379/1"),
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

# ------------------------
# REST Framework
# ------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
}

# ------------------------
# Simple JWT
# ------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}

# ------------------------
# Static / Media
# ------------------------
STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ------------------------
# Auth
# ------------------------
AUTH_USER_MODEL = "forum.User"
LOGIN_URL = "/api-auth/login/"
LOGIN_REDIRECT_URL = "/api/posts/"

# In development you may want the API to include the password reset link in the response
# (useful for local testing). Set this to true in your .env only for dev/testing.
INCLUDE_RESET_LINK_IN_RESPONSE = env.bool("INCLUDE_RESET_LINK_IN_RESPONSE", default=False)
# Optional frontend base url used to build password reset links in responses/emails
# Example: http://localhost:5173
FRONTEND_BASE_URL = env("FRONTEND_BASE_URL", default="http://localhost:5173")

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # สามารถเว้นว่างก็ได้
        "APP_DIRS": True,  # ต้องเปิดให้ Django โหลด template ใน apps
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",  # ต้องมี
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

ROOT_URLCONF = "backend.urls"