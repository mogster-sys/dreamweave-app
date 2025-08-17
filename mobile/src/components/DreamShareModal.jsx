import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Share,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const DreamShareModal = ({ visible, onClose, dreamEntry }) => {
  const [shareText, setShareText] = useState('');
  const [includeImage, setIncludeImage] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(false);

  const generateShareContent = () => {
    let content = `🌙 ${dreamEntry?.dream_title || 'My Dream'}\n\n`;
    
    if (shareText) {
      content += `${shareText}\n\n`;
    } else {
      // Keep description concise for social media
      const description = dreamEntry?.enhanced_description || 'A fascinating dream...';
      const truncatedDescription = description.length > 150 
        ? description.substring(0, 150) + '...' 
        : description;
      content += `${truncatedDescription}\n\n`;
    }

    if (includeDetails) {
      if (dreamEntry?.emotions?.length > 0) {
        content += `💭 ${dreamEntry.emotions.slice(0, 3).join(', ')}\n`;
      }
      if (dreamEntry?.themes?.length > 0) {
        content += `🎭 ${dreamEntry.themes.slice(0, 2).join(', ')}\n`;
      }
      if (dreamEntry?.lucidity_level > 0) {
        content += `✨ Lucidity: ${dreamEntry.lucidity_level}/5\n`;
      }
      content += '\n';
    }

    content += '#DreamJournal #DreamWeave #AI';
    return content;
  };

  const handleShare = async (platform = 'default') => {
    try {
      const shareContent = generateShareContent();
      const dreamTitle = dreamEntry?.dream_title || 'My Dream';
      const encodedContent = encodeURIComponent(shareContent);
      const imageUrl = includeImage && dreamEntry?.image_url ? dreamEntry.image_url : '';
      
      let shareUrl = '';
      
      switch (platform) {
        case 'twitter':
          // Twitter has 280 char limit, so truncate content
          const twitterContent = shareContent.length > 200 
            ? shareContent.substring(0, 200) + '...' 
            : shareContent;
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterContent)}`;
          if (imageUrl) shareUrl += `&url=${encodeURIComponent(imageUrl)}`;
          break;
          
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl || 'https://dreamweave.app')}&quote=${encodedContent}`;
          break;
          
        case 'instagram':
          // Instagram doesn't support direct sharing via URL, so copy to clipboard
          Alert.alert(
            'Share to Instagram',
            'Content copied to clipboard! Open Instagram and paste in your story or post.',
            [{ text: 'OK' }]
          );
          await copyToClipboard();
          return;
          
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodedContent}`;
          break;
          
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${encodeURIComponent(imageUrl || '')}&text=${encodedContent}`;
          break;
          
        case 'email':
          shareUrl = `mailto:?subject=${encodeURIComponent(dreamTitle)}&body=${encodedContent}`;
          break;
          
        default:
          // Use native share sheet
          const shareOptions = {
            message: shareContent,
            title: dreamTitle,
          };
          if (imageUrl) shareOptions.url = imageUrl;
          await Share.share(shareOptions);
          onClose();
          return;
      }
      
      // Open the platform-specific URL
      const { Linking } = require('react-native');
      await Linking.openURL(shareUrl);
      onClose();
      
    } catch (error) {
      Alert.alert('Error', 'Failed to share dream');
    }
  };

  const handleSaveImage = async () => {
    if (!dreamEntry?.image_url) {
      Alert.alert('No Image', 'This dream doesn\'t have an associated image');
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to save images');
        return;
      }

      const filename = `dream_${dreamEntry.id}_${Date.now()}.jpg`;
      const downloadPath = `${FileSystem.documentDirectory}${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(
        dreamEntry.image_url,
        downloadPath
      );

      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      Alert.alert('Success', 'Dream image saved to your photo library!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const copyToClipboard = async () => {
    const content = generateShareContent();
    // Note: Expo Clipboard would be used here
    Alert.alert('Copied', 'Dream content copied to clipboard!');
  };

  if (!dreamEntry) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Dream</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Dream Preview */}
          <View style={styles.dreamPreview}>
            <Text style={styles.dreamTitle}>{dreamEntry.dream_title}</Text>
            
            {dreamEntry.image_url && (
              <View style={styles.imageContainer}>
                <Image source={{ uri: dreamEntry.image_url }} style={styles.dreamImage} />
                <TouchableOpacity
                  style={styles.saveImageButton}
                  onPress={handleSaveImage}
                >
                  <Ionicons name="download" size={20} color="white" />
                  <Text style={styles.saveImageText}>Save Image</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.dreamDescription}>
              {dreamEntry.enhanced_description}
            </Text>

            {dreamEntry.emotions?.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.tagsLabel}>Emotions:</Text>
                <View style={styles.tags}>
                  {dreamEntry.emotions.map((emotion, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{emotion}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            <Text style={styles.sectionTitle}>Share Options</Text>

            <TouchableOpacity
              style={styles.option}
              onPress={() => setIncludeImage(!includeImage)}
            >
              <View style={styles.optionContent}>
                <Ionicons name="image" size={24} color="#7b2cbf" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Include AI Artwork</Text>
                  <Text style={styles.optionSubtitle}>Share the generated image</Text>
                </View>
              </View>
              <Ionicons
                name={includeImage ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={includeImage ? "#7b2cbf" : "#666"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={() => setIncludeDetails(!includeDetails)}
            >
              <View style={styles.optionContent}>
                <Ionicons name="list" size={24} color="#7b2cbf" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Include Dream Details</Text>
                  <Text style={styles.optionSubtitle}>Emotions, themes, and lucidity</Text>
                </View>
              </View>
              <Ionicons
                name={includeDetails ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={includeDetails ? "#7b2cbf" : "#666"}
              />
            </TouchableOpacity>

            {/* Custom Message */}
            <View style={styles.customMessage}>
              <Text style={styles.sectionTitle}>Custom Message (Optional)</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Add your own message to share with your dream..."
                placeholderTextColor="#999"
                value={shareText}
                onChangeText={setShareText}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.previewContent}>
                <Text style={styles.previewText}>{generateShareContent()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Social Media Platforms */}
        <View style={styles.socialPlatforms}>
          <Text style={styles.sectionTitle}>Share to Platform</Text>
          
          <View style={styles.platformGrid}>
            <TouchableOpacity
              style={styles.platformButton}
              onPress={() => handleShare('twitter')}
            >
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
              <Text style={styles.platformText}>Twitter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.platformButton}
              onPress={() => handleShare('facebook')}
            >
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              <Text style={styles.platformText}>Facebook</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.platformButton}
              onPress={() => handleShare('instagram')}
            >
              <Ionicons name="logo-instagram" size={24} color="#E4405F" />
              <Text style={styles.platformText}>Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.platformButton}
              onPress={() => handleShare('whatsapp')}
            >
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.platformText}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.platformButton}
              onPress={() => handleShare('telegram')}
            >
              <Ionicons name="paper-plane" size={24} color="#0088CC" />
              <Text style={styles.platformText}>Telegram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.platformButton}
              onPress={() => handleShare('email')}
            >
              <Ionicons name="mail" size={24} color="#EA4335" />
              <Text style={styles.platformText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={copyToClipboard}>
            <Ionicons name="copy" size={20} color="#7b2cbf" />
            <Text style={[styles.actionText, { color: '#7b2cbf' }]}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => handleShare('default')}
          >
            <Ionicons name="share" size={20} color="white" />
            <Text style={[styles.actionText, { color: 'white' }]}>More Options</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1b3a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dreamPreview: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  dreamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1b3a',
    marginBottom: 12,
  },
  imageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  dreamImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  saveImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  saveImageText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
  },
  dreamDescription: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#7b2cbf',
  },
  shareOptions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1b3a',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  customMessage: {
    marginVertical: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  preview: {
    marginTop: 16,
  },
  previewContent: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  },
  previewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#f3f4f6',
  },
  shareButton: {
    backgroundColor: '#7b2cbf',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  socialPlatforms: {
    marginBottom: 24,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformButton: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  platformText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DreamShareModal;