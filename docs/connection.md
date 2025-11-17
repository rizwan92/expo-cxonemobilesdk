# Connection API

`src/api/connection.ts` exports the shared entry points for configuring, preparing, and monitoring CXoneChat sessions. All calls log to the Metro console with the `[CXone/Connection]` tag for traceability.

## Combined prepare + connect

```ts
import { Connection } from 'expo-cxonemobilesdk';

await Connection.prepareAndConnect(env, brandId, channelId);
```

- `env` is the CXone environment code (`NA1`, `EU1`, etc.). It is uppercased on the native side before hitting the SDK.
- `brandId` is numeric; pass the exact ID from CXone.
- `channelId` is the public chat channel identifier.

The native modules run a best-effort preflight, prepare the SDK, and connect the websocket in sequence. The Promise resolves once the SDK reports success. Use `chatUpdated` + `connectionError` events to surface runtime state transitions and failures.

### URL-based variant (iOS only)

`prepareAndConnectWithURLs(chatURL, socketURL, brandId, channelId)` lets you bypass environment lookups by supplying the REST and websocket URLs directly. The helper guards the call at runtime and throws on platforms that do not support it.

## Connection state helpers

- `Connection.getChatMode()` → `'singlethread' | 'multithread' | 'liveChat' | 'unknown'`
- `Connection.getChatState()` → `'initial' | 'preparing' | 'prepared' | 'offline' | 'connecting' | 'connected' | 'ready' | 'closed'`
- `Connection.isConnected()` → `boolean`

These are synchronous getters wired into the CXone SDK’s in-memory state. Prefer deriving your UI from `chatUpdated` but the getters are useful for immediate checks (e.g., gating repeated connect calls).

## Configuration & triggers

- `Connection.getChannelConfiguration(env, brandId, channelId)`
- `Connection.getChannelConfigurationByURL(chatURL, brandId, channelId)`
- `Connection.executeTrigger(triggerId)`

Configuration calls return the JSON defined in `ChannelConfiguration` (see `src/types.ts`). The values come directly from the native SDKs, so always read them defensively (e.g., `fileRestrictions.allowedFileSize` can be a number or `{ minKb, maxKb }`). Trigger execution is fully async; use it to fire marketing or automation flows configured in CXone.

## Logging controls

```ts
Connection.configureLogger('debug', 'full');
```

`LoggerLevel` accepts `'trace' | 'debug' | 'info' | 'warning' | 'error' | 'fatal' | 'verbose' | 'all' | 'none' | 'off'` and `LoggerVerbosity` is `'simple' | 'medium' | 'full'`. When omitted, the helper defaults to `'info'`/`'simple'`. Set this early in app startup so both platforms adopt the same verbosity.

## Disconnect and cleanup

- `Connection.disconnect()` — closes the current websocket connection but leaves cached state intact.
- `Connection.signOut()` — signs the visitor out of CXoneChat, clearing customer identity and custom fields on both platforms.

Always call `signOut` before switching profiles or resetting the example app home screen to keep SDK state aligned with your backend expectations.
