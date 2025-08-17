import os
import json
from datetime import datetime, date
from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
from sqlalchemy import desc, and_
import logging

from models import db, DreamEntry, JournalPrompt, UserCharacter
from services.openai_service import OpenAIService
from services.transcription_service import TranscriptionService
from services.image_generation_service import ImageGenerationService
from utils.validators import validate_audio_file, validate_dream_text

logger = logging.getLogger(__name__)

dream_bp = Blueprint('dream', __name__)

# Initialize services
openai_service = OpenAIService()
transcription_service = TranscriptionService()
image_service = ImageGenerationService()

# Dream prompt trees based on psychology
PROMPT_TREES = {
    'initial': [
        "What was the first thing you remember from your dream?",
        "How were you feeling at the start of the dream?",
        "Where did the dream take place?"
    ],
    'emotions': [
        "What emotions did you experience most strongly?",
        "Did the emotional tone change during the dream?",
        "How did you feel when you woke up?"
    ],
    'characters': [
        "Who else was in your dream?",
        "How did you interact with other dream characters?",
        "Did anyone feel familiar or unfamiliar?"
    ],
    'environment': [
        "Describe the setting in more detail",
        "Did the environment change throughout the dream?",
        "What stood out most about the place?"
    ],
    'symbols': [
        "What objects or symbols seemed important?",
        "Did anything unusual or impossible happen?",
        "What felt most significant about the dream?"
    ]
}

@dream_bp.route('/entries', methods=['GET'])
@cross_origin()
def get_dream_entries():
    """Get dream entries for a user with date filtering"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        limit = int(request.args.get('limit', 50))
        
        query = DreamEntry.query.filter_by(user_id=user_id)
        
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(DreamEntry.entry_date >= start)
        
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(DreamEntry.entry_date <= end)
        
        entries = query.order_by(desc(DreamEntry.entry_date)).limit(limit).all()
        
        return jsonify({
            'success': True,
            'entries': [entry.to_dict() for entry in entries],
            'total': len(entries)
        })
        
    except Exception as e:
        logger.error(f"Error fetching dream entries: {str(e)}")
        return jsonify({'error': 'Failed to fetch dream entries'}), 500

@dream_bp.route('/entries', methods=['POST'])
@cross_origin()
def create_dream_entry():
    """Create a new dream entry"""
    try:
        data = request.get_json()
        
        user_id = data.get('user_id', 'default_user')
        entry_date = datetime.strptime(data.get('entry_date', date.today().isoformat()), '%Y-%m-%d').date()
        
        # Create new dream entry
        dream_entry = DreamEntry(
            user_id=user_id,
            entry_date=entry_date,
            original_transcription=data.get('original_transcription', ''),
            enhanced_description=data.get('enhanced_description', ''),
            dream_title=data.get('dream_title', ''),
            emotions=json.dumps(data.get('emotions', [])),
            themes=json.dumps(data.get('themes', [])),
            symbols=json.dumps(data.get('symbols', [])),
            lucidity_level=data.get('lucidity_level', 0),
            vividness_level=data.get('vividness_level', 0),
            ai_prompt=data.get('ai_prompt', ''),
            art_style=data.get('art_style', 'ethereal'),
            image_url=data.get('image_url', ''),
            card_design=json.dumps(data.get('card_design', {}))
        )
        
        db.session.add(dream_entry)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'entry': dream_entry.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating dream entry: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create dream entry'}), 500

@dream_bp.route('/entries/<int:entry_id>', methods=['GET'])
@cross_origin()
def get_dream_entry(entry_id):
    """Get a specific dream entry with prompts"""
    try:
        entry = DreamEntry.query.get_or_404(entry_id)
        
        # Get associated prompts
        prompts = JournalPrompt.query.filter_by(dream_entry_id=entry_id).order_by(JournalPrompt.prompt_order).all()
        
        entry_data = entry.to_dict()
        entry_data['prompts'] = [prompt.to_dict() for prompt in prompts]
        
        return jsonify({
            'success': True,
            'entry': entry_data
        })
        
    except Exception as e:
        logger.error(f"Error fetching dream entry: {str(e)}")
        return jsonify({'error': 'Dream entry not found'}), 404

@dream_bp.route('/entries/<int:entry_id>', methods=['PUT'])
@cross_origin()
def update_dream_entry(entry_id):
    """Update a dream entry"""
    try:
        entry = DreamEntry.query.get_or_404(entry_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'enhanced_description' in data:
            entry.enhanced_description = data['enhanced_description']
        if 'dream_title' in data:
            entry.dream_title = data['dream_title']
        if 'emotions' in data:
            entry.emotions = json.dumps(data['emotions'])
        if 'themes' in data:
            entry.themes = json.dumps(data['themes'])
        if 'symbols' in data:
            entry.symbols = json.dumps(data['symbols'])
        if 'lucidity_level' in data:
            entry.lucidity_level = data['lucidity_level']
        if 'vividness_level' in data:
            entry.vividness_level = data['vividness_level']
        if 'ai_prompt' in data:
            entry.ai_prompt = data['ai_prompt']
        if 'art_style' in data:
            entry.art_style = data['art_style']
        if 'image_url' in data:
            entry.image_url = data['image_url']
        if 'card_design' in data:
            entry.card_design = json.dumps(data['card_design'])
        
        entry.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'entry': entry.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error updating dream entry: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update dream entry'}), 500

@dream_bp.route('/prompts/generate', methods=['POST'])
@cross_origin()
def generate_prompts():
    """Generate psychology-based follow-up prompts"""
    try:
        data = request.get_json()
        dream_text = data.get('dream_text', '')
        current_responses = data.get('current_responses', [])
        
        # Simple prompt selection based on what's been asked
        asked_categories = set()
        for response in current_responses:
            # Simple keyword matching to categorize previous prompts
            prompt_text = response.get('prompt_text', '').lower()
            if any(word in prompt_text for word in ['feel', 'emotion', 'feeling']):
                asked_categories.add('emotions')
            elif any(word in prompt_text for word in ['who', 'character', 'person']):
                asked_categories.add('characters')
            elif any(word in prompt_text for word in ['where', 'place', 'setting']):
                asked_categories.add('environment')
            elif any(word in prompt_text for word in ['symbol', 'object', 'important']):
                asked_categories.add('symbols')
        
        # Generate prompts from unasked categories
        available_categories = set(PROMPT_TREES.keys()) - asked_categories
        if not available_categories:
            available_categories = {'symbols'}  # Default to symbols for deeper exploration
        
        prompts = []
        for category in available_categories:
            if len(prompts) < 3:  # Limit to 3 prompts
                category_prompts = PROMPT_TREES[category]
                prompts.extend(category_prompts[:1])  # Take first prompt from each category
        
        return jsonify({
            'success': True,
            'prompts': prompts[:3],  # Maximum 3 prompts
            'suggested_order': list(range(len(prompts[:3])))
        })
        
    except Exception as e:
        logger.error(f"Error generating prompts: {str(e)}")
        return jsonify({'error': 'Failed to generate prompts'}), 500

@dream_bp.route('/prompts', methods=['POST'])
@cross_origin()
def create_prompt_response():
    """Create a response to a dream journal prompt"""
    try:
        data = request.get_json()
        
        dream_entry_id = data.get('dream_entry_id')
        prompt_text = data.get('prompt_text')
        response_transcription = data.get('response_transcription', '')
        prompt_order = data.get('prompt_order', 0)
        
        if not dream_entry_id or not prompt_text:
            return jsonify({'error': 'dream_entry_id and prompt_text required'}), 400
        
        # Create prompt response
        prompt_response = JournalPrompt(
            dream_entry_id=dream_entry_id,
            prompt_text=prompt_text,
            response_transcription=response_transcription,
            prompt_order=prompt_order
        )
        
        db.session.add(prompt_response)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'prompt': prompt_response.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating prompt response: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create prompt response'}), 500

@dream_bp.route('/cards/<int:entry_id>', methods=['POST'])
@cross_origin()
def generate_dream_card():
    """Generate MTG-style dream card design"""
    try:
        entry = DreamEntry.query.get_or_404(entry_id)
        
        # Create card design based on dream content
        card_design = {
            'name': entry.dream_title or f"Dream from {entry.entry_date}",
            'mana_cost': '',  # Could be based on complexity
            'type': 'Enchantment — Dream',
            'rarity': 'rare',
            'power_toughness': '',
            'description': entry.enhanced_description[:200] + '...' if len(entry.enhanced_description) > 200 else entry.enhanced_description,
            'flavor_text': 'Dreams are the playground of the subconscious mind.',
            'artist': 'AI Generated',
            'set_symbol': 'DW',
            'background_style': entry.art_style or 'ethereal',
            'border_color': 'purple',
            'text_color': 'white'
        }
        
        # Update entry with card design
        entry.card_design = json.dumps(card_design)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'card_design': card_design
        })
        
    except Exception as e:
        logger.error(f"Error generating dream card: {str(e)}")
        return jsonify({'error': 'Failed to generate dream card'}), 500

@dream_bp.route('/entries/<int:entry_id>/enhance', methods=['POST'])
@cross_origin()
def enhance_dream_entry():
    """Enhance a dream entry using AI analysis and image generation"""
    try:
        entry = DreamEntry.query.get_or_404(entry_id)
        data = request.get_json()
        
        generate_image = data.get('generate_image', False)
        analyze_content = data.get('analyze_content', False)
        art_style = data.get('art_style', 'ethereal')
        
        results = {}
        
        # Analyze dream content
        if analyze_content and entry.enhanced_description:
            try:
                analysis = openai_service.analyze_dream(entry.enhanced_description)
                analysis_data = analysis['analysis']
                
                # Update entry with analysis
                entry.emotions = json.dumps(analysis_data.get('themes', []))
                entry.themes = json.dumps(analysis_data.get('themes', []))
                entry.symbols = json.dumps(analysis_data.get('symbols', []))
                
                results['analysis'] = analysis_data
                
            except Exception as e:
                logger.warning(f"Dream analysis failed: {str(e)}")
                results['analysis_error'] = str(e)
        
        # Generate AI image
        if generate_image and entry.enhanced_description:
            try:
                image_result = image_service.generate_dream_image(
                    dream_text=entry.enhanced_description,
                    style=art_style,
                    quality='standard'
                )
                
                # Update entry with image
                entry.image_url = image_result['image_url']
                entry.ai_prompt = image_result['enhanced_prompt']
                entry.art_style = art_style
                
                results['image'] = {
                    'url': image_result['image_url'],
                    'prompt': image_result['enhanced_prompt'],
                    'style': art_style
                }
                
            except Exception as e:
                logger.warning(f"Image generation failed: {str(e)}")
                results['image_error'] = str(e)
        
        # Save changes
        entry.updated_at = datetime.utcnow()
        db.session.commit()
        
        results['entry'] = entry.to_dict()
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Error enhancing dream entry: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to enhance dream entry'}), 500

@dream_bp.route('/statistics/<user_id>', methods=['GET'])
@cross_origin()
def get_dream_statistics(user_id):
    """Get dream journal statistics for a user"""
    try:
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        query = DreamEntry.query.filter_by(user_id=user_id)
        
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(DreamEntry.entry_date >= start)
        
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(DreamEntry.entry_date <= end)
        
        entries = query.all()
        
        # Calculate statistics
        total_dreams = len(entries)
        avg_lucidity = sum(e.lucidity_level for e in entries) / total_dreams if total_dreams > 0 else 0
        avg_vividness = sum(e.vividness_level for e in entries) / total_dreams if total_dreams > 0 else 0
        
        # Most common themes and emotions
        all_themes = []
        all_emotions = []
        all_symbols = []
        
        for entry in entries:
            if entry.themes:
                all_themes.extend(json.loads(entry.themes))
            if entry.emotions:
                all_emotions.extend(json.loads(entry.emotions))
            if entry.symbols:
                all_symbols.extend(json.loads(entry.symbols))
        
        # Count occurrences
        from collections import Counter
        theme_counts = Counter(all_themes)
        emotion_counts = Counter(all_emotions)
        symbol_counts = Counter(all_symbols)
        
        return jsonify({
            'success': True,
            'statistics': {
                'total_dreams': total_dreams,
                'average_lucidity': round(avg_lucidity, 2),
                'average_vividness': round(avg_vividness, 2),
                'most_common_themes': theme_counts.most_common(5),
                'most_common_emotions': emotion_counts.most_common(5),
                'most_common_symbols': symbol_counts.most_common(5),
                'dreams_with_images': sum(1 for e in entries if e.image_url),
                'date_range': {
                    'start': start_date or 'all_time',
                    'end': end_date or 'present'
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error calculating statistics: {str(e)}")
        return jsonify({'error': 'Failed to calculate statistics'}), 500