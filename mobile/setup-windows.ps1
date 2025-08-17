# DreamWeave Windows Setup Script
Write-Host "🌙 Setting up DreamWeave for Android build..." -ForegroundColor Cyan

# Create basic package.json
$packageJson = @"
{
  "name": "dreamweave-mobile",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "build": "expo build"
  },
  "dependencies": {
    "@expo/vector-icons": "^13.0.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "expo": "~49.0.0",
    "expo-av": "~13.4.1",
    "expo-sqlite": "~11.3.3",
    "expo-status-bar": "~1.6.0",
    "react": "18.2.0",
    "react-native": "0.72.10",
    "react-native-paper": "^5.11.6",
    "react-native-safe-area-context": "4.6.3",
    "react-native-screens": "~3.22.0"
  }
}
"@

Write-Host "📦 Creating package.json..." -ForegroundColor Yellow
$packageJson | Out-File -FilePath "package.json" -Encoding UTF8

# Create app config
$appConfig = @"
export default {
  expo: {
    name: "DreamWeave",
    slug: "dreamweave-mobile",
    version: "1.0.0",
    orientation: "portrait",
    android: {
      package: "com.dreamweave.mobile",
      permissions: ["RECORD_AUDIO"]
    }
  }
};
"@

Write-Host "⚙️ Creating app.config.js..." -ForegroundColor Yellow
$appConfig | Out-File -FilePath "app.config.js" -Encoding UTF8

Write-Host "🔧 Installing dependencies..." -ForegroundColor Green
npm install

Write-Host "🏗️ Generating Android project..." -ForegroundColor Green
npx expo prebuild --platform android --clean

Write-Host "✅ Setup complete! Now you can:" -ForegroundColor Green
Write-Host "1. Open Android Studio" -ForegroundColor White
Write-Host "2. File -> Open -> This folder" -ForegroundColor White  
Write-Host "3. Build -> Generate Signed Bundle/APK" -ForegroundColor White