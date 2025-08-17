import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DreamCard({ dream, onPress, onPlayAudio }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.cardContainer}>
      <Card style={styles.card}>
        {/* Dream Image Section - Top 60% */}
        <View style={styles.imageContainer}>
          {dream.image_url ? (
            <Image 
              source={{ uri: dream.image_url }} 
              style={styles.dreamImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={48} color="#6b7280" />
              <Text style={styles.placeholderText}>Generating artwork...</Text>
            </View>
          )}
          
          {/* Audio Play Button Overlay */}
          {dream.audio_file_path && (
            <TouchableOpacity 
              style={styles.audioButton}
              onPress={() => onPlayAudio?.(dream)}
            >
              <Ionicons name="play-circle" size={40} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dream Content Section - Bottom 40% */}
        <Card.Content style={styles.contentSection}>
          {/* Dream Title */}
          <Text style={styles.dreamTitle} numberOfLines={2}>
            {dream.dream_title || `Dream from ${formatDate(dream.entry_date)}`}
          </Text>
          
          {/* Dream Text */}
          <Text style={styles.dreamText} numberOfLines={4}>
            {dream.enhanced_description || dream.original_transcription || 'Processing dream...'}
          </Text>
          
          {/* Metadata Footer */}
          <View style={styles.footer}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text style={styles.dateText}>
                {formatDate(dream.entry_date)}
              </Text>
            </View>
            
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#9ca3af" />
              <Text style={styles.timeText}>
                {formatTime(dream.created_at)}
              </Text>
            </View>
          </View>
          
          {/* Emotion Tags */}
          {dream.emotions && dream.emotions.length > 0 && (
            <View style={styles.emotionTags}>
              {dream.emotions.slice(0, 3).map((emotion, index) => (
                <View key={index} style={styles.emotionTag}>
                  <Text style={styles.emotionText}>{emotion}</Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 12,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#1a1b3a',
    borderRadius: 16,
    elevation: 8,
    shadowColor: 'rgba(167, 139, 250, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    overflow: 'hidden',
  },
  imageContainer: {
    height: 240,
    position: 'relative',
    backgroundColor: '#0f0f23',
  },
  dreamImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167, 139, 250, 0.2)',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  audioButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 4,
  },
  contentSection: {
    height: 160,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 27, 58, 0.95)',
  },
  dreamTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 8,
    lineHeight: 22,
    textShadowColor: 'rgba(167, 139, 250, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dreamText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
    flex: 1,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emotionTag: {
    backgroundColor: 'rgba(251, 243, 199, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  emotionText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
});