import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { getDreamEntry } from '../services/database';
import DreamEnhancementFlow from '../components/DreamEnhancementFlow';
import PromptConfirmation from '../components/PromptConfirmation';
import DreamAudioPlayer from '../components/DreamAudioPlayer';

export default function DreamDetailScreen({ route, navigation }) {
  const { dreamId } = route.params;
  const [dream, setDream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEnhancement, setShowEnhancement] = useState(false);
  const [enhancementData, setEnhancementData] = useState(null);
  const [showPromptConfirmation, setShowPromptConfirmation] = useState(false);

  useEffect(() => {
    loadDream();
  }, [dreamId]);

  const loadDream = async () => {
    try {
      const dreamData = await getDreamEntry(dreamId);
      setDream(dreamData);
      
      // If dream doesn't have an enhanced prompt yet, offer enhancement
      if (!dreamData.ai_prompt) {
        setShowEnhancement(true);
      }
    } catch (error) {
      console.error('Error loading dream:', error);
      Alert.alert('Error', 'Failed to load dream details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhancementComplete = (enhancement) => {
    setEnhancementData(enhancement);
    setShowEnhancement(false);
    setShowPromptConfirmation(true);
  };

  const handlePromptConfirmed = (finalPrompt) => {
    // TODO: Save the confirmed prompt and potentially generate image
    Alert.alert(
      'Prompt Confirmed!',
      'Your enhanced dream prompt is ready for image generation.',
      [{ text: 'OK', onPress: () => setShowPromptConfirmation(false) }]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dream...</Text>
      </View>
    );
  }

  if (!dream) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Dream not found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  // If enhancement flow is active
  if (showEnhancement) {
    return (
      <DreamEnhancementFlow
        dreamText={dream.enhanced_description || dream.original_transcription}
        onComplete={handleEnhancementComplete}
        onSkip={() => setShowEnhancement(false)}
      />
    );
  }

  // If prompt confirmation is active
  if (showPromptConfirmation && enhancementData) {
    return (
      <PromptConfirmation
        originalDream={dream.enhanced_description || dream.original_transcription}
        enhancedResponses={enhancementData.responses || []}
        promptEnhancement={enhancementData}
        onConfirm={handlePromptConfirmed}
        onCancel={() => setShowPromptConfirmation(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.dreamTitle}>
            {dream.dream_title || 'Untitled Dream'}
          </Text>
          <Text style={styles.dreamDate}>
            {formatDate(dream.created_at || dream.entry_date)}
          </Text>
        </Card.Content>
      </Card>

      {/* Dream Content */}
      <Card style={styles.card}>
        <Card.Title title="📝 Dream Description" />
        <Card.Content>
          <Text style={styles.dreamText}>
            {dream.enhanced_description || dream.original_transcription || 'No description available'}
          </Text>
        </Card.Content>
      </Card>

      {/* Audio Player (if available) */}
      {dream.audio_file_path && (
        <Card style={styles.card}>
          <Card.Title title="🎤 Voice Recording" />
          <Card.Content>
            <DreamAudioPlayer 
              audioPath={dream.audio_file_path}
              compact={false}
            />
            <Text style={styles.audioNote}>
              Audio stored locally for privacy - used for prompt enhancement only
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* AI Prompt Status */}
      <Card style={styles.card}>
        <Card.Title title="🎨 Visual Prompt" />
        <Card.Content>
          {dream.ai_prompt ? (
            <View>
              <Text style={styles.promptTitle}>Enhanced Prompt Ready:</Text>
              <Text style={styles.promptText}>{dream.ai_prompt}</Text>
              <Text style={styles.styleText}>Style: {dream.art_style || 'ethereal'}</Text>
              
              <View style={styles.actionButtons}>
                <Button 
                  mode="outlined" 
                  onPress={() => setShowEnhancement(true)}
                  style={styles.actionButton}
                >
                  Improve Prompt
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => Alert.alert('Coming Soon', 'Image generation will be implemented soon!')}
                  style={styles.actionButton}
                >
                  Generate Image
                </Button>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.noPromptText}>
                No enhanced prompt yet. Create one to generate beautiful dream imagery.
              </Text>
              <Button 
                mode="contained" 
                onPress={() => setShowEnhancement(true)}
                style={styles.enhanceButton}
              >
                Create Enhanced Prompt
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Emotions & Themes (if available) */}
      {(dream.emotions?.length > 0 || dream.themes?.length > 0) && (
        <Card style={styles.card}>
          <Card.Title title="🏷️ Tags" />
          <Card.Content>
            {dream.emotions?.length > 0 && (
              <View style={styles.tagSection}>
                <Text style={styles.tagTitle}>Emotions:</Text>
                <View style={styles.chipContainer}>
                  {dream.emotions.map((emotion, index) => (
                    <Chip key={index} compact style={styles.emotionChip}>
                      {emotion}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
            
            {dream.themes?.length > 0 && (
              <View style={styles.tagSection}>
                <Text style={styles.tagTitle}>Themes:</Text>
                <View style={styles.chipContainer}>
                  {dream.themes.map((theme, index) => (
                    <Chip key={index} compact style={styles.themeChip}>
                      {theme}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    color: '#a78bfa',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 20,
  },
  headerCard: {
    backgroundColor: '#1a1b3a',
    marginBottom: 16,
  },
  dreamTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 8,
  },
  dreamDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  card: {
    backgroundColor: '#1a1b3a',
    marginBottom: 16,
  },
  dreamText: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
  },
  audioNote: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  promptTitle: {
    fontSize: 14,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
    marginBottom: 8,
    backgroundColor: '#0f0f23',
    padding: 12,
    borderRadius: 8,
  },
  styleText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 16,
  },
  noPromptText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  enhanceButton: {
    marginTop: 8,
  },
  tagSection: {
    marginBottom: 12,
  },
  tagTitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emotionChip: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  themeChip: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
});