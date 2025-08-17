import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button, Card, TextInput, Chip } from 'react-native-paper';
import { createDreamEntry } from '../services/database';
import VoiceRecorderSimple from '../components/VoiceRecorderSimple';
import DreamEnhancementFlow from '../components/DreamEnhancementFlow';

const EMOTIONS = ['happy', 'anxious', 'peaceful', 'confused', 'excited', 'scared', 'nostalgic', 'angry'];
const THEMES = ['flying', 'falling', 'water', 'animals', 'people', 'places', 'memories', 'fantasy'];

export default function DreamCaptureScreen({ navigation }) {
  const [dreamText, setDreamText] = useState('');
  const [dreamTitle, setDreamTitle] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [audioPath, setAudioPath] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showEnhancement, setShowEnhancement] = useState(false);
  const [enhancementData, setEnhancementData] = useState(null);

  const toggleEmotion = (emotion) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const toggleTheme = (theme) => {
    setSelectedThemes(prev => 
      prev.includes(theme) 
        ? prev.filter(t => t !== theme)
        : [...prev, theme]
    );
  };

  const handleAudioRecorded = (audioFilePath, transcription) => {
    setAudioPath(audioFilePath);
    if (transcription) {
      setDreamText(prev => prev + ' ' + transcription);
    }
  };

  const handleEnhancementComplete = (enhancementData) => {
    setEnhancementData(enhancementData);
    setShowEnhancement(false);
    // Proceed to save with enhanced data
    saveDreamWithEnhancement(enhancementData);
  };

  const proceedToEnhancement = () => {
    if (!dreamText.trim()) {
      Alert.alert('Error', 'Please add a dream description first');
      return;
    }
    setShowEnhancement(true);
  };

  const saveDreamWithEnhancement = async (enhancement) => {
    try {
      const dreamData = {
        user_id: 'default_user',
        entry_date: new Date().toISOString().split('T')[0],
        dream_title: dreamTitle || dreamText.substring(0, 50) || 'Dream Entry',
        enhanced_description: dreamText,
        original_transcription: dreamText,
        emotions: JSON.stringify(selectedEmotions),
        themes: JSON.stringify(selectedThemes),
        symbols: JSON.stringify([]),
        lucidity_level: 0,
        vividness_level: 0,
        audio_file_path: audioPath,
        art_style: 'ethereal',
        ai_prompt: enhancement?.enhancedPrompt || null
      };

      const dreamId = await createDreamEntry(dreamData);
      
      // TODO: Save enhancement responses to journal_prompts table
      
      Alert.alert(
        'Dream Saved!', 
        'Your dream has been saved with enhanced prompt ready for image generation.',
        [{ text: 'OK', onPress: () => navigation.navigate('Journal') }]
      );

      // Reset form
      setDreamText('');
      setDreamTitle('');
      setSelectedEmotions([]);
      setSelectedThemes([]);
      setAudioPath(null);
      setEnhancementData(null);
      
    } catch (error) {
      console.error('Error saving dream:', error);
      Alert.alert('Error', 'Failed to save dream. Please try again.');
    }
  };

  const saveDream = () => {
    if (!dreamText.trim() && !audioPath) {
      Alert.alert('Error', 'Please add a dream description or record audio');
      return;
    }

    // Proceed to enhancement flow for better prompts
    proceedToEnhancement();
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="< Record Your Dream" />
        <Card.Content>
          
          {/* Voice Recording */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice Recording</Text>
            <VoiceRecorderSimple 
              onAudioRecorded={handleAudioRecorded}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
            />
          </View>

          {/* Dream Title */}
          <View style={styles.section}>
            <TextInput
              label="Dream Title (optional)"
              value={dreamTitle}
              onChangeText={setDreamTitle}
              mode="outlined"
              placeholder="Give your dream a title..."
            />
          </View>

          {/* Dream Description */}
          <View style={styles.section}>
            <TextInput
              label="Dream Description"
              value={dreamText}
              onChangeText={setDreamText}
              mode="outlined"
              multiline
              numberOfLines={6}
              placeholder="Describe your dream in detail..."
            />
          </View>

          {/* Emotions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How did you feel?</Text>
            <View style={styles.chipContainer}>
              {EMOTIONS.map(emotion => (
                <Chip
                  key={emotion}
                  selected={selectedEmotions.includes(emotion)}
                  onPress={() => toggleEmotion(emotion)}
                  style={styles.chip}
                >
                  {emotion}
                </Chip>
              ))}
            </View>
          </View>

          {/* Themes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What themes appeared?</Text>
            <View style={styles.chipContainer}>
              {THEMES.map(theme => (
                <Chip
                  key={theme}
                  selected={selectedThemes.includes(theme)}
                  onPress={() => toggleTheme(theme)}
                  style={styles.chip}
                >
                  {theme}
                </Chip>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.section}>
            <Button
              mode="contained"
              onPress={saveDream}
              style={styles.saveButton}
              icon="auto-fix"
            >
              Create Enhanced Prompt
            </Button>
          </View>

        </Card.Content>
      </Card>

      {/* Enhancement Flow Modal */}
      {showEnhancement && (
        <DreamEnhancementFlow
          dreamText={dreamText}
          onComplete={handleEnhancementComplete}
          onSkip={() => {
            setShowEnhancement(false);
            // Save without enhancement
            saveDreamWithEnhancement(null);
          }}
        />
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
  card: {
    backgroundColor: '#1a1b3a',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    margin: 2,
  },
  saveButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
});