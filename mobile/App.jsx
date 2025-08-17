import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import DreamJournalScreen from './src/screens/DreamJournalScreen';
import DreamCaptureScreen from './src/screens/DreamCaptureScreen';
import DreamDetailScreen from './src/screens/DreamDetailScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Import services
import { initializeDatabase } from './src/services/database';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Define dark theme
const darkTheme = {
  colors: {
    primary: '#a78bfa',
    primaryContainer: '#7c3aed',
    secondary: '#f3e8ff',
    secondaryContainer: '#ddd6fe',
    tertiary: '#fbbf24',
    background: '#0f0f23',
    surface: '#1a1b3a',
    surfaceVariant: '#2d1b69',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onTertiary: '#000000',
    onBackground: '#e5e7eb',
    onSurface: '#e5e7eb',
    outline: '#6b7280',
    error: '#ef4444',
    onError: '#ffffff',
  },
};

function JournalStack() {
  return (
    <Stack.Navigator
      initialRouteName="DreamJournal"
      screenOptions={{
        headerStyle: { backgroundColor: darkTheme.colors.surface },
        headerTintColor: darkTheme.colors.onSurface,
        headerTitleStyle: { color: darkTheme.colors.onSurface },
      }}
    >
      <Stack.Screen 
        name="DreamJournal" 
        component={DreamJournalScreen} 
        options={{ title: 'Dream Journal' }}
      />
      <Stack.Screen 
        name="DreamDetail" 
        component={DreamDetailScreen} 
        options={{ title: 'Dream Details' }}
      />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Journal"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Journal') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Capture') {
            iconName = focused ? 'mic' : 'mic-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: darkTheme.colors.primary,
        tabBarInactiveTintColor: darkTheme.colors.outline,
        tabBarStyle: {
          backgroundColor: darkTheme.colors.surface,
          borderTopColor: darkTheme.colors.outline,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Journal" 
        component={JournalStack} 
        options={{ title: 'Journal' }}
      />
      <Tab.Screen 
        name="Capture" 
        component={DreamCaptureScreen} 
        options={{ title: 'Record Dream' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database
        await initializeDatabase();
        
        // Check if user has completed onboarding
        // For now, always show main app
        setShowOnboarding(false);
        
      } catch (e) {
        console.warn('App initialization error:', e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading DreamWeave...</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <PaperProvider theme={darkTheme}>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
        <StatusBar style="light" />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={darkTheme}>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: darkTheme.colors.primary,
            background: darkTheme.colors.background,
            card: darkTheme.colors.surface,
            text: darkTheme.colors.onSurface,
            border: darkTheme.colors.outline,
            notification: darkTheme.colors.primary,
          },
        }}
      >
        <TabNavigator />
      </NavigationContainer>
      <StatusBar style="light" />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    color: '#a78bfa',
    fontSize: 18,
    fontWeight: '600',
  },
});