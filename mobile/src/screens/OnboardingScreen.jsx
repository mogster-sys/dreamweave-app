import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseService } from '../services/supabaseClient';

const OnboardingScreen = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState({
    name: '',
    dreamingFrequency: '',
    interests: [],
    notificationPreferences: {
      dailyReminder: true,
      dreamInsights: true,
    },
  });

  const steps = [
    {
      title: "Welcome to DreamWeave",
      subtitle: "Your AI-powered dream journal",
      component: WelcomeStep,
    },
    {
      title: "Tell us about yourself",
      subtitle: "Help us personalize your experience",
      component: PersonalInfoStep,
    },
    {
      title: "Dream preferences",
      subtitle: "How often do you remember your dreams?",
      component: DreamPreferencesStep,
    },
    {
      title: "Notification settings",
      subtitle: "Stay connected to your dream journey",
      component: NotificationStep,
    },
    {
      title: "You're all set!",
      subtitle: "Ready to start capturing your dreams",
      component: CompletionStep,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Save user preferences
      await AsyncStorage.setItem('userPreferences', JSON.stringify(userData));
      await AsyncStorage.setItem('onboardingComplete', 'true');
      
      // Create user character if name provided
      if (userData.name) {
        try {
          await supabaseService.createUserCharacter({
            user_id: 'default_user',
            character_name: userData.name,
            character_description: `Dreams ${userData.dreamingFrequency}`,
            is_active: true,
          });
        } catch (error) {
          console.log('Could not create user character (offline mode)');
        }
      }
      
      onComplete();
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1b3a', '#7b2cbf', '#1a1b3a']}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep ? styles.progressDotActive : null,
                ]}
              />
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{steps[currentStep].title}</Text>
            <Text style={styles.subtitle}>{steps[currentStep].subtitle}</Text>
          </View>

          {/* Step content */}
          <View style={styles.stepContent}>
            <CurrentStepComponent
              userData={userData}
              setUserData={setUserData}
            />
          </View>

          {/* Navigation buttons */}
          <View style={styles.navigationContainer}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.backButton]}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={20} color="#7b2cbf" />
                <Text style={[styles.buttonText, styles.backButtonText]}>Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Individual step components
const WelcomeStep = () => (
  <View style={styles.welcomeStep}>
    <Ionicons name="moon" size={80} color="#a78bfa" />
    <Text style={styles.welcomeText}>
      Transform your dreams into beautiful AI-generated artwork and gain insights into your subconscious mind.
    </Text>
    <View style={styles.featureList}>
      <FeatureItem icon="mic" text="Voice-to-text dream capture" />
      <FeatureItem icon="image" text="AI-generated dream artwork" />
      <FeatureItem icon="analytics" text="Dream pattern insights" />
      <FeatureItem icon="shield-checkmark" text="Private and secure" />
    </View>
  </View>
);

const PersonalInfoStep = ({ userData, setUserData }) => (
  <View style={styles.stepContainer}>
    <TextInput
      style={styles.textInput}
      placeholder="What should we call you?"
      placeholderTextColor="#999"
      value={userData.name}
      onChangeText={(text) => setUserData({ ...userData, name: text })}
    />
    
    <Text style={styles.sectionTitle}>What interests you most?</Text>
    <View style={styles.interestsContainer}>
      {['Lucid Dreaming', 'Dream Analysis', 'Nightmares', 'Recurring Dreams', 'Spiritual Dreams'].map((interest) => (
        <TouchableOpacity
          key={interest}
          style={[
            styles.interestTag,
            userData.interests.includes(interest) ? styles.interestTagActive : null,
          ]}
          onPress={() => {
            const interests = userData.interests.includes(interest)
              ? userData.interests.filter(i => i !== interest)
              : [...userData.interests, interest];
            setUserData({ ...userData, interests });
          }}
        >
          <Text style={[
            styles.interestText,
            userData.interests.includes(interest) ? styles.interestTextActive : null,
          ]}>
            {interest}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const DreamPreferencesStep = ({ userData, setUserData }) => (
  <View style={styles.stepContainer}>
    <Text style={styles.sectionTitle}>How often do you remember your dreams?</Text>
    {['Every night', 'A few times a week', 'Occasionally', 'Rarely'].map((frequency) => (
      <TouchableOpacity
        key={frequency}
        style={[
          styles.optionButton,
          userData.dreamingFrequency === frequency ? styles.optionButtonActive : null,
        ]}
        onPress={() => setUserData({ ...userData, dreamingFrequency: frequency })}
      >
        <Text style={[
          styles.optionText,
          userData.dreamingFrequency === frequency ? styles.optionTextActive : null,
        ]}>
          {frequency}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const NotificationStep = ({ userData, setUserData }) => (
  <View style={styles.stepContainer}>
    <Text style={styles.sectionTitle}>Stay connected to your dreams</Text>
    
    <TouchableOpacity
      style={styles.notificationOption}
      onPress={() => setUserData({
        ...userData,
        notificationPreferences: {
          ...userData.notificationPreferences,
          dailyReminder: !userData.notificationPreferences.dailyReminder,
        },
      })}
    >
      <View style={styles.notificationContent}>
        <Ionicons name="alarm" size={24} color="#a78bfa" />
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>Daily dream reminder</Text>
          <Text style={styles.notificationSubtitle}>Get reminded to record your dreams</Text>
        </View>
      </View>
      <Ionicons
        name={userData.notificationPreferences.dailyReminder ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={userData.notificationPreferences.dailyReminder ? "#7b2cbf" : "#666"}
      />
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.notificationOption}
      onPress={() => setUserData({
        ...userData,
        notificationPreferences: {
          ...userData.notificationPreferences,
          dreamInsights: !userData.notificationPreferences.dreamInsights,
        },
      })}
    >
      <View style={styles.notificationContent}>
        <Ionicons name="analytics" size={24} color="#a78bfa" />
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>Dream insights</Text>
          <Text style={styles.notificationSubtitle}>Weekly patterns and analysis</Text>
        </View>
      </View>
      <Ionicons
        name={userData.notificationPreferences.dreamInsights ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={userData.notificationPreferences.dreamInsights ? "#7b2cbf" : "#666"}
      />
    </TouchableOpacity>
  </View>
);

const CompletionStep = () => (
  <View style={styles.completionStep}>
    <Ionicons name="checkmark-circle" size={80} color="#4ade80" />
    <Text style={styles.completionTitle}>Welcome to DreamWeave!</Text>
    <Text style={styles.completionText}>
      Your personalized dream journal is ready. Start recording your first dream and watch as AI transforms it into beautiful artwork.
    </Text>
  </View>
);

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon} size={20} color="#a78bfa" />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: '#a78bfa',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a78bfa',
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
  },
  welcomeStep: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  featureList: {
    marginTop: 20,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1b3a',
    marginBottom: 16,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  interestTagActive: {
    backgroundColor: '#7b2cbf',
  },
  interestText: {
    color: '#6b7280',
    fontSize: 14,
  },
  interestTextActive: {
    color: 'white',
  },
  optionButton: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionButtonActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#7b2cbf',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  optionTextActive: {
    color: '#7b2cbf',
    fontWeight: '600',
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  completionStep: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1b3a',
    marginVertical: 16,
  },
  completionText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  nextButton: {
    backgroundColor: '#7b2cbf',
    marginLeft: 'auto',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  backButtonText: {
    color: '#7b2cbf',
  },
});

export default OnboardingScreen;