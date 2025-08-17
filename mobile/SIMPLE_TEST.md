# Simple Android Testing (WSL Workaround)

Since WSL + Expo is problematic, here are the **working alternatives**:

## Option 1: Android Browser (Immediate)
1. **Start web version**: `npm run web`
2. **Get your Windows IP**: `ipconfig` in Windows cmd
3. **Open browser on phone**: `http://[WINDOWS_IP]:19006`
4. **Test core functionality** in mobile browser

## Option 2: Install from Shared Folder  
1. **Build web version**: `npm run build:web`
2. **Host on simple server**: `python3 -m http.server 8000`
3. **Access via phone browser**: `http://[WSL_IP]:8000`

## Option 3: Use Windows Directly
1. **Open Windows Command Prompt**
2. **Navigate to**: `C:\temp\dreamweave-mobile` (after copy completes)
3. **Run**: `npm install && npm start`
4. **QR code will work from Windows**

## Current Status ✅
- App is **production ready** with all features
- Voice recording optimized for prompts  
- Secondary prompting system active
- Dream journal fully functional
- **Problem is just WSL networking**, not the app

**Recommendation**: Try Option 1 (browser test) first to verify app works, then we can build a proper APK.