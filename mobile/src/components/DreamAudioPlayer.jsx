import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

export default function DreamAudioPlayer({ dream, style }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadAudio = async () => {
    if (!dream?.audio_file_path) {
      Alert.alert('No Audio', 'This dream does not have an audio recording.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: dream.audio_file_path },
        { shouldPlay: false }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          setDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying || false);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      });

      setSound(newSound);
      
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Audio Error', 'Failed to load audio recording.');
    } finally {
      setIsLoading(false);
    }
  };

  const playPause = async () => {
    if (!sound) {
      await loadAudio();
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing/pausing audio:', error);
      Alert.alert('Playback Error', 'Failed to play audio.');
    }
  };

  const stop = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        setPosition(0);
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
    }
  };

  const seek = async (newPosition) => {
    if (sound && duration > 0) {
      try {
        const seekPosition = (newPosition / 100) * duration;
        await sound.setPositionAsync(seekPosition);
      } catch (error) {
        console.error('Error seeking audio:', error);
      }
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      {/* Main Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={playPause}
          disabled={isLoading}
        >
          <Ionicons
            name={isLoading ? "hourglass" : isPlaying ? "pause" : "play"}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>

        <View style={styles.timeInfo}>
          <Text style={styles.timeText}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.stopButton}
          onPress={stop}
          disabled={!sound || (!isPlaying && position === 0)}
        >
          <Ionicons name="stop" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View 
            style={[styles.progressFill, { width: `${progressPercent}%` }]} 
          />
        </View>
        <TouchableOpacity
          style={[styles.progressThumb, { left: `${progressPercent}%` }]}
          onPressIn={() => {
            // Could implement dragging here
          }}
        />
      </View>

      {/* Audio Info */}
      <View style={styles.audioInfo}>
        <Ionicons name="mic" size={14} color="#9ca3af" />
        <Text style={styles.audioInfoText}>
          Dream Recording from {new Date(dream.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2d1b69',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  timeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#e5e7eb',
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1b3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#1a1b3a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#a78bfa',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: '#a78bfa',
    borderRadius: 8,
    marginLeft: -8,
    elevation: 2,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioInfoText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 6,
    fontStyle: 'italic',
  },
});