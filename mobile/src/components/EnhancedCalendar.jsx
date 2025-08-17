import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { IconButton } from 'react-native-paper';

// Dream mood color mapping
const MOOD_COLORS = {
  peaceful: '#93c5fd',      // Soft blue
  anxious: '#f87171',       // Warm red  
  mystical: '#a78bfa',      // Deep purple
  joyful: '#fbbf24',        // Golden yellow
  lucid: '#34d399',         // Ethereal teal
  nightmare: '#581c87',     // Dark violet
  default: '#6366f1'        // Default purple
};

const MOOD_GLOWS = {
  peaceful: 'rgba(147, 197, 253, 0.4)',
  anxious: 'rgba(248, 113, 113, 0.4)', 
  mystical: 'rgba(167, 139, 250, 0.4)',
  joyful: 'rgba(251, 191, 36, 0.4)',
  lucid: 'rgba(52, 211, 153, 0.4)',
  nightmare: 'rgba(88, 28, 135, 0.6)',
  default: 'rgba(99, 102, 241, 0.4)'
};

export default function EnhancedCalendar({ onDateSelect, dreamEntries = [], selectedDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [animatedValue] = useState(new Animated.Value(1));

  // Get current month info
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // Generate calendar grid
  const calendarDays = [];
  const current = new Date(startDate);
  
  for (let week = 0; week < 6; week++) {
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      weekDays.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    calendarDays.push(weekDays);
    if (current.getMonth() !== month && week >= 4) break;
  }

  // Create dreams map by date
  const dreamsByDate = {};
  dreamEntries.forEach(dream => {
    const dateKey = new Date(dream.entry_date).toISOString().split('T')[0];
    if (!dreamsByDate[dateKey]) {
      dreamsByDate[dateKey] = [];
    }
    dreamsByDate[dateKey].push(dream);
  });

  // Determine mood for a date (use most recent dream's mood)
  const getDayMood = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const dayDreams = dreamsByDate[dateKey];
    if (!dayDreams || dayDreams.length === 0) return null;
    
    // Get most recent dream or use AI analysis to determine mood
    const recentDream = dayDreams[dayDreams.length - 1];
    if (recentDream.ai_analysis_json?.mood) {
      return recentDream.ai_analysis_json.mood;
    }
    
    // Fallback: analyze emotions to determine mood
    if (recentDream.emotions && recentDream.emotions.length > 0) {
      const emotions = recentDream.emotions;
      if (emotions.includes('peaceful') || emotions.includes('calm')) return 'peaceful';
      if (emotions.includes('anxious') || emotions.includes('fear')) return 'anxious';
      if (emotions.includes('mystical') || emotions.includes('mysterious')) return 'mystical';
      if (emotions.includes('joyful') || emotions.includes('happy')) return 'joyful';
      if (emotions.includes('lucid')) return 'lucid';
      if (emotions.includes('nightmare') || emotions.includes('scary')) return 'nightmare';
    }
    
    return 'default';
  };

  // Get dream preview image
  const getDayImage = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const dayDreams = dreamsByDate[dateKey];
    if (!dayDreams || dayDreams.length === 0) return null;
    
    const recentDream = dayDreams[dayDreams.length - 1];
    return recentDream.image_url || recentDream.local_ai_image_uri;
  };

  // Handle date selection with animation
  const handleDatePress = (date) => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onDateSelect?.(date);
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === month;
  };

  const renderDay = (date) => {
    const dayMood = getDayMood(date);
    const dayImage = getDayImage(date);
    const hasContent = dreamsByDate[date.toISOString().split('T')[0]]?.length > 0;
    
    const dayStyle = [
      styles.dayContainer,
      isCurrentMonth(date) ? styles.currentMonth : styles.otherMonth,
      isToday(date) && styles.today,
      isSelected(date) && styles.selected,
      hasContent && dayMood && {
        borderColor: MOOD_COLORS[dayMood],
        borderWidth: 2,
        shadowColor: MOOD_GLOWS[dayMood],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 4,
      }
    ];

    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={dayStyle}
        onPress={() => handleDatePress(date)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dayNumber,
          !isCurrentMonth(date) && styles.otherMonthText,
          isToday(date) && styles.todayText,
          isSelected(date) && styles.selectedText
        ]}>
          {date.getDate()}
        </Text>
        
        {hasContent && (
          <View style={styles.dreamIndicator}>
            {dayImage ? (
              <Image 
                source={{ uri: dayImage }} 
                style={[
                  styles.dreamThumbnail,
                  dayMood && { borderColor: MOOD_COLORS[dayMood] }
                ]}
                resizeMode="cover"
              />
            ) : (
              <View style={[
                styles.dreamDot,
                { backgroundColor: dayMood ? MOOD_COLORS[dayMood] : MOOD_COLORS.default }
              ]} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: animatedValue }] }]}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton 
          icon="chevron-left" 
          size={24} 
          iconColor="#a78bfa"
          onPress={goToPreviousMonth}
        />
        <Text style={styles.monthYear}>
          {monthNames[month]} {year}
        </Text>
        <IconButton 
          icon="chevron-right" 
          size={24} 
          iconColor="#a78bfa"
          onPress={goToNextMonth}
        />
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {dayNames.map(day => (
          <Text key={day} style={styles.dayHeader}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calendar}>
        {calendarDays.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map(renderDay)}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1b3a',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 4,
    shadowColor: 'rgba(167, 139, 250, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a78bfa',
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayHeader: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    textAlign: 'center',
    width: 40,
  },
  calendar: {
    gap: 4,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  dayContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    position: 'relative',
  },
  currentMonth: {
    // Default styling for current month days
  },
  otherMonth: {
    opacity: 0.3,
  },
  today: {
    backgroundColor: '#7c3aed',
  },
  selected: {
    backgroundColor: '#a78bfa',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    textAlign: 'center',
  },
  otherMonthText: {
    color: '#6b7280',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dreamIndicator: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
  },
  dreamThumbnail: {
    width: 16,
    height: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#a78bfa',
  },
  dreamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a78bfa',
  },
});