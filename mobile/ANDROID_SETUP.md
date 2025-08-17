# Quick Android Testing with Expo Go

## Method 1: Expo Go App (Recommended - Fastest)

1. **Install Expo Go** on your Android device from Google Play Store

2. **Connect to same WiFi** as this computer

3. **Start the app**:
   ```bash
   cd /home/beastlier/dreamcatcher/dreamweave/mobile
   npm start
   ```

4. **Scan QR code** with Expo Go app camera

## Method 2: USB Connection

1. **Enable Developer Options** on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect USB cable** and allow debugging

3. **Install ADB** (if not installed):
   ```bash
   sudo apt update
   sudo apt install android-tools-adb
   ```

4. **Check device connection**:
   ```bash
   adb devices
   ```

5. **Start with device**:
   ```bash
   npm run android
   ```

## Current Status

- ✅ All DreamWeave features implemented
- ✅ Voice recording optimized for prompts
- ✅ Secondary prompting system active
- ✅ Privacy-first design (audio stays local)
- ✅ Production ready

## Troubleshooting

If QR code doesn't work:
1. Make sure both devices are on same WiFi
2. Try restarting the Metro bundler
3. Check firewall settings
4. Use tunnel mode: `npm start --tunnel`