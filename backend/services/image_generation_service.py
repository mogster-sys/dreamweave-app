from openai import OpenAI
import os
import logging
from typing import Dict, Any, List, Optional
import time

logger = logging.getLogger(__name__)

class ImageGenerationService:
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.client = OpenAI(api_key=self.api_key)
        
        # Style configurations
        self.style_prompts = {
            'ethereal': 'ethereal dreamscape, soft flowing forms, gossamer textures, opalescent colors, mystical atmosphere',
            'surreal': 'surrealist masterpiece, impossible geometry, melting reality, vivid contrasts, Salvador Dali inspired',
            'nightmare': 'dark fantasy art, gothic atmosphere, shadowy forms, psychological horror elements, unsettling beauty',
            'cosmic': 'cosmic dreamscape, celestial bodies, nebulae, stardust, infinite space, otherworldly',
            'nostalgic': 'nostalgic dreamscape, faded memories, vintage film aesthetic, warm sepia tones, soft focus',
            'vibrant': 'vibrant dream world, bold colors, dynamic energy, psychedelic elements, explosive creativity'
        }
        
    def generate_dream_image(self, dream_text: str, style: str = 'ethereal', 
                           quality: str = 'standard', 
                           character_references: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Generate AI image from dream description"""
        try:
            start_time = time.time()
            
            # Enhance prompt
            enhanced_prompt = self.enhance_prompt(dream_text, style, {
                'character_references': character_references
            })
            
            # Determine size based on quality
            size = "1024x1024"  # Default for standard
            if quality == "hd":
                size = "1024x1024"  # HD at same size costs more
            
            # Generate image
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=enhanced_prompt,
                n=1,
                size=size,
                quality=quality,
                style="vivid"  # or "natural"
            )
            
            image_url = response.data[0].url
            revised_prompt = response.data[0].revised_prompt or enhanced_prompt
            
            # Calculate cost
            cost_map = {
                ('standard', '1024x1024'): 0.040,
                ('standard', '1024x1792'): 0.080,
                ('standard', '1792x1024'): 0.080,
                ('hd', '1024x1024'): 0.080,
                ('hd', '1024x1792'): 0.120,
                ('hd', '1792x1024'): 0.120,
            }
            cost = cost_map.get((quality, size), 0.040)
            
            generation_time = time.time() - start_time
            
            logger.info(f"Image generated: {quality} {size}, ${cost:.3f}, {generation_time:.2f}s")
            
            return {
                'image_url': image_url,
                'enhanced_prompt': enhanced_prompt,
                'revised_prompt': revised_prompt,
                'cost': cost,
                'generation_time': generation_time
            }
            
        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}")
            raise
    
    def enhance_prompt(self, dream_text: str, style: str = 'ethereal', 
                      enhancement_data: Optional[Dict] = None) -> str:
        """Enhance dream prompt for better image generation"""
        
        # Get base style
        style_base = self.style_prompts.get(style, self.style_prompts['ethereal'])
        
        # Build enhanced prompt
        enhanced = f"{style_base}. {dream_text}"
        
        # Add MTG card art style
        enhanced += ". In the style of Magic: The Gathering card art, highly detailed fantasy illustration"
        
        # Add character references if provided
        if enhancement_data and enhancement_data.get('character_references'):
            enhanced += ". Include character based on provided reference with dreamlike alterations"
        
        # Add quality modifiers
        enhanced += ". Masterpiece quality, trending on artstation, 8k resolution, photorealistic details"
        
        # Limit length (DALL-E has a 4000 character limit)
        if len(enhanced) > 3900:
            enhanced = enhanced[:3900] + "..."
        
        return enhanced 