# Events & Listener Model

Native state flows through events so the JS surface can stay minimal and platform-neutral. Subscribe with Expo’s `useEvent` hook (or `NativeEventEmitter` alternatives) and treat the payloads listed below as the source of truth.

```ts
import ExpoCxonemobilesdk, { Connection, Thread, Threads, Customer } from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';

const chatUpdated = useEvent(ExpoCxonemobilesdk, Connection.EVENTS.CHAT_UPDATED);
const connectionError = useEvent(ExpoCxonemobilesdk, Connection.EVENTS.CONNECTION_ERROR);
const threadsUpdated = useEvent(ExpoCxonemobilesdk, Threads.EVENTS.UPDATED);
const threadUpdated = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.UPDATED);
const agentTyping = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.AGENT_TYPING);
const authorizationChanged = useEvent(ExpoCxonemobilesdk, Customer.EVENTS.AUTHORIZATION_CHANGED);
```

## Connection-level events

| Event | Payload type | Notes |
| --- | --- | --- |
| `chatUpdated` | `ChatUpdatedEventPayload` (`{ state, mode }`) | Fires on every CXone state/mode transition. Drive UI connection indicators from this payload. |
| `connectionError` | `ConnectionErrorEventPayload` (`{ phase, message }`) | `phase` is one of `preflight`, `prepare`, `connect`, `runtime`. Surface errors in the UI and inspect device logs for details. |
| `unexpectedDisconnect` | `void` | Emitted when the SDK disconnects outside of `Connection.disconnect()`. Expect to call `prepareAndConnect` again. |
| `tokenRefreshFailed` | `void` | Auth token refresh failed. Prompt the user to reauthenticate. |
| `customEventMessage` | `{ base64: string }` | Raw custom-event payloads surfaced by CXone. Decode + handle in JS as needed. |
| `proactivePopupAction` | `{ actionId, action }` | Emitted when a proactive action arrives. `action` is typed via `ProactivePopupActionEventPayload`. |
| `error` | `{ message: string }` | Catch-all native errors that do not fit other categories. |

## Threads & messaging events

| Event | Payload type | Notes |
| --- | --- | --- |
| `threadsUpdated` | `{ threads: ChatThreadDetails[] }` | Full snapshot used to keep JS state aligned. Diff locally if you need to animate inserts, but rely on the payload ordering. |
| `threadUpdated` | `{ thread: ChatThreadDetails }` | Single-thread updates, typically after send/loadMore/agent responses. |
| `agentTyping` | `{ isTyping, threadId, agent }` | Drive typing indicators per thread. |
| `contactCustomFieldsSet` | `void` | Fires after `Thread.updateCustomFields`. |

## Customer & auth events

| Event | Payload type | Notes |
| --- | --- | --- |
| `customerCustomFieldsSet` | `void` | Fires after `Customer.setCustomFields`. |
| `authorizationChanged` | `{ status, code?, verifier? }` | `status` is `'pending' | 'configured'`. Boolean flags state whether code/verifier values are currently set. |

## Event handling guidance

- Events are global — use the exported `EVENTS` constants to avoid typos.
- Prefer event-driven UIs instead of calling getters inside intervals; the native SDKs already publish the canonical state.
- When extending the native modules with new functionality, add new event names to `ios/ExpoCxonemobilesdkModule.swift`, Android definitions, `src/ExpoCxonemobilesdk.types.ts`, and document the payload here to keep parity.
