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
2. The podspec (`ios/ExpoCxonemobilesdk.podspec`) links the vendored `CXoneChatSDK.xcframework` and can optionally resolve the Swift Package version declared via `s.spm_dependency`. Minimum iOS is **15.1**.
3. If CocoaPods on your machine cannot resolve the Swift Package, either upgrade CocoaPods or continue using the vendored XCFramework by keeping `s.vendored_frameworks` in the podspec.
4. When developing inside the example app, run `yarn` inside `example/`, then:
   - `npx expo prebuild -p ios` to run config plugins and regenerate Xcode projects.
   - `cd example/ios && pod install --repo-update`.
   - Launch with `yarn ios` or open the workspace in Xcode and build.

## Android requirements

1. Add the NICE GitHub Packages Maven repo to your app’s `android/build.gradle`:

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
       // …
     }
   }
   ```

2. Store the credentials in `android/local.properties`:

   ```
   github.user=your_github_username
   github.key=your_github_token
   ```

Any GitHub token with `read:packages` access works for the public packages. The module ships vendored AARs as a fallback, but keeping the Maven source configured matches the upstream releases more closely.

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
          "version": "1.0.0",
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

## Example environment variables

Copy the template and set your CXone credentials:

```bash
cp example/.env.example example/.env
# edit the values
EXPO_PUBLIC_CHAT_ENV=EU1
EXPO_PUBLIC_CHAT_BRAND_ID=1086
EXPO_PUBLIC_CHAT_CHANNEL_ID=chat_xxx
```

`example/app/config/chat.ts` reads these values via Expo public env variables and passes them to `Connection.prepareAndConnect`.

## Local development workflow

- `yarn` (repo root) and `yarn` (inside `example/`) to install JS dependencies.
- `npx expo prebuild -p ios` (and `-p android` as needed) whenever native sources/config change.
- `cd example/ios && pod install --repo-update` after editing Swift files or podspec settings.
- Use `yarn ios` / `yarn android` to launch the example, or open the native projects directly in Xcode/Android Studio.
