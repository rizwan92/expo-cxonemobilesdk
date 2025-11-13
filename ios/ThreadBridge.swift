import CXoneChatSDK
import Foundation

/// Bridge mirroring `ChatThreadProvider`, exposing the handful of operations we use in JS.
enum ThreadBridge {
    static func provider(for threadId: UUID) throws -> any ChatThreadProvider {
        try ThreadListBridge.provider(for: threadId)
    }

    static func send(threadId: UUID, message: OutboundMessage) async throws {
        let p = try provider(for: threadId)
        try await p.send(message)
    }

    static func loadMore(threadId: UUID) async throws -> ChatThread {
        let provider = try self.provider(for: threadId)
        var snapshot = provider.chatThread
        var iterations = 0
        let maxIterations = 50
        var forceInitialLoad = snapshot.messages.count < 10
        logThreadSnapshot(label: "loadMore:start", thread: snapshot)

        while (snapshot.hasMoreMessagesToLoad || forceInitialLoad) && iterations < maxIterations {
            let countBefore = snapshot.messages.count
            let didLoad = await performLoadMore(provider: provider, threadId: threadId)
            snapshot = await waitForThreadUpdate(provider: provider, previousCount: countBefore)
            if !didLoad || snapshot.messages.count <= countBefore {
                logThreadSnapshot(label: "loadMore:steady", thread: snapshot)
                break
            }
            iterations += 1
            forceInitialLoad = false
            logThreadSnapshot(label: "loadMore:batch-\(iterations)", thread: snapshot)
        }

        logThreadSnapshot(label: "loadMore:end", thread: snapshot)
        return snapshot
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

    private static func performLoadMore(
        provider: any ChatThreadProvider,
        threadId: UUID
    ) async -> Bool {
        do {
            try await provider.loadMoreMessages()
            NSLog("[ExpoCxonemobilesdk] loadMoreMessages succeeded for \(threadId)")
            return true
        } catch let error as NSError {
            let lower = error.localizedDescription.lowercased()
            if lower.contains("there aren") {
                NSLog("[ExpoCxonemobilesdk] loadMoreMessages reached end for \(threadId)")
                return false
            }
            NSLog("[ExpoCxonemobilesdk] loadMoreMessages failed for \(threadId): \(error)")
            return false
        } catch {
            NSLog("[ExpoCxonemobilesdk] loadMoreMessages failed for \(threadId): \(error)")
            return false
        }
    }

    private static func logThreadSnapshot(label: String, thread: ChatThread) {
        let newest = thread.messages.last.map { describeMessage($0) } ?? "nil"
        let oldest = thread.messages.first.map { describeMessage($0) } ?? "nil"
        NSLog(
            "[ExpoCxonemobilesdk][ThreadBridge] \(label) id=\(thread.id) messages=\(thread.messages.count) hasMore=\(thread.hasMoreMessagesToLoad) state=\(thread.state) newest=\(newest) oldest=\(oldest)"
        )
    }

    private static func describeMessage(_ message: Message) -> String {
        return "id=\(message.id) direction=\(message.direction) createdAt=\(message.createdAt)"
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
}
