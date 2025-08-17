import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import time

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
try:
    from security import SecurityConfig, InputValidator, sanitize_input
except ImportError:
    # If security module not available, create dummy classes
    class SecurityConfig:
        @staticmethod
        def init_app(app):
            pass
    class InputValidator:
        @staticmethod
        def validate_dream_data(data):
            return []
    def sanitize_input(data):
        return data

# Load environment variables
load_dotenv()

# Initialize OpenAI client
try:
    from openai import OpenAI
    openai_client = OpenAI(
        api_key=os.getenv('OPENAI_API_KEY'),
        # Remove proxies parameter that's causing the error
    )
    logger.info("OpenAI client initialized successfully")
except Exception as e:
    logger.warning(f"OpenAI client initialization failed: {e}")
    openai_client = None

# Create Flask app
app = Flask(__name__)

# Basic configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Initialize security
SecurityConfig.init_app(app)

# Configure CORS for mobile app
CORS(app, resources={
    r"/api/*": {
        "origins": os.getenv('ALLOWED_ORIGINS', '*').split(','),
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Configure rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=['100 per hour'],
    storage_uri='memory://',
    headers_enabled=True
)

# Configure logging with file output
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()  # Also log to console
    ]
)
logger = logging.getLogger(__name__)

# Import and register blueprints
try:
    from routes.ai_routes import ai_bp
    app.register_blueprint(ai_bp, url_prefix='/api')
    logger.info("AI routes registered successfully")
except ImportError as e:
    logger.warning(f"Could not import AI routes: {e}")

# Art style configurations for dream-like imagery
ART_STYLES = {
    'ethereal': 'ethereal dreamscape, soft flowing forms, gossamer textures, opalescent colors, mystical atmosphere, floating elements, luminous mist',
    'surreal': 'surrealist masterpiece, impossible geometry, melting reality, vivid contrasts, Salvador Dali inspired, dream logic, distorted perspective',
    'nightmare': 'dark fantasy art, gothic atmosphere, shadowy forms, psychological elements, haunting beauty, mysterious depths, dramatic lighting',
    'cosmic': 'cosmic dreamscape, celestial bodies, nebulae, stardust, infinite space, otherworldly, stellar phenomena, galaxy swirls',
    'mystical': 'mystical dreamscape, magical elements, enchanted atmosphere, glowing particles, ancient symbols, spiritual energy, ethereal light',
    'nostalgic': 'nostalgic dreamscape, faded memories, vintage aesthetic, warm sepia tones, soft focus, emotional resonance, time-worn beauty'
}

def enhance_dream_prompt(dream_text, style='ethereal', character_images=None):
    """Enhance dream prompt for better AI image generation"""
    
    # Get base style for dreams
    style_base = ART_STYLES.get(style, ART_STYLES['ethereal'])
    
    # Build dream-specific enhanced prompt
    enhanced = f"A vivid dream visualization: {dream_text}. Rendered in {style_base} style."
    
    # Add dream-specific visual elements
    enhanced += " Dream-like quality with soft edges, emotional atmosphere, subconscious symbolism."
    
    # Add character references if provided
    if character_images and len(character_images) > 0:
        enhanced += f" Include {len(character_images)} character(s) based on provided reference(s) with dreamlike alterations."
    
    # Add artistic quality modifiers for dreams
    enhanced += " Masterpiece digital art, trending on ArtStation, dream journal illustration style, emotional depth."
    
    # Limit length for DALL-E
    if len(enhanced) > 3900:
        enhanced = enhanced[:3900] + "..."
    
    return enhanced

@app.route('/')
def health_check():
    """Simple health check"""
    return jsonify({
        'name': 'DreamWeave Image API',
        'version': '1.0.0',
        'status': 'running',
        'privacy': 'No audio processing - dreams processed on-device only'
    })

@app.route('/api/generate-image', methods=['POST'])
@limiter.limit("10 per minute")
def generate_dream_image():
    """
    Generate AI image from dream text prompt
    Privacy-first: Only receives enhanced text, no audio
    Now includes on-device analysis results in the prompt
    """
    try:
        data = request.get_json()
        
        if not data or 'dream_prompt' not in data:
            return jsonify({'error': 'dream_prompt is required'}), 400
        
        dream_prompt = data['dream_prompt'].strip()
        if len(dream_prompt) < 10:
            return jsonify({'error': 'Dream prompt too short (minimum 10 characters)'}), 400
        
        style = data.get('style', 'ethereal')
        quality = data.get('quality', 'standard')
        character_images = data.get('character_images', [])
        original_dream = data.get('original_dream', '')
        analysis_summary = data.get('analysis_summary', '')
        
        # Validate style
        if style not in ART_STYLES:
            style = 'ethereal'
        
        # Validate quality
        if quality not in ['standard', 'hd']:
            quality = 'standard'
        
        start_time = time.time()
        
        # Log privacy-preserving information
        logger.info(f"Generating image for style: {style}, quality: {quality}")
        if analysis_summary:
            logger.info(f"On-device analysis: {analysis_summary}")
        
        # The dream_prompt is already enhanced by the mobile client
        # Just add final dream-specific elements
        final_prompt = dream_prompt
        if len(final_prompt) > 3900:
            final_prompt = final_prompt[:3900] + "..."
        
        # Generate image with DALL-E 3
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=final_prompt,
            n=1,
            size="1024x1024",
            quality=quality,
            style="vivid"
        )
        
        image_url = response.data[0].url
        revised_prompt = response.data[0].revised_prompt or final_prompt
        
        # Calculate cost and time
        cost = 0.040 if quality == 'standard' else 0.080
        generation_time = time.time() - start_time
        
        logger.info(f"Image generated successfully in {generation_time:.2f}s, cost: ${cost}")
        
        return jsonify({
            'success': True,
            'image_url': image_url,
            'enhanced_prompt': final_prompt,
            'revised_prompt': revised_prompt,
            'style': style,
            'quality': quality,
            'cost_estimate': cost,
            'generation_time': generation_time,
            'analysis_used': analysis_summary,
            'privacy_note': 'Generated from on-device enhanced prompt only'
        })
        
    except Exception as e:
        logger.error(f"Image generation failed: {str(e)}")
        return jsonify({
            'error': 'Failed to generate image',
            'message': 'Please try again later'
        }), 500

@app.route('/api/styles', methods=['GET'])
def get_art_styles():
    """Get available art styles for dreams"""
    return jsonify({
        'styles': [
            {'id': 'ethereal', 'name': 'Ethereal', 'description': 'Soft, flowing, mystical atmosphere'},
            {'id': 'surreal', 'name': 'Surreal', 'description': 'Salvador Dali inspired, impossible geometry'},
            {'id': 'nightmare', 'name': 'Nightmare', 'description': 'Dark fantasy, gothic atmosphere'},
            {'id': 'cosmic', 'name': 'Cosmic', 'description': 'Celestial bodies, stardust, otherworldly'},
            {'id': 'mystical', 'name': 'Mystical', 'description': 'Magical, enchanted, mystical elements'},
            {'id': 'nostalgic', 'name': 'Nostalgic', 'description': 'Vintage, warm sepia tones, soft focus'}
        ]
    })

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        'error': 'Rate limit exceeded',
        'message': 'Too many requests. Please wait before generating another image.'
    }), 429

@app.errorhandler(500)
def internal_error(error):
    logger.error(f'Internal error: {error}')
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    if not os.getenv('OPENAI_API_KEY'):
        logger.error("OPENAI_API_KEY not set in environment")
        exit(1)
    
    logger.info(f"Starting DreamWeave Image API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)