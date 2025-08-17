# WSL Android Setup (Most Reliable)

WSL + Expo = nightmare. Let's use direct Android development instead.

## Method 1: Direct APK via React Native CLI

```bash
# Install React Native CLI
npm install -g react-native-cli

# Create Android build
npx react-native run-android --mode=release
```

## Method 2: Use Windows Host Machine

Since WSL networking is problematic:

1. **Copy project to Windows**:
   ```bash
   cp -r /home/beastlier/dreamcatcher/dreamweave/mobile /mnt/c/temp/dreamweave-mobile
   ```

2. **Open Windows PowerShell** and run:
   ```powershell
   cd C:\temp\dreamweave-mobile
   npm install
   npm start
   ```

3. **Scan QR code** from Windows - this usually works better

## Method 3: Build APK in Docker

```bash
# Use Android build container
docker run --rm -v "$PWD":/app -w /app \
  reactnativecommunity/react-native-android:latest \
  bash -c "npm install && npx expo build:android --type app-bundle"
```

## Method 4: Use Cordova/Capacitor (Simplest)

Convert to a hybrid app:

```bash
npm install -g @capacitor/cli @capacitor/core @capacitor/android
npx cap init dreamweave com.dreamweave.app
npx cap add android
npx cap run android
```

## Recommendation

Try **Method 2** (copy to Windows) first - it's the path of least resistance with WSL networking issues.