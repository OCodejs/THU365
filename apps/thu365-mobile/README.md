# THU365 Native Mobile

Expo + React Native native application scaffold for iOS and Android. This app implements issue #4: permission explanations appear before any runtime permission request.

## Run locally

Requirements: Node.js 22.13 or newer, npm, Xcode for iOS builds, and Android Studio for Android builds.

    cd apps/thu365-mobile
    npm install
    npx expo install --check
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

## Data handling in this issue

Camera captures are returned as temporary app-cache URIs. This issue does not upload captures, create a cloud backup, or claim permanent local storage. A future save/export feature must request any additional permission at the point it is used and clearly explain its behavior.

## Native configuration

- iOS usage descriptions are configured through the Expo Camera and Media Library config plugins.
- Android camera, microphone, and photo permissions are declared in app config. Runtime requests remain feature-gated in the app.
- Microphone capture is muted by default and only enabled after a successful microphone permission request.

## Validation still required

Build and run on physical iOS and Android devices, then test: first launch, camera allow/deny, microphone allow/deny/skip, photo access allow/deny/limited, app resume after Settings changes, and camera revocation while the app is backgrounded. A repository commit alone does not prove these device-level scenarios.
