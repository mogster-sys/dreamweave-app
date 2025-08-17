import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, Dimensions, Image } from 'react-native';
import { Card, Chip, IconButton, FAB, Button } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getDreamEntries } from '../services/database';
import DreamAudioPlayer from '../components/DreamAudioPlayer';
import EnhancedCalendar from '../components/EnhancedCalendar';

const { height: screenHeight } = Dimensions.get('window');

export default function DreamJournalScreen({ navigation }) {
  const [dreams, setDreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDream, setSelectedDream] = useState(null);
  const [calendarHeight] = useState(new Animated.Value(screenHeight * 0.4));
  const [contentOpacity] = useState(new Animated.Value(1));

  const loadDreams = async () => {
    try {
      const dreamEntries = await getDreamEntries();
      setDreams(dreamEntries);
      setFilteredDreams(dreamEntries);
    } catch (error) {
      console.error('Error loading dreams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDreams();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDreams();
  };

  // Handle date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    
    // Find dream for selected date
    const dateKey = date.toISOString().split('T')[0];
    const dreamForDate = dreams.find(dream => {
      const dreamDate = new Date(dream.entry_date).toISOString().split('T')[0];
      return dreamDate === dateKey;
    });
    
    // Animate content transition
    Animated.sequence([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedDream(dreamForDate);
  };

  // Toggle focus between calendar and content
  const focusCalendar = () => {
    Animated.timing(calendarHeight, {
      toValue: screenHeight * 0.6,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const focusContent = () => {
    Animated.timing(calendarHeight, {
      toValue: screenHeight * 0.3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Render selected dream content
  const renderDreamContent = () => {
    if (!selectedDream) {
      return (
        <View style={styles.emptyContent}>
          <Text style={styles.emptyTitle}>No Dream Entry</Text>
          <Text style={styles.emptyText}>
            {formatDate(selectedDate.toISOString())} has no recorded dreams
          </Text>
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Capture')}
            style={styles.createButton}
            labelStyle={styles.createButtonText}
          >
            Record Dream for This Day
          </Button>
        </View>
      );
    }

    return (
      <Card style={styles.dreamContentCard}>
        <Card.Content>
          <View style={styles.contentHeader}>
            <Text style={styles.dreamTitle}>
              {selectedDream.dream_title || 'Untitled Dream'}
            </Text>
            <Text style={styles.dreamDate}>
              {formatDate(selectedDream.entry_date)}
            </Text>
          </View>

          {/* Dream Image */}
          {(selectedDream.image_url || selectedDream.local_ai_image_uri) && (
            <View style={styles.dreamImageContainer}>
              <Image 
                source={{ uri: selectedDream.image_url || selectedDream.local_ai_image_uri }}
                style={styles.dreamImage}
                resizeMode="cover"
              />
            </View>
          )}

          <ScrollView style={styles.dreamContentScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.dreamDescription}>
              {selectedDream.enhanced_description || selectedDream.original_transcription || 'No description'}
            </Text>

            {/* Audio Player */}
            {selectedDream.audio_file_path && (
              <View style={styles.audioSection}>
                <DreamAudioPlayer 
                  audioPath={selectedDream.audio_file_path}
                  compact={false}
                />
              </View>
            )}

            {/* Emotions */}
            {selectedDream.emotions && selectedDream.emotions.length > 0 && (
              <View style={styles.chipSection}>
                <Text style={styles.chipLabel}>Emotions:</Text>
                <View style={styles.chipContainer}>
                  {selectedDream.emotions.map((emotion, index) => (
                    <Chip key={index} compact style={styles.emotionChip}>
                      {emotion}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {/* Themes */}
            {selectedDream.themes && selectedDream.themes.length > 0 && (
              <View style={styles.chipSection}>
                <Text style={styles.chipLabel}>Themes:</Text>
                <View style={styles.chipContainer}>
                  {selectedDream.themes.map((theme, index) => (
                    <Chip key={index} compact style={styles.themeChip}>
                      {theme}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.contentActions}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('DreamDetail', { dreamId: selectedDream.id })}
              style={styles.actionButton}
            >
              Edit Dream
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => {/* TODO: Implement sharing */}}
              style={styles.actionButton}
            >
              Share
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Initialize selected dream on load
  useEffect(() => {
    if (dreams.length > 0 && !selectedDream) {
      // Select today's dream if available, otherwise most recent
      const today = new Date().toISOString().split('T')[0];
      const todayDream = dreams.find(dream => {
        const dreamDate = new Date(dream.entry_date).toISOString().split('T')[0];
        return dreamDate === today;
      });
      
      if (todayDream) {
        setSelectedDream(todayDream);
        setSelectedDate(new Date(todayDream.entry_date));
      } else {
        // Select most recent dream
        const mostRecent = dreams[0]; // dreams are sorted by date desc
        setSelectedDream(mostRecent);
        setSelectedDate(new Date(mostRecent.entry_date));
      }
    }
  }, [dreams]);

  return (
    <View style={styles.container}>
      {/* Enhanced Calendar Section */}
      <Animated.View style={[styles.calendarSection, { height: calendarHeight }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dream Calendar</Text>
          <IconButton 
            icon="calendar-expand-horizontal" 
            size={20} 
            iconColor="#a78bfa"
            onPress={focusCalendar}
          />
        </View>
        
        <EnhancedCalendar 
          onDateSelect={handleDateSelect}
          dreamEntries={dreams}
          selectedDate={selectedDate}
        />
      </Animated.View>

      {/* Visual Connection Line */}
      <View style={styles.connectionLine}>
        <View style={[
          styles.connectionDot,
          selectedDream && {
            backgroundColor: selectedDream.emotions?.includes('peaceful') ? '#93c5fd' :
                           selectedDream.emotions?.includes('anxious') ? '#f87171' :
                           selectedDream.emotions?.includes('mystical') ? '#a78bfa' :
                           selectedDream.emotions?.includes('joyful') ? '#fbbf24' : '#6366f1'
          }
        ]} />
      </View>

      {/* Dream Content Section */}
      <Animated.View 
        style={[
          styles.contentSection, 
          { 
            flex: 1,
            opacity: contentOpacity 
          }
        ]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric'
            })}
          </Text>
          <IconButton 
            icon="text-box-expand" 
            size={20} 
            iconColor="#a78bfa"
            onPress={focusContent}
          />
        </View>
        
        <ScrollView 
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderDreamContent()}
        </ScrollView>
      </Animated.View>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Capture')}
        label="Record Dream"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  calendarSection: {
    backgroundColor: '#0f0f23',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a78bfa',
  },
  connectionLine: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  contentSection: {
    backgroundColor: '#0f0f23',
    paddingHorizontal: 16,
  },
  dreamContentCard: {
    backgroundColor: '#1a1b3a',
    elevation: 4,
    marginBottom: 16,
    borderRadius: 12,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dreamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a78bfa',
    flex: 1,
    marginRight: 12,
  },
  dreamDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dreamImageContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dreamImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  dreamContentScroll: {
    maxHeight: 300,
  },
  dreamDescription: {
    fontSize: 16,
    color: '#e5e7eb',
    lineHeight: 24,
    marginBottom: 16,
  },
  audioSection: {
    marginBottom: 16,
  },
  chipSection: {
    marginBottom: 12,
  },
  chipLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emotionChip: {
    backgroundColor: '#fef3c7',
    marginBottom: 4,
  },
  themeChip: {
    backgroundColor: '#dbeafe',
    marginBottom: 4,
  },
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderColor: '#a78bfa',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createButton: {
    borderColor: '#a78bfa',
    borderWidth: 2,
  },
  createButtonText: {
    color: '#a78bfa',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#7c3aed',
  },
});