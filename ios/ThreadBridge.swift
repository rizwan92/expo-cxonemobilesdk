import CXoneChatSDK
import Foundation

/// Bridge mirroring `ChatThreadProvider`, exposing the handful of operations we use in JS.
enum ThreadBridge {
    private static var exhaustedThreadIds: Set<UUID> = []
    private static let exhaustionQueue = DispatchQueue(label: "ExpoCxonemobilesdk.ThreadBridge.exhaustion")

    private static func markExhaustion(threadId: UUID, exhausted: Bool) {
        exhaustionQueue.sync {
            if exhausted {
                exhaustedThreadIds.insert(threadId)
            } else {
                exhaustedThreadIds.remove(threadId)
            }
        }
    }

    static func hasMoreOverride(for threadId: UUID) -> Bool? {
        exhaustionQueue.sync {
            exhaustedThreadIds.contains(threadId) ? false : nil
        }
    }

    static func provider(for threadId: UUID) throws -> any ChatThreadProvider {
        try ThreadListBridge.provider(for: threadId)
    }

    static func hydratedSnapshotSync(threadId: UUID) throws -> ChatThread {
        if #available(iOS 15.0, *) {
            let semaphore = DispatchSemaphore(value: 0)
            var snapshot: ChatThread?
            var capturedError: Error?
            Task.detached {
                do {
                    snapshot = try await ThreadBridge.loadMore(threadId: threadId)
                } catch {
                    capturedError = error
                }
                semaphore.signal()
            }
            let timeoutResult = semaphore.wait(timeout: DispatchTime.now() + .seconds(8))
            if timeoutResult == .timedOut {
                return try (try? ThreadBridge.loadMore(threadId: threadId)) ?? provider(for: threadId).chatThread
            }
            if let err = capturedError {
                throw err
            }
            if let hydrated = snapshot {
                return hydrated
            }
            return try provider(for: threadId).chatThread
        } else {
            return try provider(for: threadId).chatThread
        }
    }

    static func send(threadId: UUID, message: OutboundMessage) async throws {
        let p = try provider(for: threadId)
        try await p.send(message)
    }

    static func loadMore(threadId: UUID) async throws -> ChatThread {
        let p = try provider(for: threadId)
        var snapshot = p.chatThread
        var iterations = 0
        var exhausted = false
        let maxIterations = 50

        while (snapshot.hasMoreMessagesToLoad || iterations == 0) && iterations < maxIterations {
            let countBefore = snapshot.messages.count
            try await p.loadMoreMessages()
            snapshot = await waitForThreadUpdate(provider: p, previousCount: countBefore)
            if snapshot.messages.count == countBefore {
                if snapshot.hasMoreMessagesToLoad {
                    exhausted = true
                }
                break
            }
            iterations += 1
        }

        if snapshot.hasMoreMessagesToLoad && iterations >= maxIterations {
            exhausted = true
        }

        markExhaustion(threadId: threadId, exhausted: exhausted)
        return snapshot
    }

    static func markRead(threadId: UUID) async throws {
        try await provider(for: threadId).markRead()
    }

    static func updateName(threadId: UUID, name: String) async throws {
        try await provider(for: threadId).updateName(name)
    }

    static func archive(threadId: UUID) async throws {
        try await provider(for: threadId).archive()
    }

    static func endContact(threadId: UUID) async throws {
        try await provider(for: threadId).endContact()
    }

    static func reportTyping(threadId: UUID, isTyping: Bool) async throws {
        try await provider(for: threadId).reportTypingStart(isTyping)
    }

    private static func waitForThreadUpdate(
        provider: any ChatThreadProvider,
        previousCount: Int
    ) async -> ChatThread {
        var attempts = 0
        while attempts < 20 {
            let snapshot = provider.chatThread
            if snapshot.messages.count != previousCount || snapshot.hasMoreMessagesToLoad == false {
                return snapshot
            }
            try? await Task.sleep(nanoseconds: 100_000_000)  // 100ms
            attempts += 1
        }
        return provider.chatThread
    }
}
