# 🌙 DreamWeave Mobile

AI-Powered Dream Journal for Android

## Features

- 🎤 **Voice Recording**: Record your dreams with optimized audio for AI processing
- 🤖 **AI Enhancement**: Sophisticated secondary prompting system for dream analysis
- 📖 **Dream Journal**: Browse and search your saved dreams
- 🎨 **Visual Prompts**: Generate AI prompts for dream imagery
- 🔒 **Privacy First**: Audio processed locally, only enhanced text sent to AI

## Installation

### Download APK

1. Go to the [Releases page](../../releases)
2. Download the latest `app-release.apk`
3. Install on your Android device

### Enable Unknown Sources

1. Go to Android Settings → Security
2. Enable "Install unknown apps" for your browser/file manager
3. Install the downloaded APK

## Development

This is a React Native app built with Expo and optimized for mobile dream journaling.

### Key Components

- **DreamCaptureScreen**: Voice recording and initial dream entry
- **DreamEnhancementFlow**: Sophisticated secondary prompting system
- **DreamJournalScreen**: Browse saved dreams with search
- **DreamDetailScreen**: View and enhance individual dreams
- **PromptConfirmation**: Review AI-generated prompts before submission

### Architecture

- **Frontend**: React Native with Expo
- **Storage**: SQLite for local dream storage
- **Audio**: Expo AV with low-fidelity recording for prompt optimization
- **AI**: OpenAI integration for transcription and prompt enhancement
- **Privacy**: Audio stays on device, only enhanced text transmitted

## Build Status

![Build Status](../../actions/workflows/android-build.yml/badge.svg)

Automated APK builds are generated on every commit and available in the Releases section.