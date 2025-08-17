# 🚀 Complete Codemagic Setup - iOS & Android Distribution

## Overview

This configuration provides **4 different workflows** for maximum flexibility:

1. **iOS & Android** - Both platforms (Mac M2 runner)
2. **Android Only** - Fast Linux runner  
3. **iOS Only** - Mac runner with TestFlight
4. **Local Machine** - Your own Mac (unrestricted)

## 📱 Distribution Methods

### iOS Distribution
- ✅ **TestFlight** - Automatic distribution to beta testers
- ✅ **Email** - Direct IPA download links
- ✅ **Internal/External** testing groups

### Android Distribution  
- ✅ **Firebase App Distribution** - Beta testing platform
- ✅ **Google Play Internal Testing** - Play Store beta track
- ✅ **Email** - Direct APK download
- ✅ **APK + AAB** builds for all distribution methods

## 🔧 Required Environment Variables

### Core App Variables (dreamweave_env group)
```bash
EXPO_PUBLIC_SUPABASE_URL=https://okdirveyorptfzvmtbsu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EXPO_PUBLIC_API_URL=http://172.24.135.249:5000
```

### iOS Credentials (ios_credentials group)
```bash
# Apple Developer
DEVELOPMENT_TEAM=YOUR_TEAM_ID
APP_STORE_CONNECT_ISSUER_ID=your-issuer-id
APP_STORE_CONNECT_KEY_ID=your-key-id
APP_STORE_CONNECT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----

# Code Signing
IOS_DISTRIBUTION_CERTIFICATE=base64-encoded-p12-file
IOS_DISTRIBUTION_CERTIFICATE_PASSWORD=certificate-password
IOS_PROVISIONING_PROFILE=base64-encoded-mobileprovision-file
```

### Android Credentials (android_credentials group)
```bash
# Android Keystore
ANDROID_KEYSTORE=base64-encoded-keystore.jks
ANDROID_KEYSTORE_PASSWORD=keystore-password
ANDROID_KEY_ALIAS=key-alias
ANDROID_KEY_PASSWORD=key-password

# Google Play (for Play Store distribution)
GOOGLE_PLAY_CREDENTIALS=base64-encoded-service-account.json

# Firebase (for App Distribution)
FIREBASE_TOKEN=firebase-cli-token
FIREBASE_ANDROID_APP_ID=1:123456789:android:abcdef
```

## 🎯 Workflow Selection Guide

### For Quick Android Testing
**Use: `android-only-workflow`**
- Fastest build (Linux runner)
- Direct APK download
- Firebase App Distribution

### For iOS TestFlight Distribution  
**Use: `ios-only-workflow`**
- Automatic TestFlight upload
- Beta group distribution
- Mac runner required

### For Both Platforms
**Use: `ios-android-workflow`**
- Complete iOS + Android build
- All distribution methods
- Longest build time (~30-45 min)

### For Unrestricted Builds
**Use: `local-runner-workflow`**
- Your own Mac machine
- No build time limits
- Full control over environment

## 📦 What Gets Built

### iOS Outputs
- ✅ **IPA file** - Ready for TestFlight/App Store
- ✅ **dSYM file** - For crash reporting
- ✅ **Automatic TestFlight** upload

### Android Outputs  
- ✅ **APK file** - Direct device install
- ✅ **AAB file** - Google Play upload
- ✅ **ProGuard mapping** - For crash reports
- ✅ **Firebase distribution** - Beta testing

## 🔄 Setup Process

### 1. Code Signing Setup

**iOS:**
1. Generate certificates in Apple Developer portal
2. Create App Store Connect API key
3. Export certificates as base64
4. Add to Codemagic environment variables

**Android:**
1. Generate keystore with `keytool`
2. Encode keystore as base64
3. Set up Google Play service account (optional)
4. Add credentials to Codemagic

### 2. Distribution Platform Setup

**TestFlight:**
- Automatic with App Store Connect integration
- Create beta testing groups in App Store Connect

**Firebase App Distribution:**
1. Create Firebase project
2. Generate Firebase CLI token: `firebase login:ci`
3. Get Android app ID from Firebase console
4. Add testers to Firebase project

**Google Play:**
1. Create service account in Google Cloud Console
2. Grant permissions in Google Play Console
3. Download service account JSON
4. Base64 encode and add to Codemagic

### 3. Environment Variable Groups

In Codemagic UI:
1. Go to Teams → Your Team → Environment Variables
2. Create groups: `dreamweave_env`, `ios_credentials`, `android_credentials`
3. Add all variables listed above
4. Encrypt sensitive values

## 🚀 Triggering Builds

### Automatic Triggers
- Push to `master` or `develop` branch
- Pull request creation
- Runs `ios-android-workflow` by default

### Manual Triggers
1. Go to Codemagic dashboard
2. Select specific workflow
3. Choose branch
4. Start build

## 📧 Getting Your Apps

### Email Distribution
- APK/IPA download links sent automatically
- QR codes for easy mobile download
- Build status notifications

### TestFlight
- iOS app appears in TestFlight automatically
- Invite testers via email in App Store Connect
- Push notifications for new builds

### Firebase App Distribution
- Android testers get email invitations
- Direct install from Firebase console
- Release notes and version tracking

## ⚡ Build Times & Costs

| Workflow | Runner | Time | Cost (approx) |
|----------|--------|------|---------------|
| Android Only | Linux | 15-25 min | $1-2 |
| iOS Only | Mac M2 | 20-30 min | $3-4 |
| iOS + Android | Mac M2 | 35-45 min | $5-6 |
| Local Machine | Your Mac | Variable | Free |

## 🔧 Troubleshooting

### Build Failures
- Check environment variables are set
- Verify code signing certificates
- Review build logs for specific errors

### Distribution Issues
- Confirm API keys and tokens are valid
- Check App Store Connect/Firebase permissions
- Verify tester email addresses

### Code Signing Problems
- Regenerate certificates if expired
- Ensure provisioning profiles match bundle ID
- Check team ID and developer account status

## 🎉 Success! What You Get

After successful build:
- **iOS IPA** in TestFlight within 10 minutes
- **Android APK** via email download link
- **Firebase distribution** to your beta testers
- **Build artifacts** available for 30 days
- **Crash reporting** symbols uploaded automatically

Your DreamWeave app will be ready for testing on both platforms! 🚀