export default {
  expo: {
    name: "DreamWeave",
    slug: "dreamweave-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain", 
      backgroundColor: "#1a1a2e"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.dreamweave.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1a1a2e"
      },
      package: "com.dreamweave.mobile",
      permissions: [
        "RECORD_AUDIO",
        "WRITE_EXTERNAL_STORAGE", 
        "READ_EXTERNAL_STORAGE"
      ],
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      buildToolsVersion: "34.0.0"
    },
    plugins: [
      [
        "expo-av",
        {
          "microphonePermission": "Allow DreamWeave to record your dreams."
        }
      ]
    ]
  }
};
