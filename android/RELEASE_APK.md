# Build a signed release APK (MyDem)

## What was set up in this repo

1. **Keystore file (not in git)**  
   Path: `android/keystore/mydem-release.keystore`  
   Format: PKCS12  
   Alias: `mydem-release`  
   Validity: 10,000 days (~27 years)

2. **Signing config (not in git)**  
   Path: `android/keystore.properties`  
   Gradle reads this and wires `signingConfigs.release`.  
   Example template (safe to commit): `android/keystore.properties.example`

3. **`android/app/build.gradle`**  
   If `keystore.properties` exists → release uses your keystore.  
   If it is missing → release falls back to the debug keystore (only for local experiments).

---

## Passwords

Passwords live only in your local `android/keystore.properties` (gitignored). Pick a strong password when you run `keytool`, and use the same value for store and key with PKCS12.

**Before Play Store:** treat the keystore as a production secret; back it up safely. Losing it means you cannot ship updates under the same signing key.

**Public GitHub:** never commit `keystore.properties` or release keystores; never paste passwords in README.

---

## Steps to build the APK

From the **project root**:

```bash
cd android
./gradlew assembleRelease
```

Output APK:

```
android/app/build/outputs/apk/release/app-release.apk
```

Install on a device (optional):

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

## If you start on a new laptop / teammate clone

The keystore and `keystore.properties` are **gitignored**. Either:

- Copy `mydem-release.keystore` + `keystore.properties` securely, or  
- Generate a **new** keystore (see below) and update `keystore.properties`.

---

## Create a new keystore from scratch (reference)

```bash
cd android
mkdir -p keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore keystore/mydem-release.keystore \
  -alias mydem-release \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "YOUR_STRONG_PASSWORD" \
  -dname "CN=Your Name, OU=Your Team, O=Your Company, L=City, ST=State, C=IN"
```

Then create `android/keystore.properties`:

```properties
storePassword=YOUR_STRONG_PASSWORD
keyPassword=YOUR_STRONG_PASSWORD
keyAlias=mydem-release
storeFile=keystore/mydem-release.keystore
```

(PKCS12: store and key password are the same.)

---

## Play Store note

Publishing usually uses an **AAB** (App Bundle), not only APK:

```bash
cd android
./gradlew bundleRelease
```

Output:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Same signing config applies.
