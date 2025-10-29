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
- Android: no additional setup

React Native (bare):

- Ensure you’ve set up Expo Modules: https://docs.expo.dev/bare/installing-expo-modules/
- iOS: `cd ios && pod install`
- Android: no additional setup

Notes:

- iOS frameworks are vendored (see below); minimum iOS 15.1.
- Brand/environment values must match your CXone setup; environments are uppercased (e.g., `NA1`, `EU1`).

### Configure example credentials (.env)

The example app reads credentials from `example/.env` via Expo public env variables. Copy the template and edit values:

```
cp example/.env.example example/.env
# then edit example/.env
EXPO_PUBLIC_CHAT_ENV=EU1
EXPO_PUBLIC_CHAT_BRAND_ID=1086
EXPO_PUBLIC_CHAT_CHANNEL_ID=chat_xxx
```

These are consumed in `example/app/chat-app/config.ts` and passed to `Connection.prepare`.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).

### Formatting

This repo uses Prettier for JS/TS formatting. Run:

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

Swift formatting (iOS):

We also support formatting Swift sources via SwiftFormat. Install once using Homebrew, then run scripts:

```
brew install swiftformat

# Format all Swift under ios/
yarn format:swift

# Check formatting without changing files
yarn format:swift:check
```

## Usage (Modular API)

Import the modular wrappers that mirror common CXoneChat SDK features:

```
import { Connection, Customer, Analytics, Threads, CustomFields, useConnectionStatus } from 'expo-cxonemobilesdk';

// Connection
await Connection.prepare('NA1', 123, 'demo');
await Connection.connect();
const mode = Connection.getChatMode(); // 'singlethread' | 'multithread' | 'liveChat' | 'unknown'
const { connected, chatState, checking, refresh, connectAndSync } = useConnectionStatus({ attempts: 5, intervalMs: 800 });

// Threads (multithread)
const ids = Threads.get().map(t => t.id);
const details = await Threads.create();
await Threads.send(details.id, { text: 'Hello from Expo' });
await Threads.markRead(details.id);

// Rich content
await Threads.sendAttachmentURL(
  newId,
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
const threadsUpdated = useEvent(ExpoCxonemobilesdk, 'threadsUpdated');
```

See `example/App.tsx` for a runnable demo.

## API (JS)

- Connection
  - `prepare(env: string, brandId: number, channelId: string): Promise<void>`
  - `prepareWithURLs(chatURL: string, socketURL: string, brandId: number, channelId: string): Promise<void>`
  - `connect(): Promise<void>`
  - `disconnect(): void`
  - `getChatMode(): 'singlethread' | 'multithread' | 'liveChat' | 'unknown'`
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

Events (subscribe with `useEvent(ExpoCxonemobilesdk, 'eventName')`) and Hook:

- `chatUpdated({ state, mode })`
- `threadsUpdated({ threadIds })`, `threadUpdated({ threadId })`
- `agentTyping({ isTyping, threadId })`
- `customEventMessage({ base64 })`
- `contactCustomFieldsSet()`, `customerCustomFieldsSet()`
- `unexpectedDisconnect()`, `tokenRefreshFailed()`, `error({ message })`, `proactivePopupAction({ actionId, data })`
- Hook: `useConnectionStatus({ attempts?, intervalMs? })` → `{ connected, chatState, checking, refresh, connectAndSync }`

## Notes

- The iOS CXoneChat SDK framework is already included at `ios/Frameworks/CXoneChatSDK.xcframework` and referenced by `ios/ExpoCxonemobilesdk.podspec`.
- Use the example app to exercise the module: Connection, Threads, CustomFields, Customer, Analytics.

## Platform Support

- iOS only (minimum iOS 15.1). No web or Android implementation.

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
