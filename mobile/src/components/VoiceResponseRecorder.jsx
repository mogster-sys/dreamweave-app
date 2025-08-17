import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import aiService from '../services/aiService';

export default function VoiceResponseRecorder({ 
  questionId, 
  onRecordingComplete, 
  style 
}) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [showButtons, setShowButtons] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(pulse);
      };
      pulse();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission required', 'Please allow microphone access to record your response.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
      setTranscription('');
      setShowButtons(false);
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setShowButtons(true);

      // Start transcription
      setIsTranscribing(true);
      
      try {
        const result = await aiService.transcribeAudio(uri);
        setTranscription(result.text);
        
      } catch (transcriptionError) {
        console.error('Transcription failed:', transcriptionError);
        setTranscription('Transcription failed - audio saved');
      } finally {
        setIsTranscribing(false);
      }
      
      setRecording(null);
      
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  const handleUseRecording = () => {
    if (transcription || duration > 0) {
      onRecordingComplete?.({
        text: transcription,
        audioUri: recording?.getURI(),
        duration: duration,
        questionId: questionId,
        timestamp: new Date().toISOString()
      });
      
      // Reset for next recording
      resetRecorder();
    }
  };

  const handleRetry = () => {
    resetRecorder();
  };

  const resetRecorder = () => {
    setDuration(0);
    setTranscription('');
    setShowButtons(false);
    setRecording(null);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Recording Button */}
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing || showButtons}
      >
        <Animated.View style={[styles.buttonInner, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={32} 
            color="#ffffff" 
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Status Text */}
      <Text style={styles.statusText}>
        {isTranscribing 
          ? 'Transcribing response...' 
          : isRecording 
            ? 'Recording your answer...' 
            : showButtons
              ? 'Review your response'
              : 'Tap to record your answer'
        }
      </Text>

      {/* Duration */}
      {(isRecording || duration > 0) && (
        <Text style={styles.durationText}>
          {formatDuration(duration)}
        </Text>
      )}

      {/* Transcription Preview */}
      {transcription && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionLabel}>Your response:</Text>
          <Text style={styles.transcriptionText}>
            {transcription}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {showButtons && (
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleRetry}
            style={[styles.button, styles.retryButton]}
            labelStyle={styles.retryButtonText}
          >
            Record Again
          </Button>
          
          <Button
            mode="contained"
            onPress={handleUseRecording}
            style={[styles.button, styles.useButton]}
            disabled={!transcription && duration === 0}
          >
            Use This Response
          </Button>
        </View>
      )}

      {/* Recording Tip */}
      {!isRecording && !showButtons && (
        <Text style={styles.tipText}>
          🔒 Private recording - processed on your device only
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2d1b69',
    borderRadius: 12,
    marginVertical: 8,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  buttonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#e5e7eb',
    fontWeight: '500',
    textAlign: 'center',
  },
  durationText: {
    marginTop: 8,
    fontSize: 18,
    color: '#a78bfa',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  transcriptionContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#1a1b3a',
    borderRadius: 8,
    width: '100%',
  },
  transcriptionLabel: {
    fontSize: 12,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 6,
  },
  transcriptionText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    borderRadius: 8,
  },
  retryButton: {
    borderColor: '#6b7280',
  },
  retryButtonText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  useButton: {
    backgroundColor: '#10b981',
  },
  tipText: {
    marginTop: 12,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});