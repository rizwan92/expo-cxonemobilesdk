# expo-cxonemobilesdk

Expo module that wraps the native NICE CXoneChat SDKs and exposes a unified TypeScript API for iOS and Android. The package bundles Swift/Kotlin shims, a config-plugin for Swift Package injection, and an example app built with Expo Router.

## Highlights

- Combined `Connection.prepareAndConnect` entry point with listener-first state management (`chatUpdated`, `connectionError`, etc.).
- Full multithread surface (`Threads.*` + `Thread.*`) including attachments, pre-chat surveys, and typing indicators.
- Customer identity, OAuth, visitor IDs, and custom fields scoped either to the visitor or individual threads.
- Analytics helpers (`viewPage`, `conversion`, …) so you can capture chat funnel metrics directly from React Native.

## Quick start

1. Install the package and its peer tooling:

   ```bash
   yarn add expo-cxonemobilesdk
   npx pod-install
   ```

2. Configure Gradle to resolve the CXone Android artifacts (if you are not relying on the vendored AARs):

   ```gradle
   allprojects {
     repositories {
       maven {
         name 'github-nice-devone-cxone-mobile'
         url 'https://maven.pkg.github.com/nice-devone/nice-cxone-mobile-sdk-android'
         credentials {
           username = project.findProperty('github.user') ?: System.getenv('GPR_USERNAME')
           password = project.findProperty('github.key') ?: System.getenv('GPR_TOKEN')
         }
       }
       // other repos…
     }
   }
   ```

   `android/local.properties` should define:

   ```
   github.user=your_github_username
   github.key=your_github_token
   ```

   Any GitHub token with `read:packages` access works for the public SDK.

3. Connect and send a message:

   ```ts
   import { Connection, Threads, Thread, Customer, Analytics } from 'expo-cxonemobilesdk';

   await Connection.prepareAndConnect('NA1', 1234, 'chat_channel');
   const mode = Connection.getChatMode();

   const created = await Threads.create();
   await Thread.send(created.id, { text: 'Hello from Expo' });
   await Analytics.chatWindowOpen();
   ```

Refer to [`docs/setup.md`](docs/setup.md) for full installation details, optional Swift Package injection via the config-plugin, and example environment variables.

## Documentation

All documentation now lives in [`docs/`](docs/README.md). Start with:

- [`docs/overview.md`](docs/overview.md) — architecture, design principles, and DTO strategy.
- [`docs/connection.md`](docs/connection.md) — combined connection API, configuration helpers, and logging.
- [`docs/threads.md`](docs/threads.md) — multithread operations, pagination, and attachments.
- [`docs/customers.md`](docs/customers.md) — identity, OAuth, visitor IDs, and custom fields.
- [`docs/analytics.md`](docs/analytics.md) — analytics helpers and usage patterns.
- [`docs/events.md`](docs/events.md) — every native event payload and guidelines for listener-first UIs.

Each file spells out the JS helper, native counterpart, and relevant example-app wiring.

## Example app

The `example/` directory is a runnable Expo Router app that exercises all APIs:

```bash
cd example
cp .env.example .env   # fill in your CXone env/brand/channel
yarn
npx expo prebuild -p ios
cd ios && pod install --repo-update
cd ..
yarn ios
```

Shared UI and hooks live in `example/app/components/*` so Router screens stay lightweight. Message rendering is event-driven—no optimistic/pending states in JS.

## Platform dissimilarities

- **Channel configuration** — both platforms return the same JSON shape, but `fileRestrictions.allowedFileSize` may be a number or `{ minKb, maxKb }` depending on what the SDK reports.
- **Customer identity getters** — iOS reads the identity from the SDK provider. Android returns the last value set by JS because the SDK lacks a getter.
- **Thread pagination** — Android’s `Thread.loadMore` resolves with an updated thread snapshot. iOS triggers pagination internally; call `Thread.getDetails` (or rely on `threadUpdated`) for the refreshed messages.
- **Custom field lifetime** — CXone clears customer and thread custom fields on `Connection.signOut()`. Persist values externally and reapply them after reconnecting.

Document new differences here (and update the relevant doc file + TypeScript types) whenever the native SDKs diverge.

## Packaging notes

- iOS vendors `ios/Frameworks/CXoneChatSDK.xcframework` via `ios/ExpoCxonemobilesdk.podspec`. When new binaries are produced from the [maintained fork](https://github.com/rizwan92/nice-cxone-mobile-sdk-ios), copy them into that folder.
- The repo ships a config-plugin (`plugins/addSPMDependenciesToMainTarget.js`) registered in the example app to ensure the app target links the `CXoneChatSDK` Swift Package during `expo prebuild`.

## Contributing

Contributions are welcome! Please follow the [Expo contributing guide](https://github.com/expo/expo#contributing) and keep the docs/ folder updated when you add native/TS APIs.

### Formatting

- `yarn format` / `yarn format:check` — Prettier for JS/TS.
- `brew install swift-format` then `yarn format:swift` / `yarn format:swift:check` — Apple swift-format for Swift.

## Troubleshooting

- After editing Swift files, rerun `pod install` inside `example/ios` so Xcode sees the new sources.
- Build errors referencing `CXoneChatSDK` usually mean the vendored framework is missing or the Swift Package did not link. Re-run the config-plugin via `npx expo prebuild -p ios` or ensure the framework exists under `ios/Frameworks/`.
- If Gradle cannot resolve the Android SDK, double-check the GitHub Packages credentials in `local.properties` and confirm the repository entry lives under every `repositories` block your project uses.
