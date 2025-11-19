# Setup

Follow this guide to install `expo-cxonemobilesdk`, configure native dependencies, and run the bundled example app.

## Install the package

```bash
yarn add expo-cxonemobilesdk
# or
npm install expo-cxonemobilesdk
```

The module requires Expo Modules infrastructure (already present in Expo projects). If you are using bare React Native, follow [the Expo Modules install guide](https://docs.expo.dev/bare/installing-expo-modules/).

## iOS requirements

1. After installing the package, run `npx pod-install` (or `npx expo run:ios`, which installs pods implicitly).
2. The podspec (`ios/ExpoCxonemobilesdk.podspec`) declares the CXoneChatSDK via `spm_dependency`, which requires CocoaPods **1.11+**. Minimum iOS is **15.1**.
3. If CocoaPods cannot resolve the Swift Package, upgrade CocoaPods (recommended) so `spm_dependency` is supported.
4. When developing inside the example app, run `yarn` inside `example/`, then:
   - `npx expo prebuild -p ios` to run config plugins and regenerate Xcode projects.
   - `cd example/ios && pod install --repo-update`.
   - Launch with `yarn ios` or open the workspace in Xcode and build.

## Android requirements

No additional Maven repositories are needed. `expo-cxonemobilesdk` vendors the CXoneChat Android `.aar` artifacts under `nice-cxone-mobile-sdk-android/`, and Gradle references them automatically through the module’s build.gradle. After installing the package, run `yarn android` (or `npx expo run:android`) to let Expo autolinking pick up the module. If you maintain your own fork, update the vendored AARs in that folder before publishing new releases.

> **Manifest tip:** `chat-sdk-core` defines `android:fullBackupContent` in its manifest. If your app already sets `android:fullBackupContent` (for example, via SecureStore backup rules), Gradle will fail during manifest merge. Add the provided config plugin (`"expo-cxonemobilesdk/plugin-android-backup"`) to your Expo config so it automatically sets `tools:replace="android:fullBackupContent"` on your `<application>` element. If you prefer a manual change, follow the XML snippet in [`docs/config-plugin.md`](config-plugin.md#android-withandroidfullbackupfix).

## Config plugin (Swift Package injection)

The repository includes `plugins/addSPMDependenciesToMainTarget.js`, registered in `example/app.json`. It injects the `XCRemoteSwiftPackageReference` + `XCSwiftPackageProductDependency` into the example app target during `expo prebuild` so the `CXoneChatSDK` product links without requiring the `cocoapods-spm` Ruby plugin.

Consumers can opt into the published plugin entry point:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-cxonemobilesdk/plugin-spm",
        {
          "version": "3.1.1",
          "repositoryUrl": "https://github.com/nice-devone/nice-cxone-mobile-sdk-ios.git",
          "repoName": "nice-cxone-mobile-sdk-ios",
          "productName": "CXoneChatSDK"
        }
      ]
    ]
  }
}
```

Keep CocoaPods and SPM linking in sync: either let the podspec handle product linking (recommended) or remove `s.spm_dependency` when the app owns the package reference.

> **Version mismatch warning:** the podspec currently declares `CXoneChatSDK` via `spm_dependency` at `3.1.1`. Use the same `version` in your plugin config (as shown above) or Xcode will fail with “Failed to resolve dependencies … depends on 'nice-cxone-mobile-sdk-ios' 1.x and 3.x”.

See [`docs/config-plugin.md`](config-plugin.md) for a deeper walkthrough, option reference, and verification steps.

## Example environment variables

Copy the template and set your CXone credentials:

```bash
cp example/.env.example example/.env
# edit the values
EXPO_PUBLIC_CHAT_ENV=EU1
EXPO_PUBLIC_CHAT_BRAND_ID=1086
EXPO_PUBLIC_CHAT_CHANNEL_ID=chat_15bf234b-d6a8-4ce0-8b90-e8cf3c6f3748
```

`example/app/config/chat.ts` reads these values via Expo public env variables and passes them to `Connection.prepareAndConnect`.

## Local development workflow

- `yarn` (repo root) and `yarn` (inside `example/`) to install JS dependencies.
- `npx expo prebuild -p ios` (and `-p android` as needed) whenever native sources/config change.
- `cd example/ios && pod install --repo-update` after editing Swift files or podspec settings.
- Use `yarn ios` / `yarn android` to launch the example, or open the native projects directly in Xcode/Android Studio.
