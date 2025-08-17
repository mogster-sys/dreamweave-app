#!/bin/bash
set -e

echo "🔥 Building DreamWeave APK (WSL-friendly approach)"

# Install Android build tools if needed
if ! command -v eas &> /dev/null; then
    echo "Installing EAS CLI..."
    npm install -g @expo/cli eas-cli
fi

# Create a standalone build profile
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 5.4.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF

# Update app config for standalone build
cat > app.config.js << 'EOF'
export default {
  expo: {
    name: "DreamWeave",
    slug: "dreamweave-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain", 
      backgroundColor: "#1a1a2e"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.dreamweave.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a1a2e"
      },
      package: "com.dreamweave.mobile",
      permissions: [
        "RECORD_AUDIO",
        "WRITE_EXTERNAL_STORAGE", 
        "READ_EXTERNAL_STORAGE"
      ]
    },
    plugins: [
      [
        "expo-av",
        {
          "microphonePermission": "Allow DreamWeave to record your dreams."
        }
      ]
    ]
  }
};
EOF

echo "📱 Starting APK build..."
echo "This will create a standalone APK you can install directly on your phone"

# Build APK
eas build --platform android --profile preview --local --clear-cache

echo "✅ APK build complete! Look for the .apk file in the output above."
echo "📲 Transfer it to your phone and install it directly."