import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function PromptConfirmation({ 
  originalDream, 
  enhancedResponses = [], 
  promptEnhancement, 
  onConfirm, 
  onCancel,
  style 
}) {
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  
  if (!promptEnhancement) {
    return null;
  }

  const { enhancedPrompt, analysis } = promptEnhancement;
  const { emotions, themes, symbols, emotionCount, themeCount, symbolCount } = analysis;

  const handleConfirm = () => {
    onConfirm?.(enhancedPrompt);
  };

  const handleEditPrompt = () => {
    Alert.alert(
      'Edit Prompt',
      'This would open a text editor to modify the AI prompt before sending.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit Later', onPress: handleConfirm }
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Ionicons name="eye-outline" size={24} color="#a78bfa" />
        <Text style={styles.title}>Review AI Image Prompt</Text>
      </View>

      <Text style={styles.subtitle}>
        Before generating your dream image, please review what will be sent to the AI:
      </Text>

      {/* Analysis Summary */}
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>🧠 On-Device Analysis Results:</Text>
        
        <View style={styles.analysisRow}>
          <Text style={styles.analysisLabel}>Emotions detected:</Text>
          <Text style={styles.analysisValue}>
            {emotionCount > 0 ? emotions.join(', ') : 'None detected'}
          </Text>
        </View>

        <View style={styles.analysisRow}>
          <Text style={styles.analysisLabel}>Themes found:</Text>
          <Text style={styles.analysisValue}>
            {themeCount > 0 ? themes.join(', ') : 'None detected'}
          </Text>
        </View>

        <View style={styles.analysisRow}>
          <Text style={styles.analysisLabel}>Symbols identified:</Text>
          <Text style={styles.analysisValue}>
            {symbolCount > 0 ? symbols.join(', ') : 'None detected'}
          </Text>
        </View>
      </View>

      {/* Prompt Preview */}
      <View style={styles.promptContainer}>
        <View style={styles.promptHeader}>
          <Text style={styles.promptTitle}>📝 AI Prompt to Send:</Text>
          <TouchableOpacity 
            onPress={() => setShowFullPrompt(!showFullPrompt)}
            style={styles.toggleButton}
          >
            <Text style={styles.toggleText}>
              {showFullPrompt ? 'Show Less' : 'Show Full'}
            </Text>
            <Ionicons 
              name={showFullPrompt ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#a78bfa" 
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.promptScroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.promptText} numberOfLines={showFullPrompt ? undefined : 4}>
            {enhancedPrompt}
          </Text>
        </ScrollView>
      </View>

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Ionicons name="shield-checkmark" size={16} color="#10b981" />
        <Text style={styles.privacyText}>
          Only this enhanced text will be sent to generate your image. 
          Your original audio and personal details stay private on your device.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={onCancel}
          style={[styles.button, styles.cancelButton]}
          labelStyle={styles.cancelButtonText}
        >
          Cancel
        </Button>

        <Button
          mode="outlined"
          onPress={handleEditPrompt}
          style={[styles.button, styles.editButton]}
          labelStyle={styles.editButtonText}
        >
          Edit Prompt
        </Button>

        <Button
          mode="contained"
          onPress={handleConfirm}
          style={[styles.button, styles.confirmButton]}
        >
          Generate Image
        </Button>
      </View>

      {/* Source Summary */}
      <View style={styles.sourceSummary}>
        <Text style={styles.sourceTitle}>Prompt built from:</Text>
        <Text style={styles.sourceItem}>• Original dream: "{originalDream.substring(0, 50)}..."</Text>
        {enhancedResponses.length > 0 && (
          <Text style={styles.sourceItem}>
            • Enhanced responses: {enhancedResponses.length} additional details
          </Text>
        )}
        <Text style={styles.sourceItem}>• On-device analysis: {emotionCount + themeCount + symbolCount} elements</Text>
        <Text style={styles.sourceItem}>• Art style preferences</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1b3a',
    borderRadius: 16,
    padding: 20,
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
    lineHeight: 20,
  },
  analysisContainer: {
    backgroundColor: '#0f0f23',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
    marginBottom: 12,
  },
  analysisRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  analysisLabel: {
    fontSize: 14,
    color: '#d1d5db',
    fontWeight: '500',
    minWidth: 120,
  },
  analysisValue: {
    fontSize: 14,
    color: '#10b981',
    flex: 1,
    fontStyle: 'italic',
  },
  promptContainer: {
    backgroundColor: '#0f0f23',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    maxHeight: 200,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleText: {
    fontSize: 12,
    color: '#a78bfa',
  },
  promptScroll: {
    flex: 1,
  },
  promptText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 20,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#064e3b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#d1fae5',
    flex: 1,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 8,
  },
  cancelButton: {
    borderColor: '#6b7280',
  },
  cancelButtonText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  editButton: {
    borderColor: '#f59e0b',
  },
  editButtonText: {
    color: '#fbbf24',
    fontSize: 12,
  },
  confirmButton: {
    backgroundColor: '#7c3aed',
  },
  sourceSummary: {
    backgroundColor: '#1e1b4b',
    borderRadius: 8,
    padding: 12,
  },
  sourceTitle: {
    fontSize: 12,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 6,
  },
  sourceItem: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 2,
    paddingLeft: 4,
  },
});