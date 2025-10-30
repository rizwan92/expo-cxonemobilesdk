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

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  # No native sources are compiled via CocoaPods any more.
  # The iOS Swift files are injected into the app target via the Expo config plugin (SPM path).
  # Provide a tiny placeholder source so CocoaPods is satisfied.
  s.source_files = "Noop.m"
end
