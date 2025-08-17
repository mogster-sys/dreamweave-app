# Connect Your Android Phone

## Method 1: Direct URL (Easiest)

1. **Install Expo Go** from Google Play Store
2. **Connect your phone to the same WiFi** as this computer
3. **Open Expo Go app** and tap "Enter URL manually"
4. **Enter this URL**: `exp://172.24.135.249:8081`

## Method 2: QR Code via Browser

1. **Open browser** on this computer
2. **Go to**: http://localhost:8081
3. **Look for QR code** on the page
4. **Scan with Expo Go** app

## Method 3: If above doesn't work

Try running:
```bash
npx expo start --tunnel
```

This creates a public tunnel that works from anywhere.

## Current Status ✅

- Metro bundler is running on port 8081
- App is ready for testing
- All DreamWeave features implemented
- Voice recording, secondary prompting, dream journal all working

## Your Local Network IP: 172.24.135.249

Make sure your phone is connected to the same WiFi network!