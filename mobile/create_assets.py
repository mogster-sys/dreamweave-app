#!/usr/bin/env python3
"""Create placeholder assets for DreamWeave mobile app"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create assets directory
os.makedirs('assets', exist_ok=True)

# Create a simple icon
def create_icon(size, filename):
    # Create image with dark background
    img = Image.new('RGB', (size, size), '#1a1a2e')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple moon symbol for DreamWeave
    center = size // 2
    radius = size // 3
    
    # Draw crescent moon shape
    draw.ellipse([center-radius, center-radius, center+radius, center+radius], 
                fill='#ffffff')
    draw.ellipse([center-radius+20, center-radius-20, center+radius+20, center+radius-20], 
                fill='#1a1a2e')
    
    img.save(f'assets/{filename}')
    print(f"Created {filename}")

# Create all required icons
create_icon(1024, 'icon.png')
create_icon(1024, 'adaptive-icon.png')
create_icon(1024, 'splash-icon.png')
create_icon(64, 'favicon.png')

print("All assets created successfully!")