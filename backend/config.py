import os
from datetime import timedelta

class Config:
    # Basic Flask config
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Database config
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///dreamweave.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session config
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # API Keys (from environment)
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    
    # CORS
    CORS_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*')
    
    # File upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    ALLOWED_EXTENSIONS = {'mp3', 'mp4', 'm4a', 'wav', 'webm'}
    
    # AI Service Configuration
    WHISPER_MODEL = 'whisper-1'
    DALLE_MODEL = 'dall-e-3'
    GPT_MODEL = 'gpt-4-turbo-preview'
    
    # Supabase Configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    # Cost tracking
    TRACK_API_COSTS = os.getenv('TRACK_API_COSTS', 'true').lower() == 'true'

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
    # Security settings for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    WTF_CSRF_TIME_LIMIT = None
    
    # Stricter CORS for production
    CORS_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'https://dreamweave.app,https://www.dreamweave.app')
    
    # Force HTTPS in production
    FORCE_HTTPS = True
    
    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_DEFAULT = "100 per hour"
    RATELIMIT_HEADERS_ENABLED = True

# Config selector
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 