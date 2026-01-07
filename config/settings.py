import os
from pathlib import Path

# --- CHEMINS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SÉCURITÉ ---
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-zenon-asbl-key-prod')

# On détecte si on est sur Render
IS_RENDER = os.environ.get('RENDER', '').lower() == 'true'

# DEBUG mode
# En production sur Render: DEBUG=False
# En local: DEBUG=True
DEBUG = os.environ.get('DEBUG', 'True') == 'True' if not IS_RENDER else False

# --- HÔTES AUTORISÉS (CRITIQUE POUR RENDER) ---
ALLOWED_HOSTS = []

# Ajout automatique de l'adresse Render
RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Domaines spécifiques
ALLOWED_HOSTS.extend([
    'orphelin-asbl.onrender.com',
    'orphelin-prioritee-backend.onrender.com',
])

# En développement, ajouter les hôtes locaux
if DEBUG:
    ALLOWED_HOSTS.extend([
        '127.0.0.1',
        'localhost',
        '0.0.0.0',
    ])
else:
    # En production, ajouter le wildcard pour Render
    ALLOWED_HOSTS.append('.onrender.com')

# --- APPLICATIONS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',  # Important pour Django 6.0
    'django.contrib.staticfiles',
    
    # Vos applications
    'messagerie.apps.MessagerieConfig',
    
    # Applications tierces
    'corsheaders',
]

# --- MIDDLEWARE (ORDRE TRÈS IMPORTANT) ---
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Doit être juste après SecurityMiddleware
    'corsheaders.middleware.CorsMiddleware',  # Doit être avant CommonMiddleware
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
        'DIRS': [BASE_DIR / 'templates'],
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

# --- BASE DE DONNÉES ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Configuration de la base de données pour Render (PostgreSQL)
if IS_RENDER:
    import dj_database_url
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL:
        DATABASES['default'] = dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True
        )

# --- VALIDATEURS DE MOT DE PASSE ---
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# --- INTERNATIONALISATION ---
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- FICHIERS STATIQUES (WHITENOISE) ---
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Dossiers statiques supplémentaires
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Configuration WhiteNoise pour Django 6.0
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Paramètres WhiteNoise
WHITENOISE_AUTOREFRESH = DEBUG  # Auto-refresh en mode debug
WHITENOISE_MAX_AGE = 31536000 if not DEBUG else 0  # Cache pour 1 an en production

# --- CORS CONFIGURATION ---
# Autoriser toutes les origines en développement, spécifiques en production
CORS_ALLOW_ALL_ORIGINS = DEBUG

if not DEBUG:
    CORS_ALLOWED_ORIGINS = [
        'https://orphelin-asbl.onrender.com',
        'https://orphelin-prioritee-backend.onrender.com',
    ]
else:
    CORS_ALLOWED_ORIGINS = [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ]

CORS_ALLOW_CREDENTIALS = True

# Méthodes HTTP autorisées
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Headers autorisés
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# --- CSRF CONFIGURATION ---
CSRF_TRUSTED_ORIGINS = [
    'https://orphelin-asbl.onrender.com',
    'https://orphelin-prioritee-backend.onrender.com',
]

if DEBUG:
    CSRF_TRUSTED_ORIGINS.extend([
        'http://127.0.0.1:8000',
        'http://localhost:8000',
        'http://127.0.0.1:3000',
        'http://localhost:3000',
    ])

# COOKIE settings
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# --- SÉCURITÉ HTTPS ---
if IS_RENDER or not DEBUG:
    # Configuration critique pour Render
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000  # 1 an
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
else:
    SECURE_SSL_REDIRECT = False

# --- CONFIGURATION EMAIL ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', 'uzimamzenon@gmail.com')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = f"Orphelin Priorité ASBL <{EMAIL_HOST_USER}>"
EMAIL_TIMEOUT = 30

# --- LOGGING ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO' if not DEBUG else 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# --- DERNIÈRES CONFIGURATIONS ---
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Désactiver le trailing slash
APPEND_SLASH = False

# Configuration pour les fichiers uploadés
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'