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
        let p = try provider(for: threadId)
        let before = p.chatThread.messages.count
        try await p.loadMoreMessages()
        // Wait briefly for SDK to persist newly loaded messages into the thread instance
        var tries = 0
        while tries < 20 {
            if p.chatThread.messages.count > before || p.chatThread.hasMoreMessagesToLoad == false {
                break
            }
            try? await Task.sleep(nanoseconds: 100_000_000)  // 100ms
            tries += 1
        }
        return p.chatThread
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
