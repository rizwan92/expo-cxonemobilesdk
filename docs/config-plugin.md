# Config Plugin: addSPMDependenciesToMainTarget

`plugins/addSPMDependenciesToMainTarget.js` is the Expo config plugin that injects an `XCRemoteSwiftPackageReference` + `XCSwiftPackageProductDependency` into your iOS project during `expo prebuild`. It ensures Xcode knows about the `CXoneChatSDK` Swift Package so the podspec’s `s.spm_dependency` can link the product without requiring the `cocoapods-spm` Ruby plugin.

Use this plugin whenever your app (or the included example) needs to resolve the Swift Package while still letting CocoaPods manage the actual linking.

## Installation checklist

1. Install `expo-cxonemobilesdk`.
2. Register the plugin in your Expo config (`app.json`, `app.config.js`, etc.).
3. Run `npx expo prebuild -p ios` so the plugin updates the Xcode project.
4. Inside the `ios/` directory run `pod install --repo-update` to ensure CocoaPods sees the dependency.
5. Build the app (`yarn ios`, open the workspace in Xcode, or `npx expo run:ios`).

## Adding the plugin to your Expo app

Add the published entry point (`expo-cxonemobilesdk/plugin-spm`) to your `plugins` array and pass the Swift Package details that match the CXoneChat SDK release you want to consume:

```jsonc
// app.json
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

If you need to reference the plugin file directly (e.g., when working inside this repo via `yarn link`), use the relative path instead:

```jsonc
[
  "./node_modules/expo-cxonemobilesdk/plugins/addSPMDependenciesToMainTarget.js",
  {
    "version": "1.0.0",
    "repositoryUrl": "https://github.com/nice-devone/nice-cxone-mobile-sdk-ios.git",
    "repoName": "nice-cxone-mobile-sdk-ios",
    "productName": "CXoneChatSDK"
  }
]
```

## Option reference

| Option | Required | Description |
| --- | --- | --- |
| `version` | Yes | Minimum Swift Package version (used for an `upToNextMajorVersion` requirement). |
| `repositoryUrl` | Yes | The git URL for the Swift Package manifest (usually the NICE CXone SDK repo). |
| `repoName` | Yes | Friendly name for Xcode (displayed in the project navigator). |
| `productName` | Yes | The Swift Package product to link (`CXoneChatSDK`). |

The plugin reuses existing package references when possible, so you can safely run it multiple times without creating duplicate entries.

## How it works

- Creates (or reuses) an `XCRemoteSwiftPackageReference` pointing at `repositoryUrl` with the specified `version`.
- Creates (or reuses) an `XCSwiftPackageProductDependency` for `productName`.
- Appends the package reference to `PBXProject.packageReferences` so Xcode resolves the package.
- **Does not** add a `PBXBuildFile` entry or touch the Frameworks build phase; linking is left to CocoaPods via the podspec’s `s.spm_dependency` (avoids duplicate-symbol errors).

## Verifying the plugin ran

After `expo prebuild -p ios`:

1. Open `example/ios/example.xcodeproj/project.pbxproj` (or your app’s Xcode project).
2. Search for `XCRemoteSwiftPackageReference` and confirm an entry for your repo exists.
3. In Xcode, select the app target ➝ “Package Dependencies” and confirm `CXoneChatSDK` is listed.
4. Run `pod install` to ensure the package product is linked by the Pods target.

If the package does not appear, re-run `npx expo prebuild -p ios --clean` to regenerate the native project and inspect your `plugins` array for typos.
