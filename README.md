# expo-cxonemobilesdk

Mobile SDK lets you integrate CXone Mpower digital chat into your enterprise mobile phone apps.

# API documentation

- [Documentation for the latest stable release](https://docs.expo.dev/versions/latest/sdk/cxonemobilesdk/)
- [Documentation for the main branch](https://docs.expo.dev/versions/unversioned/sdk/cxonemobilesdk/)

## Installation

Install the package:

```
npm install expo-cxonemobilesdk
```

Expo (managed/bare):

- iOS: `npx pod-install` (or `npx expo run:ios` which runs pods)
- Android: add the NICE GitHub Packages Maven repo and credentials so Gradle can resolve `com.nice.cxone:chat-sdk-core` (if not vendoring AARs). In your app's `android/build.gradle` under `allprojects.repositories` add:

```
maven {
  name 'github-nice-devone-cxone-mobile'
  url 'https://maven.pkg.github.com/nice-devone/nice-cxone-mobile-sdk-android'
  credentials {
    username = project.findProperty('github.user') ?: System.getenv('GPR_USERNAME')
    password = project.findProperty('github.key') ?: System.getenv('GPR_TOKEN')
  }
}
```

Then set credentials in `android/local.properties`:

```
github.user=your_github_username
github.key=your_github_token
```

Public packages still require an access token for GitHub Packages. Any token with read:packages works.

React Native (bare):

- Ensure you’ve set up Expo Modules: https://docs.expo.dev/bare/installing-expo-modules/
- iOS: `cd ios && pod install`
- Android: same GitHub Packages setup as above

Notes:

- iOS frameworks are vendored (see below); minimum iOS 15.1.
- Brand/environment values must match your CXone setup; environments are uppercased (e.g., `NA1`, `EU1`).

### Optional: Add Swift Package (SPM) via Config Plugin (Experimental)

This package ships a config plugin that can inject a Swift Package dependency for CXoneChatSDK at prebuild time. Add to your app config:

```
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-cxonemobilesdk/plugin/withCXoneSPM",
        {
          "packages": [
            {
              "repositoryUrl": "https://github.com/your-org/your-cxonechat-spm",
              "product": "CXoneChatSDK",
              "minVersion": "1.0.0"
            }
          ]
        }
      ]
    ]
  }
}
```

Important: CocoaPods and SPM targets are isolated. If your app uses this plugin, ensure the Expo module sources that import `CXoneChatSDK` are linked against the same package. We recommend continuing with the CocoaPods-based integration unless you fully migrate to SPM for the wrapper as well.

### Published config-plugin

This package also ships a published config-plugin that consumers can reference directly from the installed package. The plugin path is exposed as `expo-cxonemobilesdk/plugin-spm` (also available at `expo-cxonemobilesdk/plugins/addSPMDependenciesToMainTarget.js`).

Example usage (consumer `app.json`):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-cxonemobilesdk/plugin-spm",
        {
          "version": "1.0.0",
          "repositoryUrl": "https://github.com/nice/cxone-mobile-sdk-ios.git",
          "repoName": "nice-cxone-mobile-sdk-ios",
          "productName": "CXoneChatSDK"
        }
      ]
    ]
  }
}
```

Notes:
- The plugin will inject an XCRemoteSwiftPackageReference and a product dependency into the iOS Xcode project during `expo prebuild` so the SPM product resolves for the app target.
- To avoid duplicate linking, either keep the podspec's `s.spm_dependency` (CocoaPods will link the product) and let the plugin only add a package reference, or remove `s.spm_dependency` and let the plugin provide the app-level package and linking. Do not have both the podspec and the app target both actively link the same product.

### Configure example credentials (.env)

The example app reads credentials from `example/.env` via Expo public env variables. Copy the template and edit values:

```
cp example/.env.example example/.env
# then edit example/.env
EXPO_PUBLIC_CHAT_ENV=EU1
EXPO_PUBLIC_CHAT_BRAND_ID=1086
EXPO_PUBLIC_CHAT_CHANNEL_ID=chat_xxx
```

These are consumed in `example/app/chat-app/config.ts` and passed to `Connection.prepareAndConnect`.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).

### Formatting

This repo uses Prettier for JS/TS formatting and Apple's swift-format for Swift.

JS/TS:

```
yarn format
# or
npm run format
```

Check formatting without writing changes:

```
yarn format:check
# or
npm run format:check
```

Swift (iOS) via Apple swift-format:

```
brew install swift-format

# Format all Swift files under ios/
yarn format:swift

# Lint Swift formatting (no changes written)
yarn format:swift:check
```

## Usage (Modular API)

Minimal unified connection (iOS + Android):

```
import { Connection, Customer, Analytics, Threads, CustomFields } from 'expo-cxonemobilesdk';

// Prepare and connect in a single call
await Connection.prepareAndConnect('NA1', 123, 'demo');
const mode = Connection.getChatMode(); // 'singlethread' | 'multithread' | 'liveChat' | 'unknown'

// Threads (multithread)
const ids = Threads.get().map(t => t.id);
const details = await Threads.create();
await Threads.send(details.id, { text: 'Hello from Expo' });
await Threads.markRead(details.id);

// Rich content
await Threads.sendAttachmentURL(
  details.id,
  'https://example.com/file.pdf',
  'application/pdf',
  'file.pdf',
  'File PDF'
);

// Custom fields
await CustomFields.setCustomer({ plan: 'gold' });
await CustomFields.setThread(details.id, { topic: 'support' });

// Customer identity / OAuth
Customer.setName('Jane', 'Doe');
Customer.setIdentity('123', 'Jane', 'Doe');
Customer.setAuthorizationCode('<code>');
Customer.setCodeVerifier('<verifier>');

// Analytics
await Analytics.viewPage('Home', 'https://example.com/home');
await Analytics.viewPageEnded('Home', 'https://example.com/home');
await Analytics.chatWindowOpen();
await Analytics.conversion('purchase', 99.99);

// Triggers
await Connection.executeTrigger('00000000-0000-0000-0000-000000000001');

// Events
import ExpoCxonemobilesdk from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';
const chatUpdated = useEvent(ExpoCxonemobilesdk, 'chatUpdated');
const connectionError = useEvent(ExpoCxonemobilesdk, 'connectionError');
```

See `example/App.tsx` for a runnable demo.

## API (JS)

- Connection
  - `prepareAndConnect(env: string, brandId: number, channelId: string): Promise<void>`
  - `prepareAndConnectWithURLs?(chatURL: string, socketURL: string, brandId: number, channelId: string): Promise<void>`
  - `disconnect(): void`
  - `getChatMode(): 'singlethread' | 'multithread' | 'liveChat' | 'unknown'`
  - `getChatState(): 'initial' | 'preparing' | 'prepared' | 'offline' | 'connecting' | 'connected' | 'ready' | 'closed'`
  - `isConnected(): boolean`
  - `getChannelConfiguration(env: string, brandId: number, channelId: string): Promise<ChannelConfiguration>`
  - `getChannelConfigurationByURL(chatURL: string, brandId: number, channelId: string): Promise<ChannelConfiguration>`
  - `executeTrigger(triggerId: string): Promise<void>`
  - `signOut(): void`
- Threads (multithread)
  - `get(): ChatThreadDetails[]`
  - `create(customFields?: Record<string,string>): Promise<ChatThreadDetails>`
  - `load(threadId?: string): Promise<void>`
  - `send(threadId: string, message: OutboundMessage): Promise<void>`
  - `loadMore(threadId: string): Promise<void>` (then call `getDetails(threadId)` to read updated messages)
  - `markRead(threadId: string): Promise<void>`
  - `updateName(threadId: string, name: string): Promise<void>`
  - `archive(threadId: string): Promise<void>`
  - `endContact(threadId: string): Promise<void>`
  - `reportTypingStart(threadId: string, didStart: boolean): Promise<void>`
  - `sendAttachmentURL(threadId: string, url: string, mimeType: string, fileName: string, friendlyName: string): Promise<void>`
  - `sendAttachmentBase64(threadId: string, base64: string, mimeType: string, fileName: string, friendlyName: string): Promise<void>`
  - To page messages: call `loadMore(threadId)` then `getDetails(threadId)` to read `messages` and `hasMoreMessagesToLoad`.
- Customer / OAuth
  - `setName(firstName: string, lastName: string): void`
  - `setIdentity(id: string, firstName?: string, lastName?: string): void`
  - `clearIdentity(): void`
  - `setDeviceToken(token: string): void`
  - `setAuthorizationCode(code: string): void`
  - `setCodeVerifier(verifier: string): void`
  - `getVisitorId(): string | null`
- Custom Fields
  - `CustomFields.getCustomer(): Record<string,string>`
  - `CustomFields.setCustomer(fields: Record<string,string>): Promise<void>`
  - `CustomFields.getThread(threadId: string): Record<string,string>`
  - `CustomFields.setThread(threadId: string, fields: Record<string,string>): Promise<void>`
- Analytics
  - `viewPage(title: string, url: string): Promise<void>`
  - `viewPageEnded(title: string, url: string): Promise<void>`
  - `chatWindowOpen(): Promise<void>`
  - `conversion(type: string, value: number): Promise<void>`

Events (subscribe with `useEvent(ExpoCxonemobilesdk, 'eventName')`):

- `chatUpdated({ state, mode })`
- `threadsUpdated({ threadIds })`, `threadUpdated({ threadId })`
- `agentTyping({ isTyping, threadId })`
- `customEventMessage({ base64 })`
- `contactCustomFieldsSet()`, `customerCustomFieldsSet()`
- `unexpectedDisconnect()`, `tokenRefreshFailed()`, `error({ message })`, `proactivePopupAction({ actionId, data })`
  - `connectionError({ phase, message })` (phase can be `preflight`, `prepare`, `connect`, or `runtime`)

## Notes

- The iOS CXoneChat SDK framework is already included at `ios/Frameworks/CXoneChatSDK.xcframework` and referenced by `ios/ExpoCxonemobilesdk.podspec`.
- Use the example app to exercise the module: Connection, Threads, CustomFields, Customer, Analytics.

## Platform Support

- iOS (minimum iOS 15.1)
- Android (vendored AARs or GitHub Packages)

## Feature Coverage

- Core SDK integration: prepare, connect, disconnect, signOut (yes)
- Modes: detect at runtime via `Connection.getChatMode()` (yes)
- Multi-thread chat: get/create/load/send/markRead/update/archive/end/typing (yes)
- Rich content messages: send attachment (URL/base64) (yes)
- Custom fields: customer/thread get/set (yes)
- Customer identity & OAuth: set identity/name/device token/auth code/code verifier (yes)
- Analytics: viewPage/viewPageEnded/chatWindowOpen/conversion (yes)
- Events: chatUpdated, (threads|thread)Updated, agentTyping, etc. (yes)

## Troubleshooting

- After adding/updating Swift files under `ios/`, reinstall pods in the example app so Xcode sees new sources:
  - `cd example/ios && pod install`
  - Then clean build and run (e.g., `npx expo run:ios`)
- Build errors about missing `CXoneChatSDK` usually indicate the vendored framework is absent or not linked.

## About CXoneChatSDK.xcframework

The vendored XCFramework in `ios/Frameworks` is generated from a maintained fork of the upstream SDK:

- Fork: https://github.com/rizwan92/nice-cxone-mobile-sdk-ios

We build the XCFramework in that fork and then manually copy the output into this repository under `ios/Frameworks` for use by the podspec. If regeneration is needed, use the fork’s scripts to produce fresh artifacts and replace:

- `ios/Frameworks/CXoneChatSDK.xcframework`
