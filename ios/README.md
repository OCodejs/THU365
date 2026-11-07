# THU365 iOS installation and distribution

THU365 supports two installation paths on iPhone.

## 1. Web app / PWA — available now

1. Open the HTTPS site in Safari (not an embedded browser).
2. Tap Share, then Add to Home Screen, then Add.
3. Launch THU365 from the new Home Screen icon.
4. Approve camera access when iOS asks. Microphone is optional for photo mode.
5. The first-run flow downloads and validates required AI models before opening the camera.

A PWA does not create a developer identity and does not need the VPN & Device Management trust screen. Do not follow enterprise certificate instructions for a PWA.

## 2. Native iOS app — Capacitor

The Vite application is wrapped with Capacitor. The Xcode project is generated on macOS by the workflow rather than checked in as generated files.

### Local build on macOS

From artifacts/mockup-sandbox, install dependencies with pnpm and run pnpm build. Then install the native toolchain with pnpm add -D @capacitor/cli@^7.4.3 @capacitor/core@^7.4.3 @capacitor/ios@^7.4.3. Run pnpm exec cap add ios once, then pnpm exec cap sync ios. Open ios/App/App.xcworkspace in Xcode.

In Xcode, select the App target and Signing & Capabilities. Choose your own Apple Developer Team and confirm the Bundle ID com.ocodejs.thu365. Change the ID in capacitor.config.ts if it is unavailable.

### Privacy permissions

The generated iOS Info.plist must include:

- NSCameraUsageDescription: THU365 needs camera access for live beauty effects and photos.
- NSMicrophoneUsageDescription: THU365 uses the microphone when recording videos with sound.
- NSPhotoLibraryAddUsageDescription: THU365 saves photos and videos to your library.

The GitHub Actions workflow inserts these entries. Users must still approve iOS permission prompts themselves.

### Recommended release: TestFlight

1. Enroll in the Apple Developer Program and accept all agreements.
2. Register the Bundle ID in Apple Developer and create an App Store Connect app with the same ID.
3. Create an Apple Distribution certificate and an App Store provisioning profile.
4. Add these GitHub Actions repository secrets. Never commit signing assets:
   - IOS_CERTIFICATE_BASE64: base64-encoded distribution .p12 file.
   - IOS_CERTIFICATE_PASSWORD: password used to export the .p12.
   - IOS_PROVISIONING_PROFILE_BASE64: base64-encoded App Store .mobileprovision profile.
   - APPLE_TEAM_ID: 10-character Apple Developer Team ID.
5. Run the THU365 iOS Build workflow with distribution set to app-store.
6. Download the signed IPA artifact and upload it to App Store Connect, then enable testers in TestFlight.

TestFlight users install through the TestFlight app. They do not manually trust an enterprise developer profile.

### Optional internal IPA distribution

Ad Hoc distribution requires an Ad Hoc provisioning profile containing each test device UDID. Organization-owned Enterprise distribution requires an eligible Apple Developer Enterprise Program account and is restricted to that organization's internal apps. On supported iOS versions, a legitimately installed enterprise app may require the user to verify the organization under Settings → General → VPN & Device Management.

A website or THU365 cannot turn on developer trust, install a certificate silently, or bypass Apple's signing and permission controls. Do not use shared, revoked, unknown, or third-party enterprise certificates.

## Delivery status

- PWA: installable from Safari without a paid Apple account.
- Native source/configuration: prepared in this repository.
- Simulator build: available through the workflow without signing.
- Installable IPA: requires valid Apple signing assets and App Store Connect setup; no signed IPA is claimed to exist yet.
- Camera, WebKit permission prompts, Face Landmarker and AR effects require physical-iPhone testing.
