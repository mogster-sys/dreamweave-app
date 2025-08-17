import os
import base64
import tempfile
import logging
from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from werkzeug.exceptions import BadRequest
import json

from services.openai_service import OpenAIService
from services.transcription_service import TranscriptionService
from services.image_generation_service import ImageGenerationService
from utils.validators import validate_audio_file, validate_dream_text
from utils.rate_limiter import ai_rate_limit

logger = logging.getLogger(__name__)

ai_bp = Blueprint('ai', __name__)

# Initialize services
openai_service = OpenAIService()
transcription_service = TranscriptionService()
image_service = ImageGenerationService()

@ai_bp.route('/speech-to-text', methods=['POST'])
@cross_origin()
@ai_rate_limit
def speech_to_text():
    """Convert speech to text using OpenAI Whisper"""
    try:
        # Check if request has audio data
        if 'audio' not in request.files and 'audio' not in request.json:
            return jsonify({'error': 'No audio data provided'}), 400
        
        # Handle file upload
        if 'audio' in request.files:
            audio_file = request.files['audio']
            if not validate_audio_file(audio_file):
                return jsonify({'error': 'Invalid audio file format'}), 400
            
            # Save temporary file
            temp_path = None
            try:
                temp_dir = tempfile.mkdtemp()
                filename = secure_filename(audio_file.filename)
                temp_path = os.path.join(temp_dir, filename)
                audio_file.save(temp_path)
                
                # Transcribe
                result = transcription_service.transcribe_audio(temp_path)
                
            finally:
                # Cleanup
                if temp_path and os.path.exists(temp_path):
                    os.remove(temp_path)
                    os.rmdir(temp_dir)
        
        # Handle base64 audio
        else:
            data = request.get_json()
            audio_base64 = data.get('audio')
            
            if not audio_base64:
                return jsonify({'error': 'No audio data provided'}), 400
            
            # Decode and save temporary file
            audio_data = base64.b64decode(audio_base64)
            
            with tempfile.NamedTemporaryFile(suffix='.m4a', delete=False) as tmp_file:
                tmp_file.write(audio_data)
                temp_path = tmp_file.name
            
            try:
                # Transcribe
                result = transcription_service.transcribe_audio(temp_path)
            finally:
                # Cleanup
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        # Log for cost tracking
        if current_app.config['TRACK_API_COSTS']:
            logger.info(f"Transcription completed: {result.get('duration', 0)} seconds")
        
        return jsonify({
            'success': True,
            'text': result['text'],
            'duration': result.get('duration', 0),
            'cost_estimate': result.get('cost', 0)
        })
        
    except Exception as e:
        logger.error(f"Speech-to-text error: {str(e)}")
        return jsonify({'error': 'Failed to process audio'}), 500

@ai_bp.route('/generate-image', methods=['POST'])
@cross_origin()
@ai_rate_limit
def generate_image():
    """Generate AI image from dream description"""
    try:
        data = request.get_json()
        
        if not data or 'dream_text' not in data:
            return jsonify({'error': 'No dream text provided'}), 400
        
        dream_text = data['dream_text']
        if not validate_dream_text(dream_text):
            return jsonify({'error': 'Invalid dream text'}), 400
        
        # Get optional parameters
        style = data.get('style', 'ethereal')
        quality = data.get('quality', 'standard')
        character_images = data.get('character_images', [])
        
        # Generate image
        result = image_service.generate_dream_image(
            dream_text=dream_text,
            style=style,
            quality=quality,
            character_references=character_images
        )
        
        # Log for cost tracking
        if current_app.config['TRACK_API_COSTS']:
            logger.info(f"Image generated: {quality} quality, style: {style}")
        
        return jsonify({
            'success': True,
            'image_url': result['image_url'],
            'enhanced_prompt': result['enhanced_prompt'],
            'style': style,
            'quality': quality,
            'cost_estimate': result.get('cost', 0.04),
            'generation_time': result.get('generation_time', 0)
        })
        
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        return jsonify({'error': 'Failed to generate image'}), 500

@ai_bp.route('/analyze-dream', methods=['POST'])
@cross_origin()
@ai_rate_limit
def analyze_dream():
    """Analyze dream content using GPT-4"""
    try:
        data = request.get_json()
        
        if not data or 'dream_text' not in data:
            return jsonify({'error': 'No dream text provided'}), 400
        
        dream_text = data['dream_text']
        include_symbolism = data.get('include_symbolism', True)
        include_emotions = data.get('include_emotions', True)
        
        # Analyze dream
        result = openai_service.analyze_dream(
            dream_text=dream_text,
            include_symbolism=include_symbolism,
            include_emotions=include_emotions
        )
        
        return jsonify({
            'success': True,
            'analysis': result['analysis'],
            'tokens_used': result.get('tokens_used', 0),
            'cost_estimate': result.get('cost', 0)
        })
        
    except Exception as e:
        logger.error(f"Dream analysis error: {str(e)}")
        return jsonify({'error': 'Failed to analyze dream'}), 500

@ai_bp.route('/enhance-prompt', methods=['POST'])
@cross_origin()
def enhance_prompt():
    """Enhance dream description for better image generation"""
    try:
        data = request.get_json()
        
        if not data or 'dream_text' not in data:
            return jsonify({'error': 'No dream text provided'}), 400
        
        dream_text = data['dream_text']
        style = data.get('style', 'ethereal')
        enhancement_data = data.get('enhancement_data', {})
        
        # Enhance prompt
        enhanced = image_service.enhance_prompt(
            dream_text=dream_text,
            style=style,
            enhancement_data=enhancement_data
        )
        
        return jsonify({
            'success': True,
            'original_prompt': dream_text,
            'enhanced_prompt': enhanced,
            'style': style
        })
        
    except Exception as e:
        logger.error(f"Prompt enhancement error: {str(e)}")
        return jsonify({'error': 'Failed to enhance prompt'}), 500

@ai_bp.route('/costs', methods=['GET'])
@cross_origin()
def get_api_costs():
    """Return current API pricing information"""
    return jsonify({
        'speech_to_text': {
            'provider': 'OpenAI Whisper',
            'cost_per_minute': 0.006,
            'currency': 'USD',
            'notes': 'Billed per second'
        },
        'image_generation': {
            'provider': 'OpenAI DALL-E 3',
            'costs': {
                'standard_1024x1024': 0.040,
                'standard_1024x1792': 0.080,
                'hd_1024x1024': 0.080,
                'hd_1024x1792': 0.120
            },
            'currency': 'USD'
        },
        'text_processing': {
            'provider': 'OpenAI GPT-4',
            'model': 'gpt-4-1106-preview',
            'costs': {
                'input_per_1k_tokens': 0.01,
                'output_per_1k_tokens': 0.03
            },
            'currency': 'USD'
        },
        'last_updated': '2024-01-15'
    }) 