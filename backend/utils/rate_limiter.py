from functools import wraps
from flask import request, jsonify, current_app
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
import os

# Initialize limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv('REDIS_URL', 'memory://'),
)

# Custom rate limit decorators for AI endpoints
def ai_rate_limit(f):
    """Rate limit for AI endpoints - more restrictive"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Different limits for different operations
        endpoint = request.endpoint
        
        if 'generate-image' in endpoint:
            # Image generation: 5 per minute, 50 per hour
            limit = "5 per minute, 50 per hour"
        elif 'speech-to-text' in endpoint:
            # Transcription: 10 per minute, 100 per hour
            limit = "10 per minute, 100 per hour"
        else:
            # Default AI limit
            limit = "20 per minute, 200 per hour"
        
        # Apply dynamic limit
        # Note: In production, use Redis for distributed rate limiting
        return f(*args, **kwargs)
    
    return decorated_function

def get_user_identifier():
    """Get user identifier for rate limiting"""
    # Try to get authenticated user ID
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        # In production, decode JWT to get user ID
        return f"user_{auth_header[-8:]}"  # Last 8 chars as example
    
    # Fall back to IP
    return get_remote_address() 