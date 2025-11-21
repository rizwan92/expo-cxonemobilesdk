# Analytics

`src/api/analytics.ts` forwards CXone analytics events to the native SDK so your chat deployment can track customer journeys. Every call logs with `[CXone/Analytics]` for debugging.

## Available helpers

```ts
import { Analytics } from 'expo-cxonemobilesdk';

await Analytics.viewPage('Home', 'https://example.com/home');
await Analytics.viewPageEnded('Home', 'https://example.com/home');
await Analytics.chatWindowOpen();
await Analytics.conversion('purchase', 99.99);
```

- `viewPage` — call when a screen/page becomes visible.
- `viewPageEnded` — call when the visitor navigates away from the page.
- `chatWindowOpen` — track when the chat UI is presented.
- `conversion(type, value)` — log custom conversion events (e.g., purchases). `value` is numeric; express currency conversions in your backend before sending if you need multiple currencies.

All helpers return `Promise<void>` and propagate native errors so you can surface failures in development. The CXone SDK queues analytics against the active connection; run them after `Connection.prepare`/`Connection.connect` completes.
