# Threads & Messaging

Use `Threads` for list-level operations (load/create) and `Thread` for per-thread actions (send, attachments, custom fields). All helpers live under `src/api/threads.ts` and `src/api/thread.ts`.

## Thread list (Threads module)

```ts
import { Threads } from 'expo-cxonemobilesdk';

const threads = Threads.get();
const survey = await Threads.getPreChatSurvey();
await Threads.load(); // refresh entire list
const created = await Threads.create({ product: 'gold-plan' });
```

- `Threads.get()` returns the cached `ChatThreadDetails[]`.
- `Threads.getPreChatSurvey()` returns the last pre-chat survey payload (if present) or `null`.
- `Threads.load(threadId?)` refreshes either all threads or a single thread.
- `Threads.create(customFields?)` opens a new thread and returns full details.

`Threads.EVENTS.UPDATED` maps to the native `threadsUpdated` event. Subscribe with `useEvent` to receive full snapshots whenever native state changes; do not diff in JS unless you need to detect specific mutations.

## Thread detail (Thread module)

```ts
import { Thread } from 'expo-cxonemobilesdk';

const details = Thread.getDetails(threadId);
await Thread.send(threadId, { text: 'Hello from Expo' });
await Thread.markRead(threadId);
await Thread.updateName(threadId, 'My issue #123');
await Thread.endContact(threadId);
```

Available helpers:

- `Thread.load(threadId?)` — same as `Threads.load` but scoped to a thread.
- `Thread.getDetails(threadId)` — returns the cached `ChatThreadDetails`.
- `Thread.send(threadId, message)` — sends text + optional attachments/postback.
- `Thread.loadMore(threadId)` — Android returns the refreshed snapshot. On iOS the call triggers native pagination; immediately call `Thread.getDetails(threadId)` when the promise resolves (or wait for `threadUpdated`).
- `Thread.markRead`, `Thread.updateName`, `Thread.archive`, `Thread.endContact`.
- `Thread.reportTypingStart(threadId, didStart)` — forwards typing indicators to CXone.
- `Thread.getCustomFields(threadId)` + `Thread.updateCustomFields(threadId, fields)` — scoped to the thread/contact. Native emits `contactCustomFieldsSet` after updates.

`Thread.EVENTS.UPDATED`, `Thread.EVENTS.AGENT_TYPING`, and `Thread.EVENTS.CONTACT_CUSTOM_FIELDS_SET` mirror the native events.

## Attachments

Two helpers bridge to the native SDKs:

```ts
await Thread.sendAttachmentURL(threadId, url, mimeType, fileName, friendlyName);
await Thread.sendAttachmentBase64(threadId, base64, mimeType, fileName, friendlyName);
```

- URL: references remote assets already hosted on the web.
- Base64: use `expo-file-system` + `readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })`. Avoid extremely large files (>10 MB) because the payload loads fully into memory.

Native echoes sent attachments back through `threadUpdated` events once the SDK accepts them. The example app renders a “sending…” chip until it receives the refreshed message.
