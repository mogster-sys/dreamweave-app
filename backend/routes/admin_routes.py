from flask import Blueprint, render_template, request, jsonify, redirect, url_for, session
from functools import wraps
import os
from datetime import datetime, timedelta
from models import db, DreamEntry, User, APIUsage
from sqlalchemy import func, desc
import json

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Simple admin check - in production, use proper authentication
        admin_key = request.headers.get('X-Admin-Key') or request.args.get('admin_key')
        if admin_key != os.getenv('ADMIN_KEY', 'dev-admin-key'):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/')
@admin_required
def dashboard():
    """Admin dashboard with key metrics"""
    try:
        # Basic statistics
        total_dreams = db.session.query(func.count(DreamEntry.id)).scalar() or 0
        total_users = db.session.query(func.count(User.id)).scalar() or 0
        
        # Recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        dreams_this_week = db.session.query(func.count(DreamEntry.id)).filter(
            DreamEntry.created_at >= week_ago
        ).scalar() or 0
        
        # Top themes and emotions
        all_dreams = DreamEntry.query.limit(1000).all()
        all_emotions = []
        all_themes = []
        
        for dream in all_dreams:
            if dream.emotions:
                try:
                    emotions = json.loads(dream.emotions) if isinstance(dream.emotions, str) else dream.emotions
                    all_emotions.extend(emotions)
                except:
                    pass
            if dream.themes:
                try:
                    themes = json.loads(dream.themes) if isinstance(dream.themes, str) else dream.themes
                    all_themes.extend(themes)
                except:
                    pass
        
        # Count occurrences
        emotion_counts = {}
        for emotion in all_emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        theme_counts = {}
        for theme in all_themes:
            theme_counts[theme] = theme_counts.get(theme, 0) + 1
        
        top_emotions = sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        top_themes = sorted(theme_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # API usage statistics
        api_usage_today = 0
        api_cost_today = 0
        
        try:
            today = datetime.utcnow().date()
            usage_today = APIUsage.query.filter(
                func.date(APIUsage.timestamp) == today
            ).all()
            
            api_usage_today = len(usage_today)
            api_cost_today = sum(usage.cost or 0 for usage in usage_today)
        except:
            pass
        
        stats = {
            'total_dreams': total_dreams,
            'total_users': total_users,
            'dreams_this_week': dreams_this_week,
            'top_emotions': top_emotions,
            'top_themes': top_themes,
            'api_usage_today': api_usage_today,
            'api_cost_today': round(api_cost_today, 4),
            'last_updated': datetime.utcnow().isoformat()
        }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/dreams')
@admin_required
def list_dreams():
    """List recent dreams with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        dreams_query = DreamEntry.query.order_by(desc(DreamEntry.created_at))
        dreams = dreams_query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        dream_list = []
        for dream in dreams.items:
            dream_data = {
                'id': dream.id,
                'title': dream.title or 'Untitled',
                'created_at': dream.created_at.isoformat() if dream.created_at else None,
                'user_id': getattr(dream, 'user_id', 'anonymous'),
                'has_image': bool(getattr(dream, 'image_url', None)),
                'emotions': dream.emotions if hasattr(dream, 'emotions') else [],
                'themes': dream.themes if hasattr(dream, 'themes') else [],
                'content_length': len(dream.content or '') if hasattr(dream, 'content') else 0
            }
            dream_list.append(dream_data)
        
        return jsonify({
            'dreams': dream_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': dreams.total,
                'pages': dreams.pages,
                'has_next': dreams.has_next,
                'has_prev': dreams.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users')
@admin_required
def list_users():
    """List users with basic stats"""
    try:
        users_query = User.query.order_by(desc(User.created_at))
        users = users_query.limit(100).all()
        
        user_list = []
        for user in users:
            # Count dreams for this user
            dream_count = DreamEntry.query.filter_by(user_id=user.id).count()
            
            user_data = {
                'id': user.id,
                'email': getattr(user, 'email', 'N/A'),
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'dream_count': dream_count,
                'last_active': getattr(user, 'last_active', None)
            }
            user_list.append(user_data)
        
        return jsonify({'users': user_list})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/api-usage')
@admin_required
def api_usage():
    """API usage and cost tracking"""
    try:
        # Last 30 days of API usage
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        usage_query = APIUsage.query.filter(
            APIUsage.timestamp >= thirty_days_ago
        ).order_by(desc(APIUsage.timestamp))
        
        usage_records = usage_query.limit(1000).all()
        
        # Group by date
        daily_usage = {}
        daily_costs = {}
        service_usage = {}
        
        for record in usage_records:
            date_str = record.timestamp.date().isoformat()
            service = record.service
            
            # Daily totals
            daily_usage[date_str] = daily_usage.get(date_str, 0) + 1
            daily_costs[date_str] = daily_costs.get(date_str, 0) + (record.cost or 0)
            
            # Service totals
            service_usage[service] = service_usage.get(service, 0) + 1
        
        total_cost = sum(record.cost or 0 for record in usage_records)
        
        return jsonify({
            'total_requests': len(usage_records),
            'total_cost': round(total_cost, 4),
            'daily_usage': daily_usage,
            'daily_costs': daily_costs,
            'service_breakdown': service_usage,
            'recent_requests': [
                {
                    'service': record.service,
                    'cost': record.cost,
                    'timestamp': record.timestamp.isoformat(),
                    'details': record.details
                }
                for record in usage_records[:20]
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/system-health')
@admin_required
def system_health():
    """System health and status"""
    try:
        health_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'database': 'connected',
            'services': {
                'openai': bool(os.getenv('OPENAI_API_KEY')),
                'supabase': bool(os.getenv('SUPABASE_URL')),
            },
            'environment': {
                'debug': os.getenv('FLASK_ENV') == 'development',
                'database_url': bool(os.getenv('DATABASE_URL')),
                'upload_folder': os.path.exists(os.getenv('UPLOAD_FOLDER', 'uploads'))
            }
        }
        
        # Test database connection
        try:
            db.session.execute('SELECT 1')
            health_data['database'] = 'connected'
        except:
            health_data['database'] = 'error'
        
        return jsonify(health_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/export-data')
@admin_required
def export_data():
    """Export all dreams data"""
    try:
        format_type = request.args.get('format', 'json')
        limit = request.args.get('limit', 1000, type=int)
        
        dreams = DreamEntry.query.order_by(desc(DreamEntry.created_at)).limit(limit).all()
        
        export_data = {
            'export_timestamp': datetime.utcnow().isoformat(),
            'total_records': len(dreams),
            'dreams': []
        }
        
        for dream in dreams:
            dream_data = {
                'id': dream.id,
                'title': getattr(dream, 'title', 'Untitled'),
                'content': getattr(dream, 'content', ''),
                'created_at': dream.created_at.isoformat() if dream.created_at else None,
                'user_id': getattr(dream, 'user_id', 'anonymous'),
                'emotions': getattr(dream, 'emotions', []),
                'themes': getattr(dream, 'themes', []),
                'image_url': getattr(dream, 'image_url', None)
            }
            export_data['dreams'].append(dream_data)
        
        if format_type == 'csv':
            # Convert to CSV format
            import csv
            import io
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Headers
            writer.writerow(['ID', 'Title', 'Content', 'Created At', 'User ID', 'Emotions', 'Themes', 'Has Image'])
            
            # Data rows
            for dream in export_data['dreams']:
                writer.writerow([
                    dream['id'],
                    dream['title'],
                    dream['content'][:100] + '...' if len(dream['content']) > 100 else dream['content'],
                    dream['created_at'],
                    dream['user_id'],
                    ', '.join(dream['emotions']) if dream['emotions'] else '',
                    ', '.join(dream['themes']) if dream['themes'] else '',
                    'Yes' if dream['image_url'] else 'No'
                ])
            
            csv_content = output.getvalue()
            output.close()
            
            from flask import Response
            return Response(
                csv_content,
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment; filename=dreamweave_export_{datetime.utcnow().strftime("%Y%m%d")}.csv'}
            )
        
        return jsonify(export_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/cleanup')
@admin_required
def cleanup_data():
    """Clean up old data and temporary files"""
    try:
        cleanup_results = {
            'timestamp': datetime.utcnow().isoformat(),
            'actions': []
        }
        
        # Clean up old API usage records (older than 90 days)
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        old_usage = APIUsage.query.filter(APIUsage.timestamp < ninety_days_ago).all()
        
        if old_usage:
            for record in old_usage:
                db.session.delete(record)
            db.session.commit()
            cleanup_results['actions'].append(f'Deleted {len(old_usage)} old API usage records')
        
        # Clean up upload folder (files older than 30 days)
        upload_folder = os.getenv('UPLOAD_FOLDER', 'uploads')
        if os.path.exists(upload_folder):
            import glob
            import time
            
            files_cleaned = 0
            thirty_days_ago_timestamp = time.time() - (30 * 24 * 60 * 60)
            
            for file_path in glob.glob(os.path.join(upload_folder, '*')):
                if os.path.getmtime(file_path) < thirty_days_ago_timestamp:
                    try:
                        os.remove(file_path)
                        files_cleaned += 1
                    except:
                        pass
            
            if files_cleaned > 0:
                cleanup_results['actions'].append(f'Cleaned up {files_cleaned} old upload files')
        
        if not cleanup_results['actions']:
            cleanup_results['actions'].append('No cleanup actions needed')
        
        return jsonify(cleanup_results)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500