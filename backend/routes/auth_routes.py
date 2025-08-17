from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import jwt
from datetime import datetime, timedelta
import os

auth_bp = Blueprint('auth', __name__)

# Simple JWT implementation for API authentication
SECRET_KEY = os.getenv('JWT_SECRET_KEY', os.getenv('SECRET_KEY'))

@auth_bp.route('/token', methods=['POST'])
@cross_origin()
def create_token():
    """Create API token for mobile app"""
    try:
        data = request.get_json()
        
        # In production, validate against Supabase or your auth provider
        # For now, simple validation
        api_key = data.get('api_key')
        
        if api_key != os.getenv('API_KEY'):
            return jsonify({'error': 'Invalid API key'}), 401
        
        # Create JWT token
        payload = {
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow(),
            'sub': 'dreamweave-mobile-app'
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            'success': True,
            'token': token,
            'expires_in': 30 * 24 * 60 * 60  # 30 days in seconds
        })
        
    except Exception as e:
        return jsonify({'error': 'Authentication failed'}), 401

@auth_bp.route('/verify', methods=['GET'])
@cross_origin()
def verify_token():
    """Verify API token"""
    try:
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        
        return jsonify({
            'success': True,
            'valid': True,
            'subject': payload.get('sub')
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401 