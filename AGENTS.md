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
    - Declares the native module and an optional Swift Package dependency on `nice-cxone-mobile-sdk-ios`.
    - Current strategy: prefer declaring the SDK as an SPM dependency in the podspec and use an Expo config-plugin in the example app to ensure the app project resolves the package product for the app/main target. This avoids relying on the `cocoapods-spm` plugin.
    - Alternative (binary vendoring): you may still choose to vendor a prebuilt `ios/Frameworks/CXoneChatSDK.xcframework` and set `s.vendored_frameworks` in the podspec. That approach is the most robust for consumers who can't or don't want to rely on SPM resolution during CocoaPods install.

  - Config plugin (SPM injection)
    - File: `plugins/addSPMDependenciesToMainTarget.js`
      - An Expo config plugin that injects an `XCRemoteSwiftPackageReference` and `XCSwiftPackageProductDependency` into the example app Xcode project at `expo prebuild` time so the app target links the `CXoneChatSDK` product.
      - Registered in `example/app.json` (see example) and runs automatically during `npx expo prebuild`.
    - Why we use it: it lets the example app (and dev machines) resolve the SPM product for the app target without requiring the `cocoapods-spm` Ruby plugin. It keeps SPM usage local to Xcode and the app, while the module's podspec also declares the SPM dependency so packaged consumers can opt-in to alternate flows.
    - Location: `plugins/addSPMDependenciesToMainTarget.js` (already added in this repo). The plugin accepts options: `version`, `repositoryUrl`, `repoName`, and `productName`.

  - Notes on linking & autolinking
    - After `expo prebuild` (or when running `pod install`/`yarn ios`), the example app must include the module package in `example/node_modules` so `expo-modules-autolinking` can include it in the generated `ExpoModulesProvider.swift`.
    - Run these commands when developing locally:
      - `yarn` (from `example/`) — installs the local package into `node_modules`
      - `npx expo prebuild -p ios` — runs config plugins and regenerates native projects
      - `cd ios && pod install --repo-update` — installs Pods and resolves podspec SPM dependencies where supported
      - `yarn ios` or open the workspace in Xcode and build.
    - If CocoaPods does not resolve the podspec's SPM dependency on your machine (older CocoaPods), either upgrade CocoaPods (recommended) or vendor an XCFramework as a fallback.
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

1. iOS (Swift)

- File: `ios/ExpoCxonemobilesdkModule.swift`
  - Add a `Function("name")` or `AsyncFunction("name")`.
  - Call into the appropriate `CXoneChat` API.
  - Log start/success/failure with `NSLog("[ExpoCxonemobilesdk] …")`.
  - Convert/validate inputs (e.g., `Environment(rawValue: env.uppercased())`).

2. TypeScript

- File: `src/ExpoCxonemobilesdkModule.ts`
  - Add the new method’s TS signature to the `NativeModule` declaration.
  - Ensure parameter types match Swift (e.g., `brandId: number` if Swift expects `Int`).
- File: `src/ExpoCxonemobilesdk.types.ts`
  - If adding events, declare them here as a map from event name → handler type.

3. Example App

- File: `example/App.tsx`
  - Add a button or handler to invoke the new method.
  - Log before/after, and catch errors with `console.error`.

## Modularity Guidelines (Swift + TypeScript)

As we expand CXoneChatSDK coverage, avoid putting all logic in a single file. Group related functionality into small, focused files.

Swift (iOS)

- Keep `definition()` in `ios/ExpoCxonemobilesdkModule.swift` minimal.
- Add feature-focused Swift files in `ios/` (or subfolders) that each return the definitions used by `definition()` (e.g., connection, threads, messages, analytics).
- Keep logging and error mapping in those helpers.

TypeScript

- Keep `src/ExpoCxonemobilesdkModule.ts` as the typed native binding only.
- Add `src/api/` wrappers per feature (e.g., `connection.ts`, `threads.ts`, `messages.ts`) that call the native module and implement logging, argument shaping, and error handling.
- Re-export your public API from `src/index.ts`.

## Return Shape and Typing Strategy (SDK JSON First)

Goal: For values that originate in CXoneChatSDK (threads, messages, agents, states), prefer returning the full native payload as JSON so we don’t lose information when the SDK evolves. Keep the JavaScript surface permissive by default to avoid breaking changes when the SDK adds fields.

Swift (iOS)

- Prefer returning `[String: Any]` (JSON-serializable dictionaries) for SDK objects rather than mapping to narrow primitives.
- When feasible, include “full details” variants that return everything the SDK exposes (e.g., `threadsGetFullDetails`).
- Log the full JSON (pretty printed) when adding new endpoints so we can shape TS helpers later: `NSLog("[ExpoCxonemobilesdk] …\n<json>")`.
- Keep small helpers to extract common fields, but do not strip properties from the returned JSON.

TypeScript

- In `src/ExpoCxonemobilesdkModule.ts` declare return types as broad JSON shapes, e.g. `Record<string, any>` or dedicated interfaces with index signatures.
- In `src/api/*` you MAY add optional “curated” helpers that parse the JSON into stricter types for app code, but the native binding should tolerate unknown fields.
- Favor forward-compatible types over strict enums for SDK-driven fields (use `string` plus docs, or union with fallback `string`).

Examples

- Threads
  - Native: `threadsCreate` returns the full thread JSON (id, state, assignedAgent, messages, scrollToken, etc.).
  - TypeScript: the binding type can be `Record<string, any>` or a permissive `ChatThreadDetails` that allows unknown keys.
  - Optional: expose both `threadsGetDetails` (light) and `threadsGetFullDetails` (heavy) for performance-sensitive surfaces.

Breaking changes policy

- This repository is in early development; prefer forward-compatibility. If adding a new field from the SDK, return it as-is in JSON. Do not remove existing fields without a deprecation note.

Example App

- Mirror the modular structure in `example/App.tsx` with sections per feature and call into `src/api/*` so the example exercises the same public API you ship.

README

- Keep concise: quickstart, supported features, and a link to the fork that generates the XCFramework.
- Update the features list and minimal usage snippets when adding new APIs.

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
