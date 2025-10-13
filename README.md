# expo-cxonemobilesdk

Mobile SDK lets you integrate CXone Mpower digital chat into your enterprise mobile phone apps.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/cxonemobilesdk/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/cxonemobilesdk/)

# Installation in managed Expo projects

For [managed](https://docs.expo.dev/archive/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](#api-documentation). If you follow the link and there is no documentation available then this library is not yet usable within managed projects &mdash; it is likely to be included in an upcoming Expo SDK release.

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/) before continuing.

### Add the package to your npm dependencies

```
npm install expo-cxonemobilesdk
```

### Configure for Android

Not required for this package.

### Configure for iOS

No manual XCFramework generation required — the SDK frameworks are vendored under `ios/Frameworks` and linked by the podspec.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).



## Notes

- The iOS CXoneChat SDK framework is already included at `ios/Frameworks/CXoneChatSDK.xcframework` and referenced by `ios/ExpoCxonemobilesdk.podspec`.
- Use the example app to exercise the module: `prepare`, `connect`, `disconnect`.

## About CXoneChatSDK.xcframework

The vendored XCFramework in `ios/Frameworks` is generated from a maintained fork of the upstream SDK:

- Fork: https://github.com/rizwan92/nice-cxone-mobile-sdk-ios

We build the XCFramework in that fork and then manually copy the output into this repository under `ios/Frameworks` for use by the podspec. If regeneration is needed, use the fork’s scripts to produce fresh artifacts and replace:

- `ios/Frameworks/CXoneChatSDK.xcframework`
