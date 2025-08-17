import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

export default function VoiceRecorder({ onRecordingComplete, onTranscriptionComplete }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const speechRecognition = useRef(null);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
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
        Alert.alert('Permission required', 'Please allow microphone access to record your dreams.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording audio for backup
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
      setTranscription('');
      
      // Start live speech recognition
      startSpeechRecognition();
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      stopSpeechRecognition();
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Save audio file locally for privacy
      const audioDir = `${FileSystem.documentDirectory}audio/`;
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      const fileName = `dream_${Date.now()}.m4a`;
      const localUri = `${audioDir}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: localUri });
      
      // Call completion callback with LOCAL audio URI (never uploaded)
      onRecordingComplete?.({
        uri: localUri, // Local file path only
        duration,
        timestamp: new Date().toISOString()
      });

      // Use on-device transcription result
      if (transcription.trim()) {
        onTranscriptionComplete?.({
          text: transcription,
          duration: duration,
          cost: 0, // No cost for on-device processing
          audioUri: localUri // Local only
        });
      } else {
        Alert.alert(
          'Speech Recognition', 
          'No speech was detected. You can try recording again or type your dream manually.'
        );
      }
      
      setRecording(null);
      
    } catch (err) {
      console.error('Failed to stop recording', err);
      Alert.alert('Recording Error', 'Failed to stop recording.');
    }
  };

  const startSpeechRecognition = () => {
    // For now, we'll use a simplified approach
    // In a real implementation, you would use @react-native-voice/voice
    // or expo-speech with a proper speech recognition library
    setIsListening(true);
    setIsTranscribing(true);
    
    // Simulate real-time transcription for demo
    // In production, replace with actual speech recognition
    setTimeout(() => {
      setIsTranscribing(false);
    }, 2000);
  };

  const stopSpeechRecognition = () => {
    setIsListening(false);
    setIsTranscribing(false);
    
    // For demo purposes, we'll show a placeholder
    // In production, this would contain the actual speech recognition result
    if (!transcription.trim()) {
      setTranscription('Speech recognition placeholder - install @react-native-voice/voice for real implementation');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Recording Button */}
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={isTranscribing}
      >
        <Animated.View style={[styles.buttonInner, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons 
            name={isRecording ? "stop" : "mic"} 
            size={48} 
            color="#ffffff" 
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Status Text */}
      <Text style={styles.statusText}>
        {isTranscribing 
          ? 'Processing speech...' 
          : isRecording 
            ? (isListening ? 'Listening and recording...' : 'Recording your dream...') 
            : 'Tap to start recording'
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
          <Text style={styles.transcriptionLabel}>Dream captured:</Text>
          <Text style={styles.transcriptionText} numberOfLines={3}>
            {transcription}
          </Text>
        </View>
      )}

      {/* Recording Tips */}
      {!isRecording && !transcription && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>🔐 Private Recording:</Text>
          <Text style={styles.tipText}>• Speech is processed on your device only</Text>
          <Text style={styles.tipText}>• Audio files stay private locally</Text>
          <Text style={styles.tipText}>• Speak clearly for best recognition</Text>
          <Text style={styles.tipText}>• Only the text goes to AI for images</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f0f23',
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    marginTop: 20,
    fontSize: 18,
    color: '#e5e7eb',
    fontWeight: '500',
    textAlign: 'center',
  },
  durationText: {
    marginTop: 12,
    fontSize: 24,
    color: '#a78bfa',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  transcriptionContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1a1b3a',
    borderRadius: 12,
    width: '100%',
  },
  transcriptionLabel: {
    fontSize: 14,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 8,
  },
  transcriptionText: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  tipsContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#1a1b3a',
    borderRadius: 12,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 6,
    lineHeight: 20,
  },
});
