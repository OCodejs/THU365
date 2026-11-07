# THU365 iOS installation and distribution

THU365 has two iPhone installation paths. They are different products and must not be confused.

## 1. Web app / PWA — available without Apple Developer

1. Open the HTTPS THU365 web URL in Safari (not an embedded browser).
2. Tap Share → Add to Home Screen.
3. If iOS shows **Open as Web App**, enable it.
4. Tap Add and launch THU365 from the Home Screen.
5. Approve camera access when iOS asks. Microphone is optional for photo mode.

A PWA does not install a developer certificate and does not need the VPN & Device Management trust screen. Do not follow enterprise certificate instructions for a PWA.

## 2. Native iOS app — Expo / React Native

The native app source is in apps/thu365-mobile. It uses Expo Camera and Expo Media Library. Its bundle identifier is app.thu365.beautycamera.

The native app currently provides camera capture, permission handling and a basic photo gallery prototype. The advanced web beauty effects and AI face-tracking pipeline have not yet been ported to the native app.

### Build an iOS Simulator app

The GitHub Actions workflow **THU365 iOS Build** can build a simulator app without Apple distribution signing:

1. Open the repository Actions tab.
2. Run THU365 iOS Build.
3. Choose distribution = simulator.
4. Download the THU365-iOS-Simulator-App artifact after the workflow succeeds.

A Simulator .app is for Xcode Simulator; it is not an installable iPhone IPA.

### Build locally on macOS

Requirements: Node.js 22.13+, npm and Xcode.

    cd apps/thu365-mobile
    npm install
    npm install --no-save sharp
    mkdir -p assets
    node -e "require('sharp')('../../artifacts/mockup-sandbox/public/thu365/app-icon.svg').resize(1024,1024).png().toFile('assets/icon.png')"
    npx expo install --check
    npx tsc --noEmit
    npx expo-doctor
    npx expo prebuild --platform ios --no-install --non-interactive
    open ios/THU365.xcworkspace

In Xcode, select the THU365 target, choose your own Apple Developer Team under Signing & Capabilities, and confirm the bundle identifier app.thu365.beautycamera.

### Recommended iPhone distribution: TestFlight

A signed IPA requires an active Apple Developer Program membership, an App Store Connect app, an Apple Distribution certificate and an App Store provisioning profile.

Configure these repository Actions secrets. Never commit signing assets:

- IOS_CERTIFICATE_BASE64 — base64-encoded distribution .p12.
- IOS_CERTIFICATE_PASSWORD — password used to export the .p12.
- IOS_PROVISIONING_PROFILE_BASE64 — base64-encoded App Store provisioning profile.
- APPLE_TEAM_ID — 10-character Apple Developer Team ID.

Then:

1. Open Actions → THU365 iOS Build.
2. Run the workflow with distribution = app-store.
3. Download the THU365-iOS-App-Store-IPA artifact.
4. Upload the IPA to App Store Connect and enable testers in TestFlight.

TestFlight users install through Apple's TestFlight app. They do not manually trust an enterprise developer profile.

### Optional internal IPA distribution

- **Ad Hoc:** requires an Ad Hoc provisioning profile containing the UDID of each registered test device.
- **Apple Developer Enterprise Program:** only eligible organizations may distribute internal apps to their own employees. This is not a public alternative to TestFlight.

For a legitimately installed enterprise app, iOS may require the user to verify the organization under Settings → General → VPN & Device Management. The exact screen depends on the distribution method and iOS version.

A website or THU365 cannot turn on developer trust, install a certificate silently, or bypass Apple's signing and permission controls. Never use shared, revoked, unknown or third-party enterprise certificates.

## Permission policy

| Capability | When THU365 asks | If declined |
| --- | --- | --- |
| Camera | After the user reads the camera explanation and taps Continue | Camera is unavailable; show retry or Settings action |
| Microphone | Only after the user chooses video with sound | Continue with silent video or photo mode |
| Photo library | Only after the user opens the gallery | Return to camera; camera remains usable |

## Delivery status

- PWA: installable from Safari without a paid Apple account.
- Native Expo source/configuration: present in this repository.
- Native icon: generated from the official THU365 SVG logo during the iOS build.
- Simulator build: configured in GitHub Actions; verify with a successful workflow run.
- Signed IPA: requires valid Apple signing secrets and provisioning profile; no signed IPA is claimed to exist until that workflow succeeds.
- Camera, WebKit permission prompts, Face Landmarker and AR effects require physical-iPhone testing.
