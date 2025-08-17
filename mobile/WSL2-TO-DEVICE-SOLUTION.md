# 🎯 WSL2 to Android Device - Working Solution

## The Problem
- WSL2 can't directly access Android SDK on Windows
- Network isolation prevents direct device connection
- EAS build requires git repo setup
- Local gradle builds fail in WSL2

## The Solution: Expo Tunnel Method

### Step 1: Install ngrok (creates tunnel through WSL2 network)
```bash
cd ../mobile
npm install -g @expo/ngrok
```

### Step 2: Start Expo with tunnel
```bash
npx expo start --tunnel --port 19000
```

### Step 3: On Your Android Device
1. Install **Expo Go** app from Play Store
2. Open Expo Go
3. Scan the QR code shown in terminal
4. App will load through the tunnel!

## Alternative: Create Standalone APK via Windows

### Step 1: Copy project to Windows
```bash
# From WSL2:
cp -r /home/beastlier/new-project/dreamweave-project/mobile /mnt/c/Users/$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r')/Desktop/dreamweave-mobile
```

### Step 2: Build on Windows (PowerShell)
```powershell
cd ~/Desktop/dreamweave-mobile
npm install
npx expo prebuild
cd android
./gradlew assembleRelease
```

### Step 3: Find APK
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

## Quick Test Method (No Build Required)

### Using Expo Snack:
1. Go to https://snack.expo.dev
2. Import your project files
3. Scan QR with Expo Go app

## Current Best Option for You

Since the app is running on port 8082, try:

```bash
# Kill conflicting processes
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true

# Start with tunnel
cd /home/beastlier/new-project/dreamweave-project/mobile
npx expo start --tunnel --clear
```

Then scan the QR code with Expo Go app on your phone!

## If All Else Fails

Create a web build and access from phone browser:
```bash
npm install react-native-web react-dom @expo/webpack-config
npx expo start --web
```
Then visit the URL on your phone's browser.