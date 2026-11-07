# Microfluidic Crypto-Engine Simulator

**Flow / Logic Lab** is a standalone, offline-first educational app for Android and Windows. It visualizes the concept in the supplied project notes: text is encoded into bits, bits select modeled pump pulses, a logic maze transforms the stream, an optical threshold reads bits, and the resulting bytes are displayed.

> **Educational model only — not secure cryptography and not a hardware simulator.** The demonstration uses repeated-key XOR, which is trivial to reverse and must not protect real information. No water, pump, valve, chip, laser, photodiode, or circuit is connected. Do not enter passwords, secrets, personal records, or production data.

The interface is in English. It works locally without a server or network connection. User input and simulation traces are processed in the app; exporting a JSON run log saves a local file.

## Windows download

Download the [Windows x64 portable ZIP](https://github.com/Anggass-piw/microfluidic-crypto-engine/releases/download/v1.0.0/Microfluidic-Crypto-Engine-Simulator-Windows-x64.zip), extract the entire archive, then run `Microfluidic Crypto-Engine Simulator.exe` inside the extracted `MicrofluidicCryptoEngine` folder. Keep its runtime files beside the executable. The unsigned build may trigger Windows SmartScreen; target-OS runtime verification is still required.

## What the app does

1. **Text encoder:** encodes the message and demonstration key as UTF-8 bytes, then reads each byte most-significant bit first. Input is limited to 96 UTF-8 bytes; the key can be up to 24 characters in the interface.
2. **Pump mapping:** maps input bit `0` to an illustrative 18 kPa / 80 ms pulse and bit `1` to 32 kPa / 150 ms. These values are invented for visualization, not pump requirements or calibration.
3. **Logic maze:** applies `cipherBit = inputBit XOR repeatedKeyBit` on the main path. A side branch counts `inputBit AND keyBit` as a diagnostic; it does not change the output.
4. **Optical sensor:** assigns a synthetic light level of 24 to output `0` and 76 to output `1`. The adjustable threshold reads the level back as a bit. Raising the threshold above 76 demonstrates misses and a failed round-trip check.
5. **Output:** shows sensor bytes in hexadecimal, summary metrics, a bit-by-bit pump pulse strip, and a demonstration decode using the same repeated key. A JSON trace can be exported on the device.

The model does **not** simulate fluid dynamics, viscosity, channel geometry, hydraulic collisions, pump response, PWM electronics, photodiode behavior, or Navier–Stokes equations. “Flow” and “pressure” are illustrative labels for a bitstream visualization. No model output should be used to design or operate hardware.

## Run locally

Requirements: Node.js 20+ for the test and Windows wrapper commands. The front end itself is static HTML/CSS/JavaScript and has no runtime dependencies.

```sh
npm test
```

The tests cover the expected round trip, UTF-8 bytes, bit-to-pulse mapping, sensor threshold misses, and input validation.

## Android app

The Android project is a native Java `WebView` shell that bundles the same local UI. It requests no network, camera, storage, or hardware permissions.

Requirements: Android Studio or Android SDK (platform 35 and build tools 35.0.0), Java 17+, and Gradle 8.9. The Android Gradle plugin is 8.7.3.

```sh
npm run build:android
```

The script copies `web/` into Android assets and builds a debug APK. The Gradle wrapper is included; if the wrapper is absent, put `gradle` on `PATH` or set `GRADLE_BIN` to its executable. The APK is a debug build for local testing or sideloading, not a Play Store-ready release. It is created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

To create a signed release APK, configure your own signing credentials in a local Gradle properties file and add a release signing configuration. Do not commit secrets or signing keys.

## Windows app

The Windows desktop app is Electron and loads the local UI from its packaged files. Node integration is disabled, context isolation and sandboxing are enabled, and the app has no backend service.

Requirements: Node.js 20+ and npm. From this project directory:

```sh
npm install
npm test
npm run start:windows
```

The Windows executable is unsigned because no code-signing certificate was configured, so Windows SmartScreen may show a warning on first launch. Build an unpacked Windows x64 desktop application (contains the `.exe` and required runtime files) with:

```sh
npm run build:windows
```

The output is under `dist/win-unpacked/`. On Windows, create an NSIS installer with `npm run build:windows-installer`. Building an NSIS installer on Linux may require Wine; the unpacked Windows build is the portable target used by this project.

## Project layout

```text
web/                       Shared offline app UI and simulation engine
android/                   Native Android WebView shell and Gradle build
electron/                  Electron main process for Windows
scripts/                   Asset copy and Android build helpers
tests/                     Node.js unit tests for the simulation model
```

## Data and security notes

- This is a toy XOR transformation with a repeating key, **not** a cryptographic cipher. It offers no meaningful secrecy, integrity, authentication, or key management.
- The simulator runs the same deterministic calculation every time for the same input/key/threshold. The animation is visual only.
- The app contains no analytics, account system, remote API, or data upload. A run-log export includes the entered text and demo key, so only export non-sensitive examples.
- The Android manifest deliberately has no `<uses-permission>` entries. The desktop wrapper does not expose Node APIs to the page.
- This source tree is separate from the Tangible Ricci Flow and Acoustic Matrix Solver concepts. Windows binaries are distributed through GitHub Releases, not committed to the source tree.

## License

Released under the MIT License. See `LICENSE`.
