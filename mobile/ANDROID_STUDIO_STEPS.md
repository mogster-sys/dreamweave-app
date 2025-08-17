# 🏗️ Android Studio Build (Most Reliable)

**Project is copying to C:\DreamWeave\ (takes ~5 minutes)**

## Steps for Android Studio:

### 1. Open Project in Android Studio
1. **Open Android Studio** on Windows
2. **File → Open** → Navigate to `C:\DreamWeave\mobile`
3. **Wait for Gradle sync** (may take 5-10 minutes first time)

### 2. Install Dependencies  
```cmd
cd C:\DreamWeave\mobile
npm install
```

### 3. Generate Native Android Project
```cmd
npx expo prebuild --platform android
```

### 4. Build APK in Android Studio
1. **Build → Generate Signed Bundle/APK**
2. **Choose APK**
3. **Select "release" build type**
4. **Build**

### 5. Install on Device
1. **Connect phone via USB**
2. **Enable USB Debugging** on phone
3. **Install APK**:
   - Find APK in `android/app/build/outputs/apk/release/`
   - Or use Android Studio: **Run → Install on device**

## Alternative: Command Line Build
```cmd
cd C:\DreamWeave\mobile\android
gradlew assembleRelease
```

## Expected APK Location
`C:\DreamWeave\mobile\android\app\build\outputs\apk\release\app-release.apk`

**This approach bypasses all WSL issues and builds natively on Windows!**