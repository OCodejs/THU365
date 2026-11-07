# THU365 Native Mobile

**Repository:** [OCodejs/THU365](https://github.com/OCodejs/THU365) · [Build workflows](https://github.com/OCodejs/THU365/actions)

[← Back to project README](https://github.com/OCodejs/THU365#readme)

Expo + React Native native application for iOS and Android.

## App icon

The native app uses the official THU365 logo stored at:

    ../../artifacts/mockup-sandbox/public/thu365/app-icon.svg

Expo requires a raster app icon. Generate the 1024×1024 PNG before running Expo diagnostics or prebuild:

    npm install --no-save sharp
    mkdir -p assets
    node -e "require('sharp')('../../artifacts/mockup-sandbox/public/thu365/app-icon.svg').resize(1024,1024).png().toFile('assets/icon.png')"

The generated assets/icon.png is a build artifact and is intentionally not committed. GitHub Actions generates it before validating or building the native app.

## Android test build (no paid signing account)

The repository workflow **THU365 Android test APK** generates a debug-signed APK for device testing.

1. Open the repository's **Actions** tab.
2. Select **THU365 Android test APK** and run it, or open a successful run triggered by a pull request.
3. Download the artifact named THU365-Android-test-...
4. Extract the ZIP and install app-debug.apk on an Android phone. Android may ask you to allow installation from the browser or file manager used to open the APK.

This is a debug/test build, not a Play Store release. It is not compatible with iPhone/iOS.

## iPhone testing

A physical iPhone requires an iOS-signed IPA. TestFlight / Ad Hoc distribution requires Apple Developer signing credentials and an iOS provisioning profile. The repository includes a GitHub Actions workflow for an unsigned iOS Simulator build and a signed App Store IPA, but the signed path requires the repository secrets documented in ../../ios/README.md.

Do not upload Apple certificates or passwords to source control.

For local development, use a Mac with Xcode and an Apple ID signing team, or configure the repository's signing secrets and run the iOS workflow.

## Run locally

Requirements: Node.js 22.13 or newer, npm, Xcode for iOS builds, and Android Studio for Android builds.

    cd apps/thu365-mobile
    npm install
    npm install --no-save sharp
    mkdir -p assets
    node -e "require('sharp')('../../artifacts/mockup-sandbox/public/thu365/app-icon.svg').resize(1024,1024).png().toFile('assets/icon.png')"
    npx expo install --check
    npx tsc --noEmit
    npx expo-doctor
    npx expo start

Use a development build or Expo Go on a physical device to validate camera permissions. Camera hardware is not available in most simulators.

## Permission policy

| Capability | When THU365 asks | If declined |
| --- | --- | --- |
| Camera | After the camera explanation screen and the user taps Continue | Camera is unavailable; show a retry or Settings action. No microphone or photo permission is requested. |
| Microphone | Only after the user selects video with sound and confirms the microphone explanation | Continue with silent video. |
| Photo library | Only after the user opens the gallery and confirms the photo explanation | Return to camera; camera remains usable. |

The gallery permission is restricted to photos (granular photo access). THU365 does not ask for video or audio library access in this flow.

The app refreshes permission status when it returns to the foreground. If a user revokes camera access in system settings, the camera view is removed and the app shows the recovery action. If an optional permission is revoked, the related optional feature is disabled without blocking camera use.

## Data handling and scope

Camera captures are returned as temporary app-cache URIs. This app does not upload captures, create a cloud backup, or claim permanent local storage. The current native camera build is a functional camera/permission prototype; advanced beauty filters, AI face tracking, permanent save/export, and cloud sync are not implemented in the native app yet.
