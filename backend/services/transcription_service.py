from openai import OpenAI
import os
import logging
from typing import Dict, Any
import librosa

logger = logging.getLogger(__name__)

class TranscriptionService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.client = OpenAI(api_key=self.api_key)
        
    def transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """Transcribe audio using OpenAI Whisper"""
        try:
            # Get audio duration for cost calculation
            duration = self.get_audio_duration(audio_path)
            
            # Open and transcribe audio file
            with open(audio_path, 'rb') as audio_file:
                response = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="json",
                    language="en"  # Remove if you want auto-detection
                )
            
            text = response.text
            
            # Calculate cost ($0.006 per minute)
            cost = (duration / 60) * 0.006
            
            logger.info(f"Transcription completed: {duration}s audio, ${cost:.4f}")
            
            return {
                'text': text,
                'duration': duration,
                'cost': cost
            }
            
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            raise
    
    def get_audio_duration(self, audio_path: str) -> float:
        """Get audio file duration in seconds"""
        try:
            y, sr = librosa.load(audio_path, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)
            return duration
        except:
            # Fallback: estimate 60 seconds if can't determine
            return 60.0 