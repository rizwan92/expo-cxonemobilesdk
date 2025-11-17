# expo-cxonemobilesdk Documentation

The CXone Mobile SDK wrapper ships as an Expo module with shared TypeScript bindings and thin native shims for iOS and Android. Use this folder to explore every part of the public API, how the example app is wired, and the expectations for platform parity.

## Looking for something?

- [Overview & architecture](overview.md) — layout, design principles, and platform notes.
- [Setup](setup.md) — install instructions, config-plugins, and example env wiring.
- [Connection API](connection.md) — combined `prepareAndConnect`, configuration helpers, logging, and triggers.
- [Threads & messaging](threads.md) — multithread helpers, per-thread operations, and attachment flows.
- [Customer & custom fields](customers.md) — identity, OAuth, visitor IDs, and scoped custom fields.
- [Analytics](analytics.md) — page view + conversion helpers.
- [Events & listener model](events.md) — every event payload plus guidance on building reactive UIs.
- [Config plugin (SPM injection)](config-plugin.md) — wire `plugins/addSPMDependenciesToMainTarget.js` into your Expo app.

Each file includes JavaScript usage along with the corresponding native surfaces so you can extend the SDK consistently across Swift, Kotlin, and TypeScript. Whenever you add a new native function, remember to update the matching doc section plus the example app to keep everything in sync.
