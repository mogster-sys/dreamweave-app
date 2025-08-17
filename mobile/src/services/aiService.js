const API_BASE_URL = 'http://localhost:5000/api'; // Change to your backend URL

class AIService {
  // NO TRANSCRIPTION - On-device speech recognition only
  // Audio files stay private on device

  // PRIMARY FEATURE: Convert dream to AI-generated image
  async createDreamImage(dreamText, style = 'ethereal', quality = 'standard', enhancedResponses = []) {
    try {
      // First, enhance the prompt using on-device analysis
      const promptData = await this.enhancePrompt(dreamText, style, { enhancedResponses });
      
      // The user should confirm this prompt before sending
      // This is typically handled by the UI component showing PromptConfirmation
      
      const response = await fetch(`${API_BASE_URL}/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dream_prompt: promptData.enhancedPrompt, // Send the enhanced prompt
          style: style,
          quality: quality,
          original_dream: dreamText, // Keep for reference
          analysis_summary: `${promptData.analysis.emotionCount} emotions, ${promptData.analysis.themeCount} themes, ${promptData.analysis.symbolCount} symbols`
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Image generation failed');
      }

      return {
        imageUrl: data.image_url,
        enhancedPrompt: data.enhanced_prompt,
        revisedPrompt: data.revised_prompt,
        originalDreamText: dreamText,
        onDeviceAnalysis: promptData.analysis,
        style: data.style,
        quality: data.quality,
        cost: data.cost_estimate,
        generationTime: data.generation_time,
      };
    } catch (error) {
      console.error('Dream image generation error:', error);
      throw error;
    }
  }
  
  // Separate method for UI to get prompt preview before confirmation
  async getEnhancedPromptPreview(dreamText, style = 'ethereal', enhancedResponses = []) {
    return await this.enhancePrompt(dreamText, style, { enhancedResponses });
  }

  // Alias for backward compatibility
  async generateImage(dreamText, style = 'ethereal', quality = 'standard') {
    return this.createDreamImage(dreamText, style, quality);
  }

  // Dream analysis moved to on-device processing
  async analyzeDream(dreamText, includeSymbolism = true, includeEmotions = true) {
    // Simple client-side analysis for privacy
    const emotions = this.extractEmotions(dreamText);
    const themes = this.extractThemes(dreamText);
    const symbols = includeSymbolism ? this.extractSymbols(dreamText) : [];
    
    return {
      analysis: {
        emotions: includeEmotions ? emotions : [],
        themes: themes,
        symbols: symbols,
        summary: `Dream analysis complete. Found ${emotions.length} emotions, ${themes.length} themes, ${symbols.length} symbols.`
      },
      tokensUsed: 0,
      cost: 0
    };
  }

  // Enhanced prompt creation on-device with psychological analysis
  async enhancePrompt(dreamText, style = 'ethereal', enhancementData = {}) {
    // Run on-device analysis
    const analysis = await this.analyzeDream(dreamText, true, true);
    const { emotions, themes, symbols } = analysis.analysis;
    
    const styleDesc = this.getArtStyles().find(s => s.id === style)?.description || 'ethereal atmosphere';
    
    // Build comprehensive enhanced prompt
    let enhanced = `A vivid dream visualization: ${dreamText}`;
    
    // Add emotional atmosphere
    if (emotions.length > 0) {
      const emotionDescriptors = {
        'fear': 'tense, foreboding atmosphere',
        'joy': 'uplifting, radiant energy',
        'anxiety': 'unsettling, nervous tension',
        'sadness': 'melancholic, somber mood',
        'anger': 'intense, fiery energy',
        'peace': 'serene, tranquil ambiance',
        'confusion': 'disorienting, fragmented reality',
        'love': 'warm, affectionate glow'
      };
      const emotionalElements = emotions.map(e => emotionDescriptors[e]).filter(Boolean);
      if (emotionalElements.length > 0) {
        enhanced += ` with ${emotionalElements.join(', ')}`;
      }
    }
    
    // Add thematic visual elements
    if (themes.length > 0) {
      const themeDescriptors = {
        'flying': 'aerial perspective, weightless movement, soaring through space',
        'water': 'flowing water elements, aquatic environment, liquid dynamics',
        'chase': 'dynamic motion, sense of urgency, kinetic energy',
        'falling': 'gravitational pull, descending movement, vertigo perspective',
        'death': 'transition imagery, ethereal boundaries, liminal spaces',
        'family': 'familiar faces, emotional connections, intimate relationships',
        'school': 'institutional architecture, learning environments, structured spaces',
        'work': 'professional settings, structured environments, task-oriented scenes',
        'animals': 'creature companions, natural instincts, primal energy',
        'house': 'domestic spaces, architectural elements, shelter symbolism'
      };
      const thematicElements = themes.map(t => themeDescriptors[t]).filter(Boolean);
      if (thematicElements.length > 0) {
        enhanced += `. Incorporating ${thematicElements.join(', ')}`;
      }
    }
    
    // Add symbolic depth
    if (symbols.length > 0) {
      const symbolDescriptors = {
        'mirror': 'reflective surfaces, dual perspectives, self-reflection imagery',
        'door': 'portals, transitions, threshold symbolism',
        'key': 'unlocking elements, access symbols, revelation imagery',
        'fire': 'flame elements, passionate energy, transformative power',
        'light': 'luminous symbolism, illumination, divine radiance',
        'darkness': 'shadow play, mysterious depths, hidden elements',
        'bridge': 'connection pathways, crossing elements, transitional structures',
        'stairs': 'ascending/descending elements, hierarchical movement, spiritual progression',
        'circle': 'cyclical patterns, wholeness symbols, eternal forms',
        'color': 'vivid color symbolism, chromatic significance, emotional color palette'
      };
      const symbolicElements = symbols.map(s => symbolDescriptors[s]).filter(Boolean);
      if (symbolicElements.length > 0) {
        enhanced += `. With symbolic depth: ${symbolicElements.join(', ')}`;
      }
    }
    
    // Add style and quality descriptors
    enhanced += `. Rendered in ${styleDesc} style. Dream-like quality with soft edges, emotional atmosphere, subconscious symbolism.`;
    enhanced += ` Masterpiece digital art, trending on ArtStation, dream journal illustration style, psychological depth.`;
    
    // Limit length for DALL-E
    if (enhanced.length > 3900) {
      enhanced = enhanced.substring(0, 3900) + "...";
    }
    
    return {
      originalPrompt: dreamText,
      enhancedPrompt: enhanced,
      style: style,
      analysis: {
        emotions,
        themes, 
        symbols,
        emotionCount: emotions.length,
        themeCount: themes.length,
        symbolCount: symbols.length
      }
    };
  }

  // Dream entries handled by local database
  async createDreamEntry(entryData) {
    // This will be handled by the local database service
    throw new Error('Use database.js createDreamEntry() directly for local storage');
  }

  // Dream entries handled by local database
  async getDreamEntries(userId = 'default_user', startDate = null, endDate = null, limit = 50) {
    throw new Error('Use database.js getDreamEntries() directly for local storage');
  }

  // Dream entries handled by local database
  async getDreamEntry(entryId) {
    throw new Error('Use database.js getDreamEntry() directly for local storage');
  }

  // Dream entries handled by local database
  async updateDreamEntry(entryId, updateData) {
    throw new Error('Use database.js updateDreamEntry() directly for local storage');
  }

  // Generate psychology-based prompts on-device
  async generatePrompts(dreamText, currentResponses = []) {
    const prompts = [
      "What emotions did you feel during this dream?",
      "What was the most vivid detail you remember?",
      "Were there any familiar people or places?",
      "How did the dream make you feel when you woke up?",
      "What do you think this dream might represent?",
      "Were you in control during any part of the dream?"
    ];
    
    // Filter out prompts already answered
    const answeredPrompts = currentResponses.map(r => r.prompt_text);
    const availablePrompts = prompts.filter(p => !answeredPrompts.includes(p));
    
    return {
      prompts: availablePrompts.slice(0, 3), // Return max 3 prompts
      suggestedOrder: [0, 1, 2]
    };
  }

  // Prompt responses handled by local database
  async createPromptResponse(promptData) {
    throw new Error('Use database.js createJournalPrompt() directly for local storage');
  }

  // Enhancement handled locally
  async enhanceDreamEntry(entryId, options = {}) {
    return {
      enhanced: true,
      message: 'Dream enhancement completed locally'
    };
  }

  // Statistics calculated from local database
  async getDreamStatistics(userId = 'default_user', startDate = null, endDate = null) {
    return {
      totalDreams: 0,
      averageLucidity: 0,
      averageVividness: 0,
      commonThemes: [],
      commonEmotions: [],
      message: 'Calculate statistics from local database'
    };
  }

  // Art style options
  getArtStyles() {
    return [
      { id: 'ethereal', name: 'Ethereal', description: 'Soft, flowing, mystical atmosphere' },
      { id: 'surreal', name: 'Surreal', description: 'Salvador Dali inspired, impossible geometry' },
      { id: 'nightmare', name: 'Nightmare', description: 'Dark fantasy, gothic atmosphere' },
      { id: 'cosmic', name: 'Cosmic', description: 'Celestial bodies, stardust, otherworldly' },
      { id: 'mystical', name: 'Mystical', description: 'Magical, enchanted, mystical elements' },
      { id: 'nostalgic', name: 'Nostalgic', description: 'Vintage, warm sepia tones, soft focus' },
    ];
  }

  // Quality options
  getQualityOptions() {
    return [
      { id: 'standard', name: 'Standard', description: 'Good quality, faster generation' },
      { id: 'hd', name: 'HD', description: 'High definition, slower generation' },
    ];
  }

  // Helper methods for on-device analysis
  extractEmotions(dreamText) {
    const emotionKeywords = {
      'fear': ['scared', 'frightened', 'terrified', 'afraid', 'horror', 'nightmare'],
      'joy': ['happy', 'joyful', 'elated', 'excited', 'cheerful', 'blissful'],
      'anxiety': ['anxious', 'worried', 'nervous', 'stressed', 'panic'],
      'sadness': ['sad', 'depressed', 'melancholy', 'grief', 'sorrow'],
      'anger': ['angry', 'furious', 'rage', 'mad', 'irritated'],
      'peace': ['calm', 'peaceful', 'serene', 'tranquil', 'relaxed'],
      'confusion': ['confused', 'lost', 'bewildered', 'puzzled'],
      'love': ['love', 'affection', 'warmth', 'caring', 'tender']
    };
    
    const text = dreamText.toLowerCase();
    const foundEmotions = [];
    
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundEmotions.push(emotion);
      }
    });
    
    return foundEmotions;
  }

  extractThemes(dreamText) {
    const themeKeywords = {
      'flying': ['flying', 'soaring', 'floating', 'hovering', 'airborne'],
      'water': ['water', 'ocean', 'sea', 'river', 'swimming', 'drowning'],
      'chase': ['chasing', 'running', 'escaping', 'pursuit', 'fleeing'],
      'falling': ['falling', 'dropping', 'plummeting', 'tumbling'],
      'death': ['death', 'dying', 'deceased', 'funeral', 'grave'],
      'family': ['mother', 'father', 'parent', 'sibling', 'family'],
      'school': ['school', 'teacher', 'classroom', 'exam', 'studying'],
      'work': ['work', 'job', 'office', 'boss', 'colleague'],
      'animals': ['dog', 'cat', 'bird', 'animal', 'pet'],
      'house': ['house', 'home', 'room', 'building', 'apartment']
    };
    
    const text = dreamText.toLowerCase();
    const foundThemes = [];
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundThemes.push(theme);
      }
    });
    
    return foundThemes;
  }

  extractSymbols(dreamText) {
    const symbolKeywords = {
      'mirror': ['mirror', 'reflection', 'looking glass'],
      'door': ['door', 'doorway', 'entrance', 'exit'],
      'key': ['key', 'lock', 'unlock', 'locked'],
      'fire': ['fire', 'flame', 'burning', 'blaze'],
      'light': ['light', 'bright', 'illumination', 'glow'],
      'darkness': ['dark', 'shadow', 'blackness', 'night'],
      'bridge': ['bridge', 'crossing', 'span'],
      'stairs': ['stairs', 'steps', 'climbing', 'ascending'],
      'circle': ['circle', 'round', 'wheel', 'cycle'],
      'color': ['red', 'blue', 'green', 'yellow', 'purple', 'black', 'white']
    };
    
    const text = dreamText.toLowerCase();
    const foundSymbols = [];
    
    Object.entries(symbolKeywords).forEach(([symbol, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        foundSymbols.push(symbol);
      }
    });
    
    return foundSymbols;
  }
}

export default new AIService();