#!/bin/bash
set -e

echo "🚀 Creating Web-based APK (Most Reliable for WSL)"

# Install Capacitor for web-to-native conversion
npm install -g @capacitor/cli @capacitor/core @capacitor/android

# Initialize Capacitor
npx cap init "DreamWeave" "com.dreamweave.app" --web-dir=dist

# Build web version first
echo "📦 Building web version..."
npx expo export:embed --platform=web --dev=false

# Add Android platform
npx cap add android

# Copy web assets
npx cap copy

# Build APK
echo "🔨 Building Android APK..."
cd android
./gradlew assembleDebug

echo "✅ APK should be ready at: android/app/build/outputs/apk/debug/app-debug.apk"