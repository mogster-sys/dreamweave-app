# 🚀 Codemagic Build Setup for DreamWeave

## Quick Start

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Add Codemagic configuration"
   git push origin master
   ```

2. **Connect to Codemagic**
   - Go to https://codemagic.io
   - Connect your repository
   - Select the `codemagic.yaml` configuration

3. **Set Environment Variables in Codemagic UI**
   
   Go to Settings → Environment variables and add:
   
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://okdirveyorptfzvmtbsu.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   EXPO_PUBLIC_API_URL=http://172.24.135.249:5000
   ```

4. **Start Build**
   - Click "Start new build"
   - Select "react-native-android" workflow
   - Watch the build progress

## Build Outputs

After successful build, you'll get:
- **APK file** - Direct install on any Android device
- **Download link** - Share with testers
- **Email notification** - With download links

## Alternative: Simple Workflow

If the above doesn't work, use this minimal config:

```yaml
workflows:
  simple-android:
    name: Simple Android Build
    scripts:
      - cd mobile && npm install
      - cd mobile && npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle
      - cd mobile/android && ./gradlew assembleRelease
    artifacts:
      - mobile/android/app/build/outputs/apk/**/*.apk
```

## Testing the APK

1. Download APK from Codemagic
2. Transfer to phone (email, Google Drive, etc.)
3. Enable "Install from Unknown Sources" in Android settings
4. Install and run!

## Current Status

✅ Codemagic.yaml configured
✅ Two build workflows available:
   - Standard React Native build
   - Expo EAS build
✅ Ready to push and build

## Next Steps

1. Commit and push to your repository
2. Connect repository to Codemagic
3. Run build
4. Download APK to device!