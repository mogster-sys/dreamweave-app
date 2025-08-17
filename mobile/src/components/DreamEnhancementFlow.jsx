import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import VoiceResponseRecorder from './VoiceResponseRecorder';
import CharacterImageHandler from './CharacterImageHandler';
import { getAdaptivePrompts, CHARACTER_DETECTION } from '../constants/prompts';

export default function DreamEnhancementFlow({ 
  dreamText, 
  onComplete, 
  onSkip 
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [showCharacterUpload, setShowCharacterUpload] = useState(false);
  const [characterImages, setCharacterImages] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Generate adaptive questions based on dream content
    const adaptiveQuestions = getAdaptivePrompts(dreamText, []);
    setQuestions(adaptiveQuestions);
    
    // Check if dream mentions people for character upload
    const mentionsPeople = CHARACTER_DETECTION.patterns.some(pattern => 
      pattern.test(dreamText)
    );
    setShowCharacterUpload(mentionsPeople);
  }, [dreamText]);

  const handleVoiceResponse = (responseData) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newResponse = {
      questionId: currentQuestion.category,
      questionText: currentQuestion.prompt,
      responseText: responseData.text,
      responseAudio: responseData.audioUri,
      timestamp: new Date().toISOString()
    };

    setResponses(prev => [...prev, newResponse]);
    
    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeFlow();
    }
  };

  const handleSkipQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeFlow();
    }
  };

  const handleCharacterImages = (images) => {
    setCharacterImages(images);
  };

  const completeFlow = () => {
    setIsComplete(true);
    
    // Compile all enhancement data
    const enhancementData = {
      originalDream: dreamText,
      responses: responses,
      characterImages: characterImages,
      enhancementSummary: generateEnhancementSummary(),
      completedAt: new Date().toISOString()
    };

    onComplete?.(enhancementData);
  };

  const generateEnhancementSummary = () => {
    let summary = dreamText;
    
    responses.forEach(response => {
      if (response.responseText && response.responseText.trim()) {
        summary += ` ${response.responseText}`;
      }
    });
    
    return summary;
  };

  const progress = questions.length > 0 ? (currentQuestionIndex + 1) / questions.length : 0;

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.loadingText}>Preparing enhancement questions...</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (isComplete) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" style={styles.completeIcon} />
            <Text style={styles.completeTitle}>Dream Enhancement Complete!</Text>
            <Text style={styles.completeText}>
              Your dream has been enriched with {responses.length} additional details
              {characterImages.length > 0 && ` and ${characterImages.length} character image(s)`}.
            </Text>
            <Button
              mode="contained"
              onPress={() => onComplete?.()}
              style={styles.button}
            >
              Continue to Image Generation
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <ProgressBar 
          progress={progress} 
          color="#7c3aed" 
          style={styles.progressBar}
        />
      </View>

      {/* Current Question Card */}
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.questionHeader}>
            <Ionicons name="help-circle" size={24} color="#a78bfa" />
            <Text style={styles.questionCategory}>
              {currentQuestion.category.charAt(0).toUpperCase() + currentQuestion.category.slice(1)}
            </Text>
          </View>
          
          <Text style={styles.questionText}>
            {currentQuestion.prompt}
          </Text>

          {/* Voice Response Recorder */}
          <VoiceResponseRecorder
            questionId={currentQuestion.category}
            onRecordingComplete={handleVoiceResponse}
            style={styles.voiceRecorder}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={handleSkipQuestion}
              style={[styles.button, styles.skipButton]}
              labelStyle={styles.skipButtonText}
            >
              Skip Question
            </Button>
          </View>

          {/* Alternative Questions */}
          {currentQuestion.alternatives && currentQuestion.alternatives.length > 0 && (
            <View style={styles.alternativesContainer}>
              <Text style={styles.alternativesTitle}>Or try these instead:</Text>
              {currentQuestion.alternatives.slice(0, 2).map((alt, index) => (
                <Text key={index} style={styles.alternativeText}>
                  " {alt}
                </Text>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Character Image Upload (shown after first question if people detected) */}
      {showCharacterUpload && currentQuestionIndex === 1 && (
        <Card style={[styles.card, styles.characterCard]}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.characterTitle}>
              Add Character Photos (Optional)
            </Text>
            <Text style={styles.characterSubtext}>
              I noticed you mentioned people in your dream. Adding photos can make the AI artwork more personal.
            </Text>
            
            <CharacterImageHandler
              onImagesSelected={handleCharacterImages}
              maxImages={2}
            />
          </Card.Content>
        </Card>
      )}

      {/* Skip All Button */}
      <View style={styles.skipAllContainer}>
        <Button
          mode="text"
          onPress={() => onSkip?.()}
          labelStyle={styles.skipAllText}
        >
          Skip All Questions
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    padding: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    color: '#e5e7eb',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2d1b69',
  },
  card: {
    backgroundColor: '#1a1b3a',
    marginBottom: 16,
    borderRadius: 16,
  },
  cardContent: {
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
    marginLeft: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#e5e7eb',
    lineHeight: 26,
    marginBottom: 24,
    fontWeight: '500',
  },
  voiceRecorder: {
    marginVertical: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  button: {
    borderRadius: 8,
  },
  skipButton: {
    borderColor: '#6b7280',
  },
  skipButtonText: {
    color: '#9ca3af',
  },
  alternativesContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#2d1b69',
    borderRadius: 8,
  },
  alternativesTitle: {
    fontSize: 14,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 8,
  },
  alternativeText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
    lineHeight: 20,
  },
  characterCard: {
    borderColor: '#7c3aed',
    borderWidth: 1,
  },
  characterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 8,
  },
  characterSubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 16,
    lineHeight: 20,
  },
  skipAllContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  skipAllText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loadingText: {
    color: '#e5e7eb',
    fontSize: 16,
    textAlign: 'center',
  },
  completeIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 12,
  },
  completeText: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
});