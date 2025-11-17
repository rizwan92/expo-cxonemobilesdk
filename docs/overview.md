# Overview & Architecture

`expo-cxonemobilesdk` exposes the native NICE CXoneChat SDKs (Swift + Kotlin) behind a single Expo module. The repo is split into a few intentional layers so changes stay aligned across the stack:

- **Native modules** live in `ios/ExpoCxonemobilesdkModule.swift` and `android/src/main/java/expo/modules/cxonemobilesdk/**`. They expose the shared function set (`prepareAndConnect`, `threads*`, customer helpers, analytics, etc.), emit events, and log everything via `NSLog("[ExpoCxonemobilesdk] …")` / Android `Log`.
- **TypeScript bindings** under `src/` keep the native surface thin. The `ExpoCxonemobilesdkModule` file defines the native bridge while `src/api/*` provides ergonomic helpers (`Connection`, `Threads`, `Thread`, `Customer`, `Analytics`). All public types live in `src/types.ts` so DTOs stay in sync with Swift/Kotlin encoders.
- **Packaging** is handled by `ios/ExpoCxonemobilesdk.podspec` and Gradle metadata plus a config-plugin (`plugins/addSPMDependenciesToMainTarget.js`) that injects an `XCRemoteSwiftPackageReference` into the example app when running `expo prebuild`.
- **Example app** under `example/` uses Expo Router and shared components in `example/app/components/*` to exercise the full listener-first API without optimistic JS state.

## Listener-first design

Both platforms emit native events for every state change. Instead of polling, JS code should subscribe to:

- `chatUpdated` for connection state/mode.
- `connectionError` for phase-specific failures (`preflight`, `prepare`, `connect`, `runtime`).
- `threadsUpdated` / `threadUpdated` for thread snapshots.
- `agentTyping`, `customEventMessage`, `contactCustomFieldsSet`, `customerCustomFieldsSet`, `authorizationChanged`, `proactivePopupAction`, `unexpectedDisconnect`, `tokenRefreshFailed`, and `error`.

The JS helpers simply await the initial action (e.g., `await Connection.prepareAndConnect`) and defer long‑running state changes to those events. When adding new flows, prefer emitting events from native code instead of building polling helpers in TypeScript.

## DTO-first payloads

Every payload that originates in CXoneChatSDK (threads, messages, analytics) is serialized via dedicated Swift DTOs in `ios/DTO/*` and mirrored in `src/types.ts`. Keep the JSON forward-compatible by:

- Returning the full SDK payload whenever possible.
- Mapping enums to descriptive primitives (strings, ISO timestamps, booleans).
- Extending TypeScript unions in lockstep with the native DTOs instead of stripping fields in JS.

## Platform dissimilarities

The module keeps the JS surface aligned, but a few differences are inherent to the underlying SDKs:

- **Channel configuration** — both platforms now return the same JSON model, but `fileRestrictions.allowedFileSize` may be a number (iOS) or `{ minKb, maxKb }` (Android) depending on what the SDK exposes.
- **Customer identity getters** — iOS reads identity from the SDK provider; Android returns the last identity set by JS because the SDK does not expose a getter.
- **Thread pagination** — `Thread.loadMore` returns the refreshed thread on Android. On iOS it is fire-and-forget; call `Thread.getDetails` after the event to read the new snapshot.
- **Custom fields lifetime** — CXone clears customer/thread custom fields on `Connection.signOut()`. Reapply them after reconnecting.

Document any new differences inside `README.md` (Platform Dissimilarities) or extend this file when new features diverge.
