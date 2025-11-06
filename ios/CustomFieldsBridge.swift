import CXoneChatSDK
import Foundation

/// Helper entry points for customer and thread custom fields.
enum CustomFieldsBridge {
    // Customer-level custom fields
    static func getCustomer() -> [String: String] {
        CXoneChat.shared.customerCustomFields.get()
    }

    static func setCustomer(_ fields: [String: String]) async throws {
        try await CXoneChat.shared.customerCustomFields.set(fields)
    }

    // Thread-level (contact) custom fields
    static func getThread(threadId: UUID) -> [String: String] {
        CXoneChat.shared.threads.customFields.get(for: threadId)
    }

    static func setThread(threadId: UUID, fields: [String: String]) async throws {
        try await CXoneChat.shared.threads.customFields.set(fields, for: threadId)
    }
}
