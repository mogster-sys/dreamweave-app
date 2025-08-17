# Get DreamWeave APK on Your Android Device

## Step 1: Wait for Build to Complete
Check build status:
```bash
ls -la android/app/build/outputs/apk/release/
```

## Step 2: Transfer APK to Phone

### Method A: USB Cable (Fastest)
1. **Connect phone to computer** with USB cable
2. **Copy APK to phone**:
   ```bash
   # Find your phone's storage
   ls /mnt/c/Users/mogie/
   # Or if phone shows up as drive
   cp android/app/build/outputs/apk/release/app-release.apk /mnt/d/Download/
   ```

### Method B: Email (Easiest)
1. **Email APK to yourself**:
   ```bash
   # Upload to your email provider or cloud storage
   echo "Email this file: android/app/build/outputs/apk/release/app-release.apk"
   ```

### Method C: Web Server (Quick)
1. **Start simple web server**:
   ```bash
   cd android/app/build/outputs/apk/release/
   python3 -m http.server 8000
   ```
2. **Download on phone**: Open browser → `http://172.24.135.249:8000`
3. **Tap APK file** to download

## Step 3: Install on Android Device

1. **Enable Unknown Sources**:
   - Settings → Security → Install unknown apps
   - Allow from Browser/File Manager

2. **Install APK**:
   - Find APK in Downloads folder
   - Tap the file
   - Tap "Install"
   - Wait for installation

3. **Grant Permissions**:
   - When app opens, allow microphone access
   - This is needed for dream voice recording

## Step 4: Test DreamWeave Features

✅ **Dream Capture**: Record voice dreams  
✅ **Secondary Prompting**: Answer enhancement questions  
✅ **Dream Journal**: View saved dreams  
✅ **AI Prompts**: Review generated prompts

**The app is completely standalone - no Expo Go needed!**