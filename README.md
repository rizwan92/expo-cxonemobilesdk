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




### Configure for iOS

The CXoneChatSDK depends on Swift modules `CXoneGuideUtility`, `KeychainSwift`, and `Mockable`. These must be present alongside `CXoneChatSDK.xcframework` so Xcode can import the SDK.

If you have the SPM workspace under `nice-cxone-mobile-sdk-ios/`, you can build all required XCFrameworks and copy them into the module automatically:

```
cd nice-cxone-mobile-sdk-ios
chmod +x scripts/build_all_xcframeworks.sh
./scripts/build_all_xcframeworks.sh Release ../ios/Frameworks
```

This produces and copies:
- `ios/Frameworks/CXoneChatSDK.xcframework`
- `ios/Frameworks/CXoneGuideUtility.xcframework`
- `ios/Frameworks/KeychainSwift.xcframework`
- `ios/Frameworks/Mockable.xcframework`

Then install pods in the example app:

```
cd ../example/ios
pod install
```

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).



## Building XC framework using nice-cxone-mobile-sdk-ios
 first step is dientifying the scheme  using xcodebuild -list -json

 ```
 {
  "workspace" : {
    "name" : "nice-cxone-mobile-sdk-ios",
    "schemes" : [
      "CXoneChatSDK"
    ]
  }
}
```


then we can build the framework using the following command

```

# 3) Archive for iOS device
xcodebuild archive \
  -scheme CXoneChatSDK \
  -destination 'generic/platform=iOS' \
  -archivePath ./build/CXoneChatSDK-iOS.xcarchive \
  SKIP_INSTALL=NO BUILD_LIBRARY_FOR_DISTRIBUTION=YES CODE_SIGNING_ALLOWED=NO

# 4) Archive for iOS Simulator
xcodebuild archive \
  -scheme CXoneChatSDK \
  -destination 'generic/platform=iOS Simulator' \
  -archivePath ./build/CXoneChatSDK-Sim.xcarchive \
  SKIP_INSTALL=NO BUILD_LIBRARY_FOR_DISTRIBUTION=YES CODE_SIGNING_ALLOWED=NO

# 5) Create the XCFramework
xcodebuild -create-xcframework \
  -framework ./build/CXoneChatSDK-iOS.xcarchive/Products/Library/Frameworks/CXoneChatSDK.framework \
  -framework ./build/CXoneChatSDK-Sim.xcarchive/Products/Library/Frameworks/CXoneChatSDK.framework \
  -output ./build/CXoneChatSDK.xcframework

```

we have to use the generic XCFramework to avoid issues with simulator and device architectures

then the generated XCFramework can be added to the ios/Frameworks/CXoneChatSDK.xcframework directory and linked in the podspec file

```
  # Vendored binary
  s.vendored_frameworks = 'Frameworks/CXoneChatSDK.xcframework'

```  



# About CXoneWrapper.xcframework

This project builds a `CXoneWrapper.xcframework` that wraps the [nice-cxone-mobile-sdk-ios](https://github.com/nice/nice-cxone-mobile-sdk-ios) framework, providing a simplified interface for integration into Expo applications.
using git submoudle git submodule add https://github.com/nice-devone/nice-cxone-mobile-sdk-ios CXoneWrapper/Vendor/nice-cxone-mobile-sdk-ios
The build script `scripts/build_wrapper_xcframeworks.sh` allows customization of the build process, including options for release/debug builds, building for distribution, embedding privacy manifests, and cleaning derived data.



