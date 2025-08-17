# 🌙 DreamWeave - AI-Powered Dream Journal

An intelligent dream journaling app with Magic: The Gathering-inspired UI, built with React Native, Flask, and Supabase.

## ✨ Features

- **📱 React Native Mobile App** - Cross-platform iOS and Android
- **🎨 MTG-Inspired UI** - Beautiful card-based interface with mood indicators  
- **🗓️ Enhanced Calendar** - Split-screen view with dream previews
- **🤖 AI Image Generation** - OpenAI DALL-E integration for dream visualization
- **☁️ Cloud Storage** - Supabase backend with real-time sync
- **🔒 Privacy-First** - Local processing with secure cloud backup

## 🏗️ Architecture

- **Frontend**: React Native + Expo
- **Backend**: Flask API with OpenAI integration
- **Database**: Supabase (PostgreSQL)
- **CI/CD**: Codemagic for iOS/Android builds

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Expo CLI
- Supabase account
- OpenAI API key

### Quick Start

1. **Clone repository**
```bash
git clone https://github.com/mogster-sys/dreamweave-app.git
cd dreamweave-app
```

2. **Setup mobile app**
```bash
cd mobile
npm install
expo start
```

3. **Setup backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python app.py
```

4. **Environment variables**
Create `.env` files in both `mobile/` and `backend/` directories:

```env
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:5000

# backend/.env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Building for Production

This project uses **Codemagic** for automated iOS and Android builds:

1. Connect this repository to Codemagic
2. Configure environment variables in Codemagic dashboard
3. Choose build workflow:
   - `android-only-workflow` - Fast Android APK (15-20 min)
   - `ios-only-workflow` - iOS TestFlight build (20-30 min)
   - `ios-android-workflow` - Both platforms (35-45 min)

## 🛡️ Security

✅ **Security audit completed** - All API keys use environment variables  
✅ **No hardcoded secrets** - Comprehensive .gitignore protection  
✅ **Input validation** - Rate limiting and sanitization implemented  

## 🎯 Key Components

- **EnhancedCalendar** - Mood-based calendar with dream indicators
- **DreamCard** - MTG-style cards with rich dream content
- **Split-screen Layout** - Calendar + dream content interface
- **AI Integration** - OpenAI image generation and analysis

## 📄 License

MIT License - feel free to use this project for your own dream journaling needs!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

Built with ❤️ for dreamers who want to remember and visualize their nocturnal adventures.