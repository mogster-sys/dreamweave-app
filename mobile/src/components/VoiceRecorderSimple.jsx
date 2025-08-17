import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

export default function VoiceRecorderSimple({ onAudioRecorded, isRecording, setIsRecording }) {
  const [recording, setRecording] = useState(null);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
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
        Alert.alert('Permission required', 'Please allow microphone access to record dreams');
        return;
      }

      // Configure audio for low-fidelity, small file size (prompt-focused)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 16000,  // Lower sample rate for smaller files
          numberOfChannels: 1, // Mono
          bitRate: 32000,     // Lower bitrate for smaller files
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_LOW, // Low quality for smaller files
          sampleRate: 16000,  // Lower sample rate
          numberOfChannels: 1, // Mono
          bitRate: 32000,     // Lower bitrate
        },
      });

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      
      // Create a permanent file path for storage
      const audioDir = `${FileSystem.documentDirectory}audio/`;
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
      
      const filename = `dream_${Date.now()}.m4a`;
      const permanentPath = `${audioDir}${filename}`;
      
      // Move the recorded file to permanent location
      await FileSystem.moveAsync({
        from: uri,
        to: permanentPath,
      });

      // Get file info to check size (for debugging)
      const fileInfo = await FileSystem.getInfoAsync(permanentPath);
      console.log(`Audio recorded: ${duration}s, size: ${(fileInfo.size / 1024).toFixed(1)}KB`);

      // Call the callback with the file path
      // Note: In a real app, you'd process this for speech-to-text here
      if (onAudioRecorded) {
        onAudioRecorded(permanentPath, null); // null for transcription since it's placeholder
      }

      setRecording(null);
      setDuration(0);
      
      Alert.alert(
        'Recording Complete', 
        `Recorded ${duration} seconds. Audio saved for prompt creation.`
      );
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to save recording.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordingButton
        ]}
        onPress={handlePress}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={32}
          color="white"
        />
      </TouchableOpacity>
      
      <View style={styles.info}>
        <Text style={styles.statusText}>
          {isRecording ? 'Recording...' : 'Tap to record your dream'}
        </Text>
        {isRecording && (
          <Text style={styles.timerText}>
            {formatTime(duration)}
          </Text>
        )}
      </View>

      {isRecording && (
        <Text style={styles.hintText}>
          Speak naturally - recording optimized for dream prompts
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#ef4444',
  },
  info: {
    alignItems: 'center',
    marginTop: 16,
  },
  statusText: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginTop: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});