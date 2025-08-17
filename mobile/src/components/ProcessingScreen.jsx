import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function ProcessingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#a78bfa" />
      <Text style={styles.text}>Processing your dream...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  text: {
    color: '#a78bfa',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
  },
}); 