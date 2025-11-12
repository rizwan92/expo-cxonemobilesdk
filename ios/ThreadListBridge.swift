import CXoneChatSDK
import Foundation

/// Bridge mirroring `ChatThreadListProvider` operations used by the JS surface.
enum ThreadListBridge {
    static func get() -> [ChatThread] {
        CXoneChat.shared.threads.get()
    }

    @discardableResult
    static func create(customFields: [String: String]?) async throws -> ChatThread {
        let provider: any ChatThreadProvider
        if let customFields, !customFields.isEmpty {
            provider = try await CXoneChat.shared.threads.create(with: customFields)
        } else {
            provider = try await CXoneChat.shared.threads.create()
        }
        return provider.chatThread
    }

    static func load(threadId: UUID?) async throws {
        try await CXoneChat.shared.threads.load(with: threadId)
    }

    static func provider(for threadId: UUID) throws -> any ChatThreadProvider {
        try CXoneChat.shared.threads.provider(for: threadId)
    }

    static func getDetails(threadId: UUID) throws -> ChatThread {
        return try ThreadBridge.hydratedSnapshotSync(threadId: threadId)
    }

    static func preChatSurvey() -> PreChatSurvey? {
        CXoneChat.shared.threads.preChatSurvey
    }
}
