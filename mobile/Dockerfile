FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    wget \
    unzip \
    git \
    curl \
    nodejs \
    npm

# Download compatible Android SDK tools
RUN mkdir -p /opt/android-sdk
WORKDIR /opt/android-sdk
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip
RUN unzip commandlinetools-linux-7583922_latest.zip
RUN mkdir -p cmdline-tools/latest
RUN mv cmdline-tools/* cmdline-tools/latest/ || true

ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# Accept Android licenses and install required packages
RUN yes | sdkmanager --licenses
RUN sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

WORKDIR /workspace