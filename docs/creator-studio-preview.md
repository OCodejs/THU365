# THU365 Creator Studio — Preview

## Scope

This branch introduces a focused Creator Studio interface refresh for the existing THU365 web prototype. It does not replace the existing PWA or native camera implementation.

## Prototype interactions

- Select one of the three timeline clips; the active clip receives a visible selection state.
- Choose a color filter and preview it on the portrait reference.
- Select a cover frame and edit a local caption draft.
- Choose one of the bundled demo sound labels.
- Add a text overlay or a demo sticker.
- Open the export review sheet and continue to the existing share-review screen.
- The preview canvas is vertical 9:16 and designed for one-handed mobile use.

## Visual system

- Premium near-black interface.
- Square corners for all controls and panels.
- High-contrast lime accent for active states and primary actions.
- Monospace labels and compact touch controls.
- Responsive layout for narrow iPhone viewports and Android devices.

## Platform status

| Area | Status |
| --- | --- |
| Web prototype | UI and local interactions |
| iOS native | Existing Expo camera/permission prototype; Creator Studio not yet ported |
| Android native | Existing Expo camera/permission prototype; Creator Studio not yet ported |
| Realtime face tracking | Not implemented in this branch |
| GPU effects / AI inference | Not implemented in this branch |
| Video timeline rendering/export | UI prototype only; no encoded video output |
| TikTok integration | Not implemented; requires official platform access and review |

## Privacy and cost constraints

- No API secrets are added.
- No paid SDK, cloud service, or billing-enabled service is introduced.
- No user media is uploaded by this UI refresh.
- The existing app and data are preserved.
- This branch is intended for Preview and review only; do not merge or deploy to Production without explicit approval.

## Validation

The repository's existing `.github/workflows/thu365-mobile-check.yml` validates the native Expo app when native paths change. This branch changes the web prototype, so validate the web workspace using its existing typecheck and build scripts in CI or a Preview environment before treating the prototype as verified.
