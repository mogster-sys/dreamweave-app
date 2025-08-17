import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WaveformVisualizer({ isActive, style }) {
  // Placeholder: In production, replace with actual waveform visualization
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{isActive ? 'Waveform (active)' : 'Waveform (inactive)'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderRadius: 8,
    height: 100,
  },
  text: {
    color: '#a78bfa',
    fontSize: 16,
  },
}); 