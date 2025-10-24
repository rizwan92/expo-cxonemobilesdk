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

  static func messages(threadId: UUID) throws -> [[String: Any]] {
    let p = try provider(for: threadId)
    let thread = p.chatThread
    let dateFormatter = ISO8601DateFormatter()
    return thread.messages.map { m in
      var text: String? = nil
      switch m.contentType {
      case .text(let payload):
        text = payload.text
      case .richLink(_):
        text = "[rich link]"
      case .quickReplies(_):
        text = "[quick replies]"
      case .listPicker(_):
        text = "[list picker]"
      case .unknown:
        text = "[unknown]"
      }
      var author: [String: Any]? = nil
      if let a = m.authorUser {
        author = [
          "id": a.id,
          "firstName": a.firstName,
          "surname": a.surname,
          "nickname": a.nickname as Any,
          "fullName": a.fullName,
          "imageUrl": a.imageUrl
        ]
      }
      return [
        "id": m.id.uuidString,
        "threadId": m.threadId.uuidString,
        "text": text as Any,
        "createdAt": dateFormatter.string(from: m.createdAt),
        "createdAtMs": Int64(m.createdAt.timeIntervalSince1970 * 1000),
        "direction": String(describing: m.direction),
        "status": String(describing: m.status),
        "author": author as Any
      ]
    }
  }
}
