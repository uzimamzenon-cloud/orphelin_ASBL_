import os
from pathlib import Path

# --- CHEMINS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SÉCURITÉ ---
SECRET_KEY = 'django-insecure-zenon-asbl-key-prod'

# On détecte si on est sur Render ou en local
IS_HEROKU_OR_RENDER = 'RENDER' in os.environ

# DEBUG est True en local, mais False sur Render pour la sécurité
DEBUG = not IS_HEROKU_OR_RENDER

# --- HÔTES AUTORISÉS (Correction de ton erreur actuelle) ---
ALLOWED_HOSTS = [
    'orphelin-asbl.onrender.com', 
    'orphelin-prioritee-backend.onrender.com', 
    '127.0.0.1', 
    'localhost'
]

# --- APPLICATIONS ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic', # Indispensable pour les static
    'django.contrib.staticfiles',
    
    'messagerie.apps.MessagerieConfig',
    'corsheaders',
]

# --- MIDDLEWARE (Ordre de pro très important !) ---
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Juste après security
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
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.template.context_processors.csrf', # Indispensable
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

# Si tu ajoutes une vraie DB PostgreSQL sur Render un jour :
if IS_HEROKU_OR_RENDER:
    import dj_database_url
    db_from_env = dj_database_url.config(conn_max_age=600)
    if db_from_env:
        DATABASES['default'] = db_from_env

# --- LANGUE ET TEMPS ---
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# --- FICHIERS STATIQUES (La correction pour les images et JS) ---
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Vérifier si le dossier static existe pour éviter les Warnings
STATICFILES_DIRS = []
base_static = os.path.join(BASE_DIR, 'static')
if os.path.exists(base_static):
    STATICFILES_DIRS.append(base_static)

# Configuration stockage WhiteNoise (Django 5.0+)
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# --- SÉCURITÉ CORS ET CSRF ---
CORS_ALLOW_ALL_ORIGINS = True # Plus simple pour tes tests débutant
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'https://orphelin-asbl.onrender.com',
    'https://orphelin-prioritee-backend.onrender.com',
    'http://127.0.0.1:8000'
]

# --- SÉCURITÉ HTTPS (Uniquement sur Render) ---
if IS_HEROKU_OR_RENDER:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

# --- CONFIGURATION EMAIL ---
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'uzimamzenon@gmail.com'
EMAIL_HOST_PASSWORD = 'dktj wksi qcpk lewn' 
DEFAULT_FROM_EMAIL = f"Orphelin Priorité ASBL <{EMAIL_HOST_USER}>"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'