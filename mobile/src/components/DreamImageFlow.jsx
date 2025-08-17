import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import PromptConfirmation from './PromptConfirmation';
import aiService from '../services/aiService';

export default function DreamImageFlow({ 
  originalDream, 
  enhancedResponses = [], 
  style = 'ethereal', 
  onImageGenerated 
}) {
  const [step, setStep] = useState('prepare'); // 'prepare', 'confirm', 'generating', 'complete'
  const [promptPreview, setPromptPreview] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePreparePrompt = async () => {
    try {
      setIsLoading(true);
      
      // Get enhanced prompt preview with on-device analysis
      const preview = await aiService.getEnhancedPromptPreview(
        originalDream, 
        style, 
        enhancedResponses
      );
      
      setPromptPreview(preview);
      setStep('confirm');
      
    } catch (error) {
      console.error('Failed to prepare prompt:', error);
      Alert.alert('Error', 'Failed to analyze dream. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPrompt = async (finalPrompt) => {
    try {
      setStep('generating');
      setIsLoading(true);
      
      // Generate image using the confirmed prompt
      const result = await aiService.createDreamImage(
        originalDream, 
        style, 
        'standard', 
        enhancedResponses
      );
      
      setGeneratedImage(result);
      setStep('complete');
      
      // Notify parent component
      onImageGenerated?.(result);
      
    } catch (error) {
      console.error('Failed to generate image:', error);
      Alert.alert('Generation Failed', error.message || 'Please try again later.');
      setStep('confirm'); // Go back to confirmation
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPrompt = () => {
    setStep('prepare');
    setPromptPreview(null);
  };

  const handleStartOver = () => {
    setStep('prepare');
    setPromptPreview(null);
    setGeneratedImage(null);
  };

  if (step === 'prepare') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ready to Generate Your Dream Image</Text>
        
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>What will be processed:</Text>
          <Text style={styles.summaryItem}>• Original dream: "{originalDream.substring(0, 50)}..."</Text>
          {enhancedResponses.length > 0 && (
            <Text style={styles.summaryItem}>
              • {enhancedResponses.length} enhanced response(s)
            </Text>
          )}
          <Text style={styles.summaryItem}>• Art style: {style}</Text>
          <Text style={styles.summaryItem}>• On-device psychological analysis</Text>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 Your dream will be analyzed privately on your device to create an enhanced AI prompt. 
            Only the final text prompt will be sent to generate your image.
          </Text>
        </View>

        <Button
          mode="contained"
          onPress={handlePreparePrompt}
          loading={isLoading}
          disabled={isLoading}
          style={styles.primaryButton}
        >
          Analyze Dream & Prepare Prompt
        </Button>
      </View>
    );
  }

  if (step === 'confirm') {
    return (
      <PromptConfirmation
        originalDream={originalDream}
        enhancedResponses={enhancedResponses}
        promptEnhancement={promptPreview}
        onConfirm={handleConfirmPrompt}
        onCancel={handleCancelPrompt}
      />
    );
  }

  if (step === 'generating') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Generating Your Dream Image</Text>
        
        <View style={styles.generatingBox}>
          <Text style={styles.generatingText}>
            🎨 Creating your dream visualization...
          </Text>
          <Text style={styles.generatingSubtext}>
            This may take 10-30 seconds
          </Text>
          
          {promptPreview && (
            <View style={styles.usedAnalysis}>
              <Text style={styles.analysisTitle}>Using your analysis:</Text>
              <Text style={styles.analysisText}>
                {promptPreview.analysis.emotionCount} emotions, {' '}
                {promptPreview.analysis.themeCount} themes, {' '}
                {promptPreview.analysis.symbolCount} symbols
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  if (step === 'complete' && generatedImage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Dream Image Generated!</Text>
        
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            ✨ Your dream has been transformed into art
          </Text>
          
          <View style={styles.resultStats}>
            <Text style={styles.statText}>
              Generated in {generatedImage.generationTime?.toFixed(1)}s
            </Text>
            <Text style={styles.statText}>
              Cost: ${generatedImage.cost?.toFixed(3)}
            </Text>
            {generatedImage.onDeviceAnalysis && (
              <Text style={styles.statText}>
                Analysis: {generatedImage.onDeviceAnalysis.emotionCount + 
                          generatedImage.onDeviceAnalysis.themeCount + 
                          generatedImage.onDeviceAnalysis.symbolCount} elements
              </Text>
            )}
          </View>
        </View>

        <Button
          mode="outlined"
          onPress={handleStartOver}
          style={styles.secondaryButton}
        >
          Generate Another Version
        </Button>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1b3a',
    borderRadius: 16,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: '#0f0f23',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
    marginBottom: 8,
  },
  summaryItem: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
    paddingLeft: 8,
  },
  privacyNote: {
    backgroundColor: '#064e3b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  privacyText: {
    fontSize: 12,
    color: '#d1fae5',
    textAlign: 'center',
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    paddingVertical: 4,
  },
  secondaryButton: {
    borderColor: '#a78bfa',
    borderRadius: 8,
    paddingVertical: 4,
  },
  generatingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  generatingText: {
    fontSize: 18,
    color: '#a78bfa',
    textAlign: 'center',
    marginBottom: 8,
  },
  generatingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  usedAnalysis: {
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  analysisTitle: {
    fontSize: 12,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 12,
    color: '#10b981',
    textAlign: 'center',
  },
  resultBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  resultText: {
    fontSize: 16,
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultStats: {
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  statText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 2,
  },
});