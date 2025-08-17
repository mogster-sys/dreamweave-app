// Dream Enhancement Prompts - Psychology-based questions to enhance dream recall
export const ENHANCEMENT_PROMPTS = {
  initial: [
    "What was the first thing you remember from your dream?",
    "How did the dream begin - were you already in the scene or did you enter it?",
    "What was your immediate feeling when the dream started?"
  ],
  
  emotions: [
    "What emotions did you experience most strongly during the dream?",
    "Did your feelings change throughout the dream?",
    "How did you feel when you woke up from this dream?",
    "Were there any surprising emotional reactions in the dream?"
  ],
  
  characters: [
    "Did you see any people in your dream?",
    "Who else was in your dream - friends, family, strangers?",
    "How did you interact with other people in the dream?",
    "Did anyone in the dream feel familiar or completely unknown?",
    "Were there any famous people or fictional characters?"
  ],
  
  environment: [
    "Where did your dream take place?",
    "Describe the setting or location in more detail",
    "Did the environment change during the dream?",
    "What stood out most about the place you were in?",
    "Were you indoors, outdoors, or somewhere unusual?"
  ],
  
  sensory: [
    "What colors do you remember most vividly?",
    "Did you hear any specific sounds or music?",
    "Were there any particular smells or tastes?",
    "How did things feel to the touch in your dream?",
    "Was the lighting bright, dim, or changing?"
  ],
  
  symbols: [
    "What objects seemed important or stood out to you?",
    "Did anything unusual or impossible happen?",
    "Were there any symbols or recurring elements?",
    "What felt most significant about this dream?",
    "Did anything remind you of your waking life?"
  ]
};

// Prompt flow logic - determines which questions to ask based on dream content
export const getAdaptivePrompts = (dreamText, alreadyAsked = []) => {
  const askedCategories = new Set(alreadyAsked.map(q => q.category));
  const availableCategories = [];
  
  // Always start with emotions if not asked
  if (!askedCategories.has('emotions')) {
    availableCategories.push('emotions');
  }
  
  // Check for people mentions
  const hasPeople = /\b(person|people|someone|man|woman|friend|family|he|she|they|we)\b/i.test(dreamText);
  if (hasPeople && !askedCategories.has('characters')) {
    availableCategories.push('characters');
  }
  
  // Check for sensory details
  const hasSensory = /\b(color|sound|music|bright|dark|loud|quiet|smell|taste)\b/i.test(dreamText);
  if (hasSensory && !askedCategories.has('sensory')) {
    availableCategories.push('sensory');
  }
  
  // Environment if location mentioned
  const hasLocation = /\b(room|house|outside|building|street|forest|water|sky)\b/i.test(dreamText);
  if (hasLocation && !askedCategories.has('environment')) {
    availableCategories.push('environment');
  }
  
  // Symbols for deeper meaning
  if (!askedCategories.has('symbols')) {
    availableCategories.push('symbols');
  }
  
  // Return up to 3 questions from different categories
  const selectedPrompts = [];
  availableCategories.slice(0, 3).forEach(category => {
    const categoryPrompts = ENHANCEMENT_PROMPTS[category];
    if (categoryPrompts && categoryPrompts.length > 0) {
      selectedPrompts.push({
        category,
        prompt: categoryPrompts[0], // Take first prompt from category
        alternatives: categoryPrompts.slice(1) // Provide alternatives
      });
    }
  });
  
  return selectedPrompts;
};

// Character detection patterns
export const CHARACTER_DETECTION = {
  patterns: [
    /\b(person|people|someone|anybody|everyone)\b/i,
    /\b(man|woman|boy|girl|child|adult)\b/i,
    /\b(friend|family|mother|father|sister|brother|parent)\b/i,
    /\b(he|she|they|him|her|them)\b/i,
    /\b(teacher|doctor|stranger|neighbor|boss|colleague)\b/i,
    /\b(celebrity|actor|singer|famous)\b/i
  ],
  
  questions: [
    "I noticed you mentioned people in your dream. Would you like to add photos of anyone who appeared?",
    "You can upload up to 2 photos of people from your dream to make the artwork more personal.",
    "Adding character photos helps create more accurate dream visualizations."
  ]
};

export default {
  ENHANCEMENT_PROMPTS,
  getAdaptivePrompts,
  CHARACTER_DETECTION
};