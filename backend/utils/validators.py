import os
from werkzeug.datastructures import FileStorage
from typing import Optional

ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg'}
MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25MB
MAX_DREAM_TEXT_LENGTH = 5000

def validate_audio_file(file: FileStorage) -> bool:
    """Validate uploaded audio file"""
    if not file:
        return False
    
    # Check filename
    filename = file.filename
    if not filename:
        return False
    
    # Check extension
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        return False
    
    # Check file size (if possible)
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)  # Reset to beginning
    
    if size > MAX_AUDIO_SIZE:
        return False
    
    return True

def validate_dream_text(text: str) -> bool:
    """Validate dream text input"""
    if not text or not isinstance(text, str):
        return False
    
    # Check length
    if len(text) > MAX_DREAM_TEXT_LENGTH:
        return False
    
    # Check if it's not just whitespace
    if not text.strip():
        return False
    
    return True

def validate_image_params(style: str, quality: str) -> tuple[str, str]:
    """Validate and sanitize image generation parameters"""
    valid_styles = ['ethereal', 'surreal', 'nightmare', 'cosmic', 'nostalgic', 'vibrant']
    valid_qualities = ['standard', 'hd']
    
    style = style if style in valid_styles else 'ethereal'
    quality = quality if quality in valid_qualities else 'standard'
    
    return style, quality 