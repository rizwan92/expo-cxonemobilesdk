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

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).



## Usage (Modular API)

Import the modular wrappers that mirror common CXoneChat SDK features:

```
import { Connection, Customer, Analytics, Threads, CustomFields } from 'expo-cxonemobilesdk';

// Connection
await Connection.prepare('NA1', 123, 'demo');
await Connection.connect();
const mode = Connection.getChatMode(); // 'singlethread' | 'multithread' | 'liveChat' | 'unknown'

// Threads (multithread)
const ids = Threads.list();
const newId = await Threads.create();
await Threads.sendText(newId, 'Hello from Expo');
await Threads.markRead(newId);

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
await CustomFields.setThread(newId, { topic: 'support' });

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
  - `connect(): Promise<void>`
  - `disconnect(): void`
  - `getChatMode(): 'singlethread' | 'multithread' | 'liveChat' | 'unknown'`
  - `executeTrigger(triggerId: string): Promise<void>`
  - `signOut(): void`
- Threads (multithread)
  - `list(): string[]`
  - `create(customFields?: Record<string,string>): Promise<string>`
  - `load(threadId?: string): Promise<void>`
  - `sendText(threadId: string, text: string, postback?: string): Promise<void>`
  - `loadMore(threadId: string): Promise<void>`
  - `markRead(threadId: string): Promise<void>`
  - `updateName(threadId: string, name: string): Promise<void>`
  - `archive(threadId: string): Promise<void>`
  - `endContact(threadId: string): Promise<void>`
  - `typing(threadId: string, isTyping: boolean): Promise<void>`
  - `sendAttachmentURL(threadId: string, url: string, mimeType: string, fileName: string, friendlyName: string): Promise<void>`
  - `sendAttachmentBase64(threadId: string, base64: string, mimeType: string, fileName: string, friendlyName: string): Promise<void>`
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

## Notes

- The iOS CXoneChat SDK framework is already included at `ios/Frameworks/CXoneChatSDK.xcframework` and referenced by `ios/ExpoCxonemobilesdk.podspec`.
- Use the example app to exercise the module: Connection, Threads, CustomFields, Customer, Analytics.

## About CXoneChatSDK.xcframework

The vendored XCFramework in `ios/Frameworks` is generated from a maintained fork of the upstream SDK:

- Fork: https://github.com/rizwan92/nice-cxone-mobile-sdk-ios

We build the XCFramework in that fork and then manually copy the output into this repository under `ios/Frameworks` for use by the podspec. If regeneration is needed, use the fork’s scripts to produce fresh artifacts and replace:

- `ios/Frameworks/CXoneChatSDK.xcframework`
