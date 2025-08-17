import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Button, Card, ActivityIndicator, Chip } from 'react-native-paper';
import aiService from '../services/aiService';
import { createDreamEntry } from '../services/database';

export default function DreamToImageFlow({ dreamText, onComplete }) {
  const [selectedStyle, setSelectedStyle] = useState('ethereal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [dreamEntry, setDreamEntry] = useState(null);

  const artStyles = aiService.getArtStyles();

  const generateDreamImage = async () => {
    if (!dreamText?.trim()) {
      Alert.alert('Error', 'Please record your dream first');
      return;
    }

    setIsGenerating(true);
    try {
      // Step 1: Generate AI image from dream
      const imageResult = await aiService.createDreamImage(
        dreamText, 
        selectedStyle, 
        'standard'
      );

      setGeneratedImage(imageResult);

      // Step 2: Save to journal with image
      const entryData = {
        entry_date: new Date().toISOString().split('T')[0],
        original_transcription: dreamText,
        enhanced_description: imageResult.enhancedPrompt,
        dream_title: `Dream from ${new Date().toLocaleDateString()}`,
        art_style: selectedStyle,
        image_url: imageResult.imageUrl,
        ai_prompt: imageResult.enhancedPrompt,
        user_id: 'default_user'
      };

      const entryId = await createDreamEntry(entryData);
      setDreamEntry({ ...entryData, id: entryId });

      Alert.alert(
        'Dream Captured! 🎨', 
        'Your dream has been transformed into art and saved to your journal.',
        [{ text: 'View Journal', onPress: () => onComplete?.(entryId) }]
      );

    } catch (error) {
      console.error('Dream to image generation failed:', error);
      Alert.alert('Error', 'Failed to generate dream image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Transform Your Dream Into Art</Text>
          
          {/* Dream Text Preview */}
          <View style={styles.dreamPreview}>
            <Text style={styles.dreamLabel}>Your Dream:</Text>
            <Text style={styles.dreamText} numberOfLines={4}>
              {dreamText || 'No dream recorded yet...'}
            </Text>
          </View>

          {/* Art Style Selection */}
          <View style={styles.styleSection}>
            <Text style={styles.sectionTitle}>Choose Art Style:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {artStyles.map((style) => (
                  <Chip
                    key={style.id}
                    mode={selectedStyle === style.id ? 'flat' : 'outlined'}
                    selected={selectedStyle === style.id}
                    onPress={() => setSelectedStyle(style.id)}
                    style={[
                      styles.chip,
                      selectedStyle === style.id && styles.selectedChip
                    ]}
                    textStyle={selectedStyle === style.id && styles.selectedChipText}
                  >
                    {style.name}
                  </Chip>
                ))}
              </View>
            </ScrollView>
            <Text style={styles.styleDescription}>
              {artStyles.find(s => s.id === selectedStyle)?.description}
            </Text>
          </View>

          {/* Generate Button */}
          <Button
            mode="contained"
            onPress={generateDreamImage}
            loading={isGenerating}
            disabled={!dreamText?.trim() || isGenerating}
            style={styles.generateButton}
            contentStyle={styles.generateButtonContent}
          >
            {isGenerating ? 'Creating Your Dream Art...' : '🎨 Generate Dream Image'}
          </Button>

          {/* Generated Image */}
          {generatedImage && (
            <View style={styles.imageSection}>
              <Text style={styles.sectionTitle}>Your Dream Visualization:</Text>
              <Image 
                source={{ uri: generatedImage.imageUrl }} 
                style={styles.dreamImage}
                resizeMode="cover"
              />
              <Text style={styles.imageCaption}>
                Style: {generatedImage.style} • Generated in {generatedImage.generationTime?.toFixed(1)}s
              </Text>
              
              {dreamEntry && (
                <View style={styles.savedIndicator}>
                  <Text style={styles.savedText}>✅ Saved to Dream Journal</Text>
                </View>
              )}
            </View>
          )}

          {/* Loading State */}
          {isGenerating && (
            <View style={styles.loadingSection}>
              <ActivityIndicator size="large" color="#a78bfa" />
              <Text style={styles.loadingText}>
                Transforming your dream into a beautiful {selectedStyle} artwork...
              </Text>
              <Text style={styles.loadingSubtext}>
                This usually takes 10-30 seconds
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
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
  card: {
    backgroundColor: '#1a1b3a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a78bfa',
    textAlign: 'center',
    marginBottom: 20,
  },
  dreamPreview: {
    backgroundColor: '#2d1b69',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  dreamLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 8,
  },
  dreamText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  styleSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#a78bfa',
  },
  selectedChipText: {
    color: '#000000',
  },
  styleDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    fontStyle: 'italic',
  },
  generateButton: {
    backgroundColor: '#7c3aed',
    marginVertical: 16,
  },
  generateButtonContent: {
    paddingVertical: 8,
  },
  imageSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  dreamImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginVertical: 12,
  },
  imageCaption: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 12,
  },
  savedIndicator: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  savedText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingSection: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#a78bfa',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});