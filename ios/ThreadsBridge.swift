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

  static func create(customFields: [String: String]?) async throws -> [String: Any] {
    let provider: any ChatThreadProvider
    if let customFields, !customFields.isEmpty {
      provider = try await CXoneChat.shared.threads.create(with: customFields)
    } else {
      provider = try await CXoneChat.shared.threads.create()
    }
    let thread = provider.chatThread
    return (JSONBridge.encode(thread) as? [String: Any]) ?? [:]
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
    return thread.messages.compactMap { JSONBridge.encode($0) as? [String: Any] }
  }

  static func messagesLimited(threadId: UUID, limit: Int) throws -> [[String: Any]] {
    let p = try provider(for: threadId)
    let thread = p.chatThread
    let msgs = thread.messages
    let count = max(0, min(limit, msgs.count))
    let slice = msgs.suffix(count)
    return slice.compactMap { JSONBridge.encode($0) as? [String: Any] }
  }

  static func ensureMessages(threadId: UUID, minCount: Int) async throws -> [[String: Any]] {
    let p = try provider(for: threadId)
    let target = max(0, minCount)
    // Load older messages until we have at least target or there are no more
    while p.chatThread.messages.count < target && p.chatThread.hasMoreMessagesToLoad {
      try await p.loadMoreMessages()
    }
    let msgs = p.chatThread.messages
    let slice = msgs.suffix(min(target, msgs.count))
    return slice.compactMap { JSONBridge.encode($0) as? [String: Any] }
  }

  static func listDetails() -> [[String: Any]] {
    let threads = CXoneChat.shared.threads.get()
    return threads.compactMap { JSONBridge.encode($0) as? [String: Any] }
  }

  static func getDetails(threadId: UUID) throws -> [String: Any] {
    let p = try provider(for: threadId)
    return (JSONBridge.encode(p.chatThread) as? [String: Any]) ?? [:]
  }

  static func listDetailsLimited(limit: Int) -> [[String: Any]] {
    let threads = CXoneChat.shared.threads.get()
    return threads.compactMap { thread in
      var dict = (JSONBridge.encode(thread) as? [String: Any]) ?? [:]
      if var arr = dict["messages"] as? [[String: Any]] {
        let count = max(0, min(limit, arr.count))
        arr = Array(arr.suffix(count))
        dict["messages"] = arr
      }
      return dict
    }
  }

  static func getDetailsLimited(threadId: UUID, limit: Int) throws -> [String: Any] {
    let p = try provider(for: threadId)
    var dict = (JSONBridge.encode(p.chatThread) as? [String: Any]) ?? [:]
    if var arr = dict["messages"] as? [[String: Any]] {
      let count = max(0, min(limit, arr.count))
      arr = Array(arr.suffix(count))
      dict["messages"] = arr
    }
    return dict
  }
}
