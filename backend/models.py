from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import json

db = SQLAlchemy()

class DreamEntry(db.Model):
    __tablename__ = 'dream_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    entry_date = db.Column(db.Date, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Original audio and transcription
    audio_file_path = db.Column(db.String(512))
    original_transcription = db.Column(db.Text)
    
    # Enhanced dream content
    enhanced_description = db.Column(db.Text)
    dream_title = db.Column(db.String(255))
    
    # Dream analysis
    emotions = db.Column(db.Text)  # JSON array
    themes = db.Column(db.Text)   # JSON array
    symbols = db.Column(db.Text)  # JSON array
    lucidity_level = db.Column(db.Integer, default=0)  # 0-5 scale
    vividness_level = db.Column(db.Integer, default=0)  # 0-5 scale
    
    # AI Art Generation
    ai_prompt = db.Column(db.Text)
    art_style = db.Column(db.String(50))  # ethereal, surreal, nightmare, cosmic, mystical, nostalgic
    image_url = db.Column(db.String(512))
    
    # Dream card data
    card_design = db.Column(db.Text)  # JSON for MTG-style card layout
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'audio_file_path': self.audio_file_path,
            'original_transcription': self.original_transcription,
            'enhanced_description': self.enhanced_description,
            'dream_title': self.dream_title,
            'emotions': json.loads(self.emotions) if self.emotions else [],
            'themes': json.loads(self.themes) if self.themes else [],
            'symbols': json.loads(self.symbols) if self.symbols else [],
            'lucidity_level': self.lucidity_level,
            'vividness_level': self.vividness_level,
            'ai_prompt': self.ai_prompt,
            'art_style': self.art_style,
            'image_url': self.image_url,
            'card_design': json.loads(self.card_design) if self.card_design else None
        }

class JournalPrompt(db.Model):
    __tablename__ = 'journal_prompts'
    
    id = db.Column(db.Integer, primary_key=True)
    dream_entry_id = db.Column(db.Integer, db.ForeignKey('dream_entries.id'), nullable=False)
    prompt_text = db.Column(db.Text, nullable=False)
    response_audio_path = db.Column(db.String(512))
    response_transcription = db.Column(db.Text)
    prompt_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    dream_entry = db.relationship('DreamEntry', backref='prompts')
    
    def to_dict(self):
        return {
            'id': self.id,
            'dream_entry_id': self.dream_entry_id,
            'prompt_text': self.prompt_text,
            'response_audio_path': self.response_audio_path,
            'response_transcription': self.response_transcription,
            'prompt_order': self.prompt_order,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserCharacter(db.Model):
    __tablename__ = 'user_characters'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    character_name = db.Column(db.String(255), nullable=False)
    character_description = db.Column(db.Text)
    character_image_url = db.Column(db.String(512))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'character_name': self.character_name,
            'character_description': self.character_description,
            'character_image_url': self.character_image_url,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DreamArchive(db.Model):
    __tablename__ = 'dream_archives'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(255), nullable=False, index=True)
    archive_name = db.Column(db.String(255), nullable=False)
    date_range_start = db.Column(db.Date, nullable=False)
    date_range_end = db.Column(db.Date, nullable=False)
    archive_format = db.Column(db.String(50), nullable=False)  # json, html, pdf
    file_path = db.Column(db.String(512))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'archive_name': self.archive_name,
            'date_range_start': self.date_range_start.isoformat() if self.date_range_start else None,
            'date_range_end': self.date_range_end.isoformat() if self.date_range_end else None,
            'archive_format': self.archive_format,
            'file_path': self.file_path,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }