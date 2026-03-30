# MyDem

React Native (TypeScript) app with a **custom native module** on Android (Kotlin) and iOS (Swift). It reads battery + device info once on demand and **streams accelerometer + battery updates** over events. State is handled with **Redux Toolkit**.

## Prerequisites

| Tool | Notes |
|------|--------|
| Node.js | v20+ |
| JDK | 17+ (Android Gradle) |
| Android SDK | Via Android Studio or command-line tools; emulator or USB device |
| Xcode | 15+ for iOS |
| CocoaPods | `pod install` under `ios/` |

---

## Steps to run (first time)

### 1. Install JavaScript dependencies

```bash
yarn | npm install 
```

### 2. iOS — install pods

```bash
cd ios && pod install && cd ..
```

### 3. Start Metro (JavaScript bundler)

```bash
npm start
```

Leave this terminal open.

### 4a. Run on Android

Open a **second** terminal:

```bash
npx react-native run-android
```

If you changed **any Kotlin/Java** file or the native module still says “not linked”, do a clean rebuild:

```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

**Note:** Hot reload / Fast Refresh only updates JS. It does **not** rebuild native code.

### 4b. Run on iOS

```bash
npx react-native run-ios
```

First Xcode build can take several minutes.

---

## Using the app

1. Device tab — taps the native module once for a **snapshot** (battery + device fields). Shows loading → success or error; Refresh / Try again repeat the call.
2. Live tab — calls native `startTelemetryStream`, subscribes to **`DeviceTelemetryUpdate`** events, and updates Redux (battery debounced, motion throttled). Leaving the tab stops the stream.

---

## Project layout (short)

| Area | Path |
|------|------|
| Android native module | `android/app/src/main/java/com/mydem/telemetry/` |
| iOS native module | `ios/MyDem/DeviceTelemetry.swift`, `ios/MyDem/DeviceTelemetry.m` |
| JS bridge + types | `src/native/deviceTelemetry.ts`, `src/types/deviceTelemetry.ts` |
| Redux | `src/store/deviceTelemetrySlice.ts`, `src/store/index.ts` |
| Screens | `src/screens/DeviceInfoScreen.tsx`, `src/screens/LiveTelemetryScreen.tsx` |
| Entry | `index.js` → `src/App.tsx` |

---

## Native API (JavaScript)

| Native method | Role |
|---------------|------|
| `getDeviceSnapshot()` | Promise → one-shot map with `battery` + `device` |
| `startTelemetryStream()` | Promise → start sensors + battery updates |
| `stopTelemetryStream()` | Promise → tear down |

**Event name:** `DeviceTelemetryUpdate`  
**Payload shape:** `{ kind: 'battery' \| 'motion', payload: { ... } }`

---

## Assets (icon & splash)

- Source images live under `assets/images/` 
- After changing icons or launch images, rebuild the native app (same as any other native change).

---

## Tests

```bash
npm test
```

---

## Android release build: APK 

This project is set up to produce a **signed `.apk`** for sideloading or sharing.

| What you get | Gradle task | Output file |
|--------------|-------------|-------------|
| **APK** | `assembleRelease` | `android/app/build/outputs/apk/release/app-release.apk` |
| AAB (Play Store upload) | `bundleRelease` | `android/app/build/outputs/bundle/release/app-release.aab` |

Build the APK:

```bash
cd android
./gradlew assembleRelease
```

Install on a device with USB debugging:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```





