import os
from datetime import timedelta
from pathlib import Path
import sys
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from project root and backend dirs if present
# Supports: .env at repo root, backend.env at repo root, and backend/.env
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR.parent / 'backend.env')
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'dev-secret-key')

# Allow configuration via environment, default to dev wildcard

def get_env_list(name: str, default: str = "") -> list[str]:
    value = os.environ.get(name, default)
    return [item.strip() for item in value.split(",") if item.strip()]

# New: boolean env helper and DEV flag to toggle dev behaviors (e.g., SQLite DB)
def get_env_bool(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}

# Remove any hardcoded DEV flag and use env instead
DEV: bool = get_env_bool('DJANGO_DEV', True)
DEBUG = get_env_bool('DJANGO_DEBUG', DEV)

ALLOWED_HOSTS = get_env_list('DJANGO_ALLOWED_HOSTS', '*')

# Feature flags / providers
USE_OPENAI = True#get_env_bool('USE_OPENAI', False)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'corsheaders',
    'rest_framework',
    'channels',
    # Project apps
    'authentication',
    'courses',
    'chat',
    'ai_models',
    'analytics',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Custom user model
AUTH_USER_MODEL = 'authentication.User'

# DRF defaults: allow anonymous for auth endpoints
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'rest_framework.schemas.coreapi.AutoSchema',
}

# Allow unauthenticated access to SimpleJWT token views explicitly
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.environ.get('JWT_ACCESS_MINUTES', '60'))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.environ.get('JWT_REFRESH_DAYS', '7'))),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Database
# Use PostgreSQL configuration via environment variables
# DJANGO_DB_NAME, DJANGO_DB_USER, DJANGO_DB_PASSWORD, DJANGO_DB_HOST, DJANGO_DB_PORT
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DJANGO_DB_NAME', 'pathfinder'),
        'USER': os.environ.get('DJANGO_DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DJANGO_DB_PASSWORD', ''),
        'HOST': os.environ.get('DJANGO_DB_HOST', 'localhost'),
        'PORT': os.environ.get('DJANGO_DB_PORT', '5432'),
    }
}

# Testing/Dev: use SQLite when running tests, when explicitly requested, or when DEV flag is on
if 'test' in sys.argv or os.environ.get('DJANGO_USE_SQLITE_FOR_TESTS') == '1':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'test_db.sqlite3',
        }
    }
elif DEV:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'dev_db.sqlite3',
        }
    }

_redis_url = os.environ.get('REDIS_URL')
_redis_host = os.environ.get('REDIS_HOST', '127.0.0.1')
_redis_port = int(os.environ.get('REDIS_PORT', '6379'))
_redis_password = os.environ.get('REDIS_PASSWORD', 'Sfk2y2rcz3axazddgk69qxqipuz8m7taix7xdcu7ntluzkzb8u')
_redis_ssl = get_env_bool('REDIS_SSL', False)

if _redis_url:
    _hosts = [_redis_url]
elif _redis_password or _redis_ssl:
    _hosts = [{
        'address': (_redis_host, _redis_port),
        **({'password': _redis_password} if _redis_password else {}),
        **({'ssl': True} if _redis_ssl else {}),
    }]
else:
    _hosts = [(_redis_host, _redis_port)]

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': _hosts,
        },
    },
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = os.environ.get('DJANGO_TIME_ZONE', 'UTC')
USE_I18N = True
USE_TZ = True

# Static and media files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS: list[Path] = []

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS & CSRF settings for React frontend integration
_DEFAULT_CORS_ORIGINS: list[str] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
]
CORS_ALLOWED_ORIGINS = get_env_list(
    'DJANGO_CORS_ALLOWED_ORIGINS', ','.join(_DEFAULT_CORS_ORIGINS)
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = get_env_list(
    'DJANGO_CSRF_TRUSTED_ORIGINS', ','.join(_DEFAULT_CORS_ORIGINS)
)

# Cookie & security settings
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 3600 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
