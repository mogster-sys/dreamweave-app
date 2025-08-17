from openai import OpenAI
import os
import logging
import json
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            logger.warning("OpenAI API key not configured")
        self.client = OpenAI(api_key=self.api_key)
        
    def analyze_dream(self, dream_text: str, include_symbolism: bool = True, 
                     include_emotions: bool = True) -> Dict[str, Any]:
        """Analyze dream content using GPT-4"""
        try:
            # Build analysis prompt
            system_prompt = """You are a thoughtful dream analyst. Analyze the dream and provide \
            insights in JSON format. Be encouraging and insightful, avoiding negative interpretations."""
            
            user_prompt = f"""Analyze this dream and provide insights:
            
            Dream: {dream_text}
            
            Provide a JSON response with:
            {{
                "mood": "The overall emotional tone",
                "themes": ["array", "of", "3-5", "main", "themes"],
                "symbols": ["array", "of", "key", "symbolic", "elements"],
                "interpretation": "A thoughtful 2-3 sentence interpretation",
                "emotional_tone": "Brief description of the emotional undertone",
                "personal_growth": "How this dream might relate to personal growth"
            }}"""
            
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                max_tokens=500,
                temperature=0.7
            )
            
            analysis = json.loads(response.choices[0].message.content)
            tokens_used = response.usage.total_tokens
            
            # Calculate cost (GPT-4 Turbo pricing)
            cost = (response.usage.prompt_tokens * 0.01 + 
                   response.usage.completion_tokens * 0.03) / 1000
            
            logger.info(f"Dream analysis completed: {tokens_used} tokens, ${cost:.4f}")
            
            return {
                'analysis': analysis,
                'tokens_used': tokens_used,
                'cost': cost
            }
            
        except Exception as e:
            logger.error(f"Dream analysis failed: {str(e)}")
            raise 