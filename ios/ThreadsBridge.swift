import Foundation
import CXoneChatSDK

enum ThreadsBridge {
  static func listThreadIds() -> [String] {
    let threads = CXoneChat.shared.threads.get()
    // Best-effort mapping to UUID strings if available via Mirror
    return threads.compactMap { thread in
      let mirror = Mirror(reflecting: thread)
      for child in mirror.children {
        if child.label == "id", let id = child.value as? UUID {
          return id.uuidString
        }
      }
      return nil
    }
  }

  static func create(customFields: [String: String]?) async throws -> String {
    let provider: any ChatThreadProvider
    if let customFields, !customFields.isEmpty {
      provider = try await CXoneChat.shared.threads.create(with: customFields)
    } else {
      provider = try await CXoneChat.shared.threads.create()
    }
    let thread = provider.chatThread
    // Reflect id
    let mirror = Mirror(reflecting: thread)
    for child in mirror.children {
      if child.label == "id", let id = child.value as? UUID {
        return id.uuidString
      }
    }
    throw NSError(domain: "ExpoCxonemobilesdk", code: -10, userInfo: [NSLocalizedDescriptionKey: "Unable to read thread id"])
  }

  static func load(threadId: UUID?) async throws {
    try await CXoneChat.shared.threads.load(with: threadId)
  }

  static func provider(for threadId: UUID) throws -> any ChatThreadProvider {
    try CXoneChat.shared.threads.provider(for: threadId)
  }

  static func sendText(threadId: UUID, text: String, postback: String?) async throws {
    let p = try provider(for: threadId)
    let msg = OutboundMessage(text: text, attachments: [], postback: postback)
    try await p.send(msg)
  }

  static func loadMore(threadId: UUID) async throws {
    try await provider(for: threadId).loadMoreMessages()
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

