# AnhThu Beauty integrations

## Product modules
- Album: use the operating system photo picker; request access only to user-selected media.
- Photo editor: local image pipeline; edits remain on-device until the user exports.
- AI sharpening: dedicated super-resolution / denoise inference module. Do not label basic CSS filters as AI restoration.
- AI Beauty: on-device face landmarks and skin segmentation where supported; disclose fallback states.
- Camera & effects: realtime camera pipeline with separately switchable effect providers.

## iOS storage and permissions
An installed iOS web app (PWA) cannot request unrestricted access to the device filesystem or Photos library. Use the native browser file picker for selected media, and Web Share / download export for saving. Explain that the user may need to choose Save Image or Save to Files. Keep private media in app-managed storage only when the user explicitly imports it; provide delete/export controls. Never request camera or microphone until the corresponding feature is invoked.

## Licensed China / Korea effect providers
The app must use documented SDKs or APIs under a valid commercial license. Candidate vendor evaluation (not an assertion that credentials or contracts exist): Meitu / Meitu SDK, FaceUnity, SenseTime, Perfect Corp, and Banuba. Confirm vendor availability, SDK platform support (Web/iOS), pricing, data residency, face-data retention, model redistribution rights, and permitted use before implementation.

Do not scrape effects from TikTok, Douyin, Xiaohongshu, SNOW, B612, or other apps; do not copy proprietary effect assets or reverse-engineer private endpoints.

## Provider adapter contract
Implement a provider-neutral interface before connecting any vendor:
- initialize(config) — initialize only after user consent.
- getCapabilities() — report supported makeup, skin, hair, filters, segmentation and video modes.
- applyFrame(input, settings) — process a frame or return a vendor-defined render handle.
- dispose() — release camera frames, GPU resources and model memory.

Vendor credentials belong in server-side environment variables or a vendor-approved native secure configuration. Never ship private API keys in Vite client bundles. Camera frames should remain on-device unless the user is clearly informed and explicitly opts into a provider's cloud processing.

## Release gates
1. Vendor contract and technical documentation reviewed.
2. iOS Safari / installed PWA compatibility verified on physical devices.
3. Privacy disclosure and consent flow reviewed.
4. Performance, thermal behavior, offline fallback, and media export tested.
5. Provider attribution, SDK licensing and App Store policy reviewed.