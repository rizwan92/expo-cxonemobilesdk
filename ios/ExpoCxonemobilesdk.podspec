require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoCxonemobilesdk'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  # Target iOS only for the vendored XCFramework
  s.platform      = :ios, '15.1'
  s.swift_version  = '5.9'
  s.source         = { git: 'https://github.com/rizwan92/expo-cxonemobilesdk' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # CXoneChatSDK is provided as a vendored XCFramework checked into ios/Frameworks

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  # Vendored XCFrameworks (built externally and committed under ios/Frameworks)
  # Ensure these exist locally before running `pod install`.
  s.vendored_frameworks = [
    'Frameworks/CXoneChatSDK.xcframework',
    'Frameworks/CXoneGuideUtility.xcframework',
    'Frameworks/KeychainSwift.xcframework',
    'Frameworks/Mockable.xcframework'
  ]


  # Privacy manifest is embedded within the framework slices during build to avoid duplicate copy
  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
