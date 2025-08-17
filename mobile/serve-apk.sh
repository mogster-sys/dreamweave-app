#!/bin/bash

echo "🔍 Checking for APK..."
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    echo "✅ APK found! Setting up download server..."
    
    # Create simple download page
    mkdir -p /tmp/apk-server
    cp "$APK_PATH" /tmp/apk-server/dreamweave.apk
    
    cat > /tmp/apk-server/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>DreamWeave APK Download</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial; padding: 20px; text-align: center; background: #1a1a2e; color: white; }
        .download-btn { 
            background: #7c3aed; color: white; padding: 15px 30px; 
            text-decoration: none; border-radius: 10px; font-size: 18px;
            display: inline-block; margin: 20px;
        }
        .instructions { background: #2d1b69; padding: 15px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🌙 DreamWeave Mobile App</h1>
    <p>AI-Powered Dream Journal</p>
    
    <a href="dreamweave.apk" class="download-btn">📱 Download APK</a>
    
    <div class="instructions">
        <h3>Installation Steps:</h3>
        <ol style="text-align: left; max-width: 300px; margin: 0 auto;">
            <li>Tap "Download APK" above</li>
            <li>Allow download in browser</li>
            <li>Open Downloads folder</li>
            <li>Tap dreamweave.apk</li>
            <li>Allow "Install from unknown sources"</li>
            <li>Tap Install</li>
            <li>Grant microphone permission</li>
        </ol>
    </div>
    
    <p><small>All features work offline • Privacy-first design</small></p>
</body>
</html>
EOF
    
    echo "🌐 Starting download server..."
    echo "📱 Open this URL on your phone: http://172.24.135.249:8000"
    echo "🔗 Download link: http://172.24.135.249:8000/dreamweave.apk"
    echo ""
    
    cd /tmp/apk-server
    python3 -m http.server 8000
    
else
    echo "⏳ APK not ready yet. Build still in progress..."
    echo "💡 Run this script again when build completes."
fi