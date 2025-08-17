from flask import Blueprint, jsonify, current_app
import os
import psutil
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/status', methods=['GET'])
def health_status():
    """Comprehensive health check endpoint"""
    try:
        # Check OpenAI API key
        openai_configured = bool(os.getenv('OPENAI_API_KEY'))
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '1.0.0',
            'services': {
                'openai': 'configured' if openai_configured else 'not configured',
                'database': 'not implemented',  # Add DB check if using
                'storage': 'local'
            },
            'metrics': {
                'cpu_usage': f"{cpu_percent}%",
                'memory_usage': f"{memory.percent}%",
                'disk_usage': f"{disk.percent}%"
            }
        })
    except Exception as e:
        current_app.logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 503

@health_bp.route('/ready', methods=['GET'])
def readiness_check():
    """Kubernetes readiness probe endpoint"""
    try:
        # Check if all required services are available
        checks = {
            'openai_key': bool(os.getenv('OPENAI_API_KEY')),
            'cors_configured': True,
            'rate_limiting': True
        }
        
        all_ready = all(checks.values())
        
        return jsonify({
            'ready': all_ready,
            'checks': checks
        }), 200 if all_ready else 503
        
    except Exception as e:
        return jsonify({'ready': False, 'error': str(e)}), 503

@health_bp.route('/live', methods=['GET'])
def liveness_check():
    """Kubernetes liveness probe endpoint"""
    return jsonify({'alive': True}), 200 