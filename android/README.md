# JARVIS • MAHI — Android Application (APK)
**Creator:** Sanam  
**Package:** `com.sanam.mahi`  
**Platform:** Android 8.0+ (API Level 26–34)  
**Language:** Kotlin | Gradle Build System  

---

## 1. Architecture & Conversion Strategy

The Android application uses a **Secure Native WebView Shell with Hardware Audio Bridge**:
- **Why this approach?**  
  JARVIS • MAHI relies on real-time server-side intelligence:
  1. `/api/chat` (Server-side Gemini 3.8 Flash model with protected API keys).
  2. `/api/tts` (Server-side Gemini TTS audio stream).
  3. `/live` (Full-duplex WebSocket connection to Gemini Live audio).
- **Native Android Enhancements:**
  - `PermissionRequest.RESOURCE_AUDIO_CAPTURE`: Automatically grants Web Audio microphone capture to the web client once the Android user grants runtime microphone permissions.
  - `WebAppInterface`: Android `TextToSpeech` bridge callable from JavaScript via `window.AndroidBridge.speakNative(text)` as an offline/hardware audio fallback.
  - `SwipeRefreshLayout` & `ProgressBar`: Native pull-to-refresh and cyberpunk cyan loading bar.
  - `Offline & Error Recovery`: Custom dark cyberpunk offline screen with instant "Retry Connection" and server configuration dialog.
  - `External Intent Routing`: External links (YouTube, TikTok, Google Maps) open directly in the corresponding native Android apps rather than replacing the assistant.

---

## 2. Project Directory Structure

```
android/
├── build.gradle.kts                # Root project build configuration
├── settings.gradle.kts             # Subproject & repository definitions
├── gradle.properties               # JVM memory & AndroidX settings
├── gradlew                         # Linux/macOS Gradle wrapper
├── gradlew.bat                     # Windows Gradle wrapper
├── gradle/wrapper/
│   └── gradle-wrapper.properties   # Gradle 8.5 distribution
└── app/
    ├── build.gradle.kts            # App-level dependencies & SDK configs
    ├── proguard-rules.pro          # Code obfuscation & interface keep rules
    └── src/main/
        ├── AndroidManifest.xml     # App permissions & Activity declarations
        ├── java/com/sanam/mahi/
        │   ├── MainActivity.kt     # Main WebView Activity & lifecycle management
        │   ├── WebAppInterface.kt  # Native TextToSpeech & JavaScript bridge
        │   └── NetworkUtils.kt     # Connectivity diagnostics
        └── res/
            ├── drawable/           # Adaptive launcher & splash vectors
            ├── layout/             # Activity and offline error layouts
            ├── mipmap-anydpi-v26/  # Adaptive application icons
            ├── values/             # Colors, strings, themes
            └── xml/                # Network security & backup policies
```

---

## 3. How to Open and Build in Android Studio

1. **Install Android Studio**:  
   Download the latest [Android Studio Hedgehog / Iguana / Jellyfish](https://developer.android.com/studio).
2. **Open the Project**:  
   - Launch Android Studio.
   - Click **Open** (or **File > Open**).
   - Select the `android/` directory inside this project.
3. **Gradle Sync**:  
   - Android Studio will automatically download Gradle 8.5 and sync the project dependencies.
4. **Build the Debug APK**:  
   - In the top menu, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once completed, click the **locate** popup link.
   - The generated APK is at:  
     `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 4. How to Build via Command Line (Terminal)

### On Windows:
```cmd
cd android
gradlew.bat assembleDebug
```

### On macOS / Linux:
```bash
cd android
chmod +x gradlew
./gradlew assembleDebug
```

The output file will be generated at:
```
app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. How to Install the APK on Your Android Phone

### Method A: Direct File Transfer (Easiest)
1. Copy `app-debug.apk` to your phone via USB cable, Google Drive, WhatsApp, or Telegram.
2. On your phone, tap the `.apk` file in your **Files** or **Downloads** app.
3. If prompted with *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** and toggle **Allow from this source**.
4. Tap **Install** and then **Open** to launch **JARVIS • MAHI**!

### Method B: Via ADB (USB Debugging)
1. Connect your Android phone to your computer with a USB cable.
2. Enable **Developer Options** and **USB Debugging** on your phone.
3. Run the following command in terminal:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

---

## 6. Permissions Explained

| Permission | Purpose |
| :--- | :--- |
| `RECORD_AUDIO` | Required for live voice streaming to Gemini Live AI and voice commands. |
| `INTERNET` | Required to communicate with cloud AI models, weather APIs, and live services. |
| `ACCESS_NETWORK_STATE` | Used to detect offline conditions and provide graceful reconnection prompts. |
| `POST_NOTIFICATIONS` | Used for festival wishes, weather alert reminders, and study notifications (Android 13+). |
| `VIBRATE` | Subtle haptic feedback when tapping voice buttons. |

---

## 7. Build Types & Production Release

- **Debug APK (`assembleDebug`)**: For personal testing and development. Can be installed directly onto any Android phone without signature warnings.
- **Release APK (`assembleRelease`)**: Minified and optimized with ProGuard for maximum performance.
- **Signed AAB (Android App Bundle)**: Required if publishing to the **Google Play Store**. In Android Studio: **Build > Generate Signed Bundle / APK > Android App Bundle**.
