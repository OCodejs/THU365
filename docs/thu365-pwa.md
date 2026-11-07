# THU365 PWA

The installable browser app is served from /thu365/ in the mockup sandbox.

## Install on iPhone

1. Open the HTTPS /thu365/ URL in Safari (not an embedded browser).
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. If shown, enable **Open as Web App**, then tap **Add**.
5. Launch THU365 from the new Home Screen icon.
6. Allow camera access when iOS prompts. The microphone is not requested during first-run setup; it is requested only when the user starts a video recording with sound.

## Current browser features

- Live camera preview through getUserMedia after the camera permission flow.
- Front/rear camera switching where supported by the device.
- Local photo capture with lightweight brightness/saturation and color-filter fallback.
- Face Landmarker and Skin Segmentation enhancements when the model runtime and model files load successfully.
- AI model downloads are validated and stored in Cache Storage. Each model download has a 90-second timeout.
- If AI models cannot be downloaded or initialized, basic camera preview, color filters and photo capture remain available. Face tracking, skin segmentation and AI-dependent video effects remain unavailable until the models load.
- Video recording requests microphone permission only when the user starts recording with sound. Recording requires the processed-effects pipeline to be ready; the app does not silently record raw video as if effects were applied.
- Photo/video selection through the browser's file picker.
- Save/share using the Web Share API when supported, with a download fallback.
- PWA app shell and same-origin asset caching for repeat visits.

## Privacy and limitations

- Media is held in browser memory/object URLs for the current session. The app does not upload it to a server or provide cloud backup.
- Saving/export is user initiated. On iOS, use the share sheet to choose **Save Image** or **Save to Files**.
- Face tracking and skin segmentation require the MediaPipe JS/WASM runtime from the pinned CDN and valid model files from Google Cloud Storage. First setup requires a network connection.
- If a model host, CORS policy, browser cache or network connection fails, the app falls back to basic camera and color-filter mode instead of blocking the camera.
- iOS browser camera APIs require HTTPS and a compatible Safari version. Camera and microphone prompts are controlled by iOS.
- The service worker caches the app shell and same-origin resources as they are requested. The first visit requires network access.
- This is a PWA, not an Apple-signed IPA or App Store release.
