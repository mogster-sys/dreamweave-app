import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function CharacterImageHandler({ 
  onImagesSelected, 
  maxImages = 2,
  style 
}) {
  const [selectedImages, setSelectedImages] = useState([]);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos to add character images from your dreams.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
        ]
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for better AI processing
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        addImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  const takePhoto = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to take character photos.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        addImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const addImage = (imageAsset) => {
    if (selectedImages.length >= maxImages) {
      Alert.alert(
        'Maximum Reached',
        `You can only add up to ${maxImages} character images.`
      );
      return;
    }

    const newImage = {
      id: Date.now().toString(),
      uri: imageAsset.uri,
      width: imageAsset.width,
      height: imageAsset.height,
      fileSize: imageAsset.fileSize,
    };

    const updatedImages = [...selectedImages, newImage];
    setSelectedImages(updatedImages);
    onImagesSelected?.(updatedImages);
  };

  const removeImage = (imageId) => {
    const updatedImages = selectedImages.filter(img => img.id !== imageId);
    setSelectedImages(updatedImages);
    onImagesSelected?.(updatedImages);
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      'Add Character Photo',
      'Choose how you want to add a character image from your dream:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Gallery', onPress: pickImageFromGallery },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Character Photos</Text>
        <Text style={styles.subtitle}>
          Add up to {maxImages} photos of people from your dream
        </Text>
      </View>

      {/* Selected Images */}
      {selectedImages.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.imageScrollView}
          contentContainerStyle={styles.imageScrollContent}
        >
          {selectedImages.map((image) => (
            <View key={image.id} style={styles.imageContainer}>
              <Image source={{ uri: image.uri }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(image.id)}
              >
                <Ionicons name="close-circle" size={24} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Add Image Button */}
      {selectedImages.length < maxImages && (
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={showImageSourceOptions}
        >
          <Ionicons name="add-circle-outline" size={48} color="#a78bfa" />
          <Text style={styles.addImageText}>
            Add Character Photo
          </Text>
          <Text style={styles.addImageSubtext}>
            ({selectedImages.length}/{maxImages})
          </Text>
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={showImageSourceOptions}
          disabled={selectedImages.length >= maxImages}
          style={[styles.button, styles.addButton]}
          labelStyle={styles.addButtonText}
        >
          =÷ Add Photo
        </Button>
        
        {selectedImages.length > 0 && (
          <Button
            mode="text"
            onPress={() => {
              setSelectedImages([]);
              onImagesSelected?.([]);
            }}
            style={styles.button}
            labelStyle={styles.clearButtonText}
          >
            Clear All
          </Button>
        )}
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>=¡ Tips for better results:</Text>
        <Text style={styles.tipText}>" Use clear, well-lit photos</Text>
        <Text style={styles.tipText}>" Face should be clearly visible</Text>
        <Text style={styles.tipText}>" Square/portrait orientation works best</Text>
        <Text style={styles.tipText}>" Photos will be used to enhance AI artwork</Text>
      </View>

      {/* Privacy Note */}
      <View style={styles.privacyNote}>
        <Ionicons name="shield-checkmark" size={16} color="#10b981" />
        <Text style={styles.privacyText}>
          Photos are processed locally and only used for your dream artwork
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1a1b3a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a78bfa',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  imageScrollView: {
    marginBottom: 16,
  },
  imageScrollContent: {
    paddingRight: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2d1b69',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  addImageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#2d1b69',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#a78bfa',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addImageText: {
    fontSize: 16,
    color: '#a78bfa',
    fontWeight: '600',
    marginTop: 8,
  },
  addImageSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 8,
  },
  addButton: {
    borderColor: '#a78bfa',
  },
  addButtonText: {
    color: '#a78bfa',
    fontSize: 12,
  },
  clearButtonText: {
    color: '#6b7280',
    fontSize: 12,
  },
  tipsContainer: {
    backgroundColor: '#2d1b69',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    color: '#a78bfa',
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#d1d5db',
    marginBottom: 3,
    lineHeight: 16,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  privacyText: {
    fontSize: 11,
    color: '#10b981',
    marginLeft: 6,
    flex: 1,
    lineHeight: 14,
  },
});