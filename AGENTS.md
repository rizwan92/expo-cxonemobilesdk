# Agent Guide for expo-cxonemobilesdk

This repository exposes a thin Expo module around the native CXoneChat iOS SDK.
Use this guide when adding or modifying functionality so changes stay consistent
across Swift, TypeScript, podspecs, and the example app.

## Layout Overview

- Native module (iOS)
  - `ios/ExpoCxonemobilesdkModule.swift`
    - Exposes JS-callable methods: `prepare`, `connect`, `disconnect`.
    - Uses `CXoneChat.shared.connection` APIs.
    - Logs with `NSLog("[ExpoCxonemobilesdk] …")` for traceability.
    - No events and no native views are currently enabled.
- iOS packaging
  - `ios/ExpoCxonemobilesdk.podspec`
    - Vendors required XCFrameworks under `ios/Frameworks`.
  - `nice-cxone-mobile-sdk-ios/scripts/build_all_xcframeworks.sh`
    - Builds XCFrameworks for `CXoneChatSDK` and its dependencies.
    - Copies outputs into `ios/Frameworks`.
  - `nice-cxone-mobile-sdk-ios/scripts/build_spm_xcframework.sh`
    - Low-level helper used by the build-all script.
  - `stubs/*`
    - Minimal stub packages used to avoid building macro-heavy deps (optional).
- TypeScript bindings
  - `src/ExpoCxonemobilesdkModule.ts`
    - JSI binding via `requireNativeModule("ExpoCxonemobilesdk")`.
    - Declares the TS signatures for the native functions.
  - `src/ExpoCxonemobilesdk.types.ts`
    - Module event/type definitions (currently empty events).
  - `src/index.ts`
    - Re-exports the TS module and types.
- Example App
  - `example/App.tsx`
    - Demonstrates calling `prepare`, `connect`, `disconnect` with console logs.

## Add a New Native Function (Checklist)

1) iOS (Swift)
- File: `ios/ExpoCxonemobilesdkModule.swift`
  - Add a `Function("name")` or `AsyncFunction("name")`.
  - Call into the appropriate `CXoneChat` API.
  - Log start/success/failure with `NSLog("[ExpoCxonemobilesdk] …")`.
  - Convert/validate inputs (e.g., `Environment(rawValue: env.uppercased())`).

2) TypeScript
- File: `src/ExpoCxonemobilesdkModule.ts`
  - Add the new method’s TS signature to the `NativeModule` declaration.
  - Ensure parameter types match Swift (e.g., `brandId: number` if Swift expects `Int`).
- File: `src/ExpoCxonemobilesdk.types.ts`
  - If adding events, declare them here as a map from event name → handler type.

3) Example App
- File: `example/App.tsx`
  - Add a button or handler to invoke the new method.
  - Log before/after, and catch errors with `console.error`.

4) Dependencies & Packaging (if required)
- If the new method requires additional native dependencies:
  - Add corresponding XCFrameworks into `ios/Frameworks`.
  - Update `ios/ExpoCxonemobilesdk.podspec` to include them under `s.vendored_frameworks`.
  - (If building from source) run:
    - `cd nice-cxone-mobile-sdk-ios`
    - `./scripts/build_all_xcframeworks.sh Release ../ios/Frameworks`
  - Then reinstall pods in the example app: `cd ../example/ios && pod install`.

## Adding Events (Only if Needed)
- Swift: In `ios/ExpoCxonemobilesdkModule.swift`, add `Events("eventName")` at the top
  of `definition()` and emit using `self.sendEvent("eventName", payload)`.
- TypeScript: Add the event and payload type to `src/ExpoCxonemobilesdk.types.ts`.
- Example App: Use `useEvent(ExpoCxonemobilesdk, "eventName")` to subscribe.

## Logging Guidelines
- Swift: Use `NSLog("[ExpoCxonemobilesdk] …")` for all native logs. Include inputs
  and errors.
- JS: Log at the call sites (e.g., `example/App.tsx`) before and after calls. Use
  `console.error` on failures. Use a consistent tag like `[ExpoCxonemobilesdkExample]`.

## Platform Support
- This package targets native (iOS). No web module is shipped. Do not re-introduce
  `src/ExpoCxonemobilesdkModule.web.ts` unless explicitly needed.

## Do / Don’t
- Do: Keep API surface focused on chat functionality: `prepare`, `connect`, `disconnect`.
- Do: Keep types aligned between Swift and TypeScript.
- Do: Update the example app to reflect any new API.
- Don’t: Re-add previous sample pieces (e.g., `PI`, `setValueAsync`, native view) unless
  there is a product requirement.

## Quick Build Steps
- Build XCFrameworks and copy:
  - `cd nice-cxone-mobile-sdk-ios`
  - `./scripts/build_all_xcframeworks.sh Release ../ios/Frameworks`
- Install pods & run example:
  - `cd ../example/ios && pod install`
  - `npx expo run:ios`

## Known Pitfalls
- Missing dependent Swift modules (e.g., `CXoneGuideUtility`, `Mockable`) will cause
  `failed to build module` errors if not present as XCFrameworks.
- `Environment` must be one of the SDK’s uppercased cases (e.g., `NA1`, `EU1`).
- `brandId` is an `Int` in Swift; pass a `number` from TypeScript.

