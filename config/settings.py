import os
from pathlib import Path

# --- CHEMINS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SÉCURITÉ ---
SECRET_KEY = 'django-insecure-cle-de-test-a-changer-en-production'
DEBUG = True  # Repasse à False quand tu as fini de corriger
ALLOWED_HOSTS = ['*']  # Autorise Render et ton PC local

# --- APPLICATIONS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Ton application
    'messagerie.apps.MessagerieConfig',
    
    # Extensions indispensables
    'corsheaders',
    'whitenoise.runserver_nostatic', # Aide au développement des fichiers static
]

# --- MIDDLEWARE (L'ordre est très strict !) ---
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Juste après security
    'whitenoise.middleware.WhiteNoiseMiddleware', # Pour les images en ligne
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
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.csrf', # Ajouté pour la sécurité
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# --- BASE DE DONNÉES (Configuration Intelligente) ---
# Si tu es sur Render, il cherche PostgreSQL, sinon il utilise SQLite
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

if 'RENDER' in os.environ:
    import dj_database_url
    db_from_env = dj_database_url.config(conn_max_age=600)
    if db_from_env:
        DATABASES['default'] = db_from_env

# --- VALIDATION DES MOTS DE PASSE ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
]

# --- LANGUE ET TEMPS ---
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- FICHIERS STATIQUES (CSS, JS, IMAGES) ---
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# Version moderne pour Django 5+ de WhiteNoise
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# --- CONFIGURATION CORS (Pour le JavaScript) ---
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "https://orphelin-prioritee-backend.onrender.com",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

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

# Confiance pour Render
CSRF_TRUSTED_ORIGINS = [
    'https://orphelin-prioritee-backend.onrender.com',
    'http://127.0.0.1:8000',
    'http://localhost:8000',
]

# --- SÉCURITÉ COOKIES (pour HTTPS sur Render) ---
if 'RENDER' in os.environ:
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- CONFIGURATION EMAIL (GMAIL) ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'uzimamzenon@gmail.com'
# Rappel : Surtout ne mets pas ton code Gmail en PUBLIC sur GitHub !
EMAIL_HOST_PASSWORD = 'dktj wksi qcpk lewn' 
DEFAULT_FROM_EMAIL = 'uzimamzenon@gmail.com'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'