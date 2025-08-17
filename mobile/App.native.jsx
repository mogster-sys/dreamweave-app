import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import VoiceRecorder from './src/components/VoiceRecorder';

// Initialize Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase credentials are configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials not found. App will run in offline mode.');
  console.warn('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file');
}

const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [dreamText, setDreamText] = useState('');
  const [dreams, setDreams] = useState([]);
  const [recording, setRecording] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing session
    checkUser();
    // Load cached dreams
    loadDreams();
  }, []);

  const checkUser = async () => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
  };

  const loadDreams = async () => {
    try {
      // First try to load from Supabase if user is logged in
      if (user && supabase) {
        const { data, error } = await supabase
          .from('dream_entries')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setDreams(data);
          // Cache dreams locally
          await AsyncStorage.setItem('dreams', JSON.stringify(data));
        }
      } else {
        // Load from local storage if offline
        const cachedDreams = await AsyncStorage.getItem('dreams');
        if (cachedDreams) {
          setDreams(JSON.parse(cachedDreams));
        }
      }
    } catch (error) {
      console.error('Error loading dreams:', error);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow microphone access');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
      console.error(error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Convert audio to base64 for API
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Send to your API
      await transcribeAudio(base64Audio);
      
      setRecording(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to process recording');
      console.error(error);
    }
  };

  const transcribeAudio = async (base64Audio) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ai/speech-to-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      const data = await response.json();
      if (data.success) {
        setDreamText(data.transcription);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to transcribe audio');
    } finally {
      setLoading(false);
    }
  };

  const generateAIImage = async () => {
    if (!dreamText.trim()) {
      Alert.alert('Error', 'Please describe your dream first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/ai/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dream_text: dreamText }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'AI image generated! Check your dream entry.');
        await saveDream(data.image_url);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate AI image');
    } finally {
      setLoading(false);
    }
  };

  const saveDream = async (imageUrl = null) => {
    const newDream = {
      user_id: user?.id || 'default_user',
      entry_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      dream_title: dreamText.split(' ').slice(0, 5).join(' ') + '...',
      enhanced_description: dreamText,
      emotions: ['Peaceful'],
      themes: [],
      symbols: [],
      image_url: imageUrl,
      art_style: 'ethereal'
    };

    try {
      // Save to Supabase if online
      if (user && supabase) {
        const { data, error } = await supabase
          .from('dream_entries')
          .insert([newDream])
          .select();
        
        if (error) throw error;
      }

      // Always save locally
      const updatedDreams = [newDream, ...dreams];
      setDreams(updatedDreams);
      await AsyncStorage.setItem('dreams', JSON.stringify(updatedDreams));
      
      setDreamText('');
      Alert.alert('Success', 'Dream saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save dream');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1b3a', '#7b2cbf', '#1a1b3a']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Ionicons name="moon" size={32} color="#a78bfa" />
                <View style={styles.headerText}>
                  <Text style={styles.title}>DreamWeave</Text>
                  <Text style={styles.subtitle}>Weaving dreams into art</Text>
                </View>
              </View>
            </View>

            {/* Dream Entry Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                <Ionicons name="sparkles" size={20} color="#7b2cbf" /> Capture Your Dream
              </Text>

              {/* Voice to Text Section */}
              <Text style={{ fontWeight: 'bold', marginTop: 10, marginBottom: 4 }}>Voice to Text</Text>
              <VoiceRecorder onTranscription={setDreamText} />

              <TextInput
                style={styles.textInput}
                placeholder="Describe your dream..."
                placeholderTextColor="#999"
                value={dreamText}
                onChangeText={setDreamText}
                multiline
                numberOfLines={4}
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, isRecording && styles.recordingButton]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                >
                  <Ionicons 
                    name={isRecording ? "mic-off" : "mic"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.buttonText}>
                    {isRecording ? 'Stop Recording' : 'Voice Record'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.generateButton]}
                  onPress={generateAIImage}
                  disabled={loading || !dreamText}
                >
                  <Ionicons name="image" size={20} color="white" />
                  <Text style={styles.buttonText}>Generate Art</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={() => saveDream()}
                disabled={loading || !dreamText}
              >
                <Ionicons name="moon" size={20} color="white" />
                <Text style={styles.buttonText}>Save Dream</Text>
              </TouchableOpacity>
            </View>

            {/* Dream History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="cloud" size={20} color="#60a5fa" /> Your Dream Journal
              </Text>
              
              {dreams.map((dream) => (
                <View key={dream.id} style={styles.dreamCard}>
                  <View style={styles.dreamHeader}>
                    <Text style={styles.dreamTitle}>{dream.title}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{dream.mood}</Text>
                    </View>
                  </View>
                  <Text style={styles.dreamContent} numberOfLines={2}>
                    {dream.content}
                  </Text>
                  <Text style={styles.dreamDate}>
                    {new Date(dream.date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: '#a78bfa',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1a1b3a',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b7280',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  recordingButton: {
    backgroundColor: '#ef4444',
  },
  generateButton: {
    backgroundColor: '#8b5cf6',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    width: '100%',
    marginHorizontal: 0,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  dreamCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dreamTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1b3a',
  },
  badge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  dreamContent: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  dreamDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
}); 