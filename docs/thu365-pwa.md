# THU365 PWA

The installable browser app is served from `/thu365/` in the mockup sandbox.

## Install on iPhone

1. Open the HTTPS `/thu365/` URL in Safari (not an embedded browser).
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. If shown, enable **Open as Web App**, then tap **Add**.
5. Launch THU365 from the new Home Screen icon.

## Current browser features

- Live camera preview through `getUserMedia` after the permission explainer.
- Front/rear camera switching where supported by the device.
- Local photo capture with lightweight brightness/saturation adjustments.
- Video recording with microphone permission requested only when the user starts recording.
- Photo/video selection through the browser's file picker.
- Save/share using the Web Share API when supported, with a download fallback.
- PWA app shell and same-origin asset caching for repeat visits.

## Privacy and limitations

- Media is held in browser memory/object URLs for the current session. The app does not upload it to a server or provide cloud backup.
- Saving/export is user initiated. On iOS, use the share sheet to choose **Save Image** or **Save to Files**.
- The current beauty controls are CSS/canvas adjustments, not an AI face-retouching model.
- iOS browser camera APIs require HTTPS and a compatible Safari version. Microphone and camera prompts are controlled by iOS.
- The service worker caches the app shell and same-origin resources as they are requested. The first visit requires network access.
- This is a PWA, not an Apple-signed IPA or App Store release.
