"""
Security middleware and utilities for DreamWeave backend
"""
import os
import secrets
import hashlib
import hmac
from functools import wraps
from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt

class SecurityConfig:
    """Security configuration and utilities"""
    
    @staticmethod
    def init_app(app):
        """Initialize security settings for the Flask app"""
        # Security headers
        @app.after_request
        def set_security_headers(response):
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Content-Security-Policy'] = "default-src 'self'"
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
            return response
        
        # Remove server header
        @app.after_request
        def remove_server_header(response):
            response.headers.pop('Server', None)
            return response

def generate_api_key():
    """Generate a secure API key"""
    return secrets.token_urlsafe(32)

def hash_api_key(api_key):
    """Hash an API key for storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()

def verify_api_key(provided_key, stored_hash):
    """Verify an API key against its hash"""
    return hmac.compare_digest(hash_api_key(provided_key), stored_hash)

def sanitize_input(data):
    """Sanitize user input to prevent XSS and injection attacks"""
    if isinstance(data, str):
        # Remove potentially dangerous characters
        dangerous_chars = ['<', '>', '"', "'", '&', '\x00']
        for char in dangerous_chars:
            data = data.replace(char, '')
        return data.strip()
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    return data

def require_api_key(f):
    """Decorator to require API key for endpoints"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        
        if not api_key:
            return jsonify({'error': 'API key required'}), 401
        
        # In production, verify against stored hashed keys
        # For now, we'll use a simple check
        if api_key != current_app.config.get('API_KEY'):
            return jsonify({'error': 'Invalid API key'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def validate_content_type(expected='application/json'):
    """Decorator to validate content type"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.content_type != expected:
                return jsonify({'error': f'Content-Type must be {expected}'}), 400
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def rate_limit_by_ip(max_requests=100, window_hours=1):
    """Simple IP-based rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # In production, use Redis or similar for distributed rate limiting
            # This is a simplified implementation
            client_ip = request.remote_addr
            
            # Check rate limit (simplified - use Redis in production)
            # For now, just pass through
            return f(*args, **kwargs)
        return decorated_function
    return decorator

class InputValidator:
    """Input validation utilities"""
    
    @staticmethod
    def validate_dream_data(data):
        """Validate dream entry data"""
        errors = []
        
        # Required fields
        if not data.get('dream_title'):
            errors.append('Dream title is required')
        
        # Length limits
        if data.get('dream_title') and len(data['dream_title']) > 200:
            errors.append('Dream title must be less than 200 characters')
            
        if data.get('enhanced_description') and len(data['enhanced_description']) > 5000:
            errors.append('Dream description must be less than 5000 characters')
        
        # Validate emotion/theme arrays
        for field in ['emotions', 'themes', 'symbols']:
            if data.get(field) and not isinstance(data[field], list):
                errors.append(f'{field} must be an array')
        
        # Validate numeric fields
        for field in ['lucidity_level', 'vividness_level']:
            if field in data:
                try:
                    val = int(data[field])
                    if val < 0 or val > 5:
                        errors.append(f'{field} must be between 0 and 5')
                except:
                    errors.append(f'{field} must be a number')
        
        return errors
    
    @staticmethod
    def validate_image_generation_request(data):
        """Validate image generation request"""
        errors = []
        
        if not data.get('prompt'):
            errors.append('Prompt is required')
        elif len(data['prompt']) > 1000:
            errors.append('Prompt must be less than 1000 characters')
        
        valid_styles = ['ethereal', 'surreal', 'nightmare', 'cosmic', 'mystical', 'nostalgic']
        if data.get('style') and data['style'] not in valid_styles:
            errors.append(f'Style must be one of: {", ".join(valid_styles)}')
        
        return errors

# JWT utilities for user sessions
def generate_token(user_id, expires_in=24):
    """Generate JWT token for user"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=expires_in),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user_id to kwargs
        kwargs['user_id'] = payload['user_id']
        return f(*args, **kwargs)
    
    return decorated_function