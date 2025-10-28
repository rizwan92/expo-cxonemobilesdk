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

  static func sendOutbound(threadId: UUID, text: String, postback: String?, attachments: [[String: Any]]) async throws {
    let p = try provider(for: threadId)
    var descs: [ContentDescriptor] = []
    for a in attachments {
      if let urlStr = a["url"] as? String,
         let mime = a["mimeType"] as? String,
         let fileName = a["fileName"] as? String,
         let friendly = a["friendlyName"] as? String,
         let url = URL(string: urlStr) {
        descs.append(ContentDescriptor(url: url, mimeType: mime, fileName: fileName, friendlyName: friendly))
      } else if let base64 = a["data"] as? String,
                let data = Data(base64Encoded: base64),
                let mime = a["mimeType"] as? String,
                let fileName = a["fileName"] as? String,
                let friendly = a["friendlyName"] as? String {
        descs.append(ContentDescriptor(data: data, mimeType: mime, fileName: fileName, friendlyName: friendly))
      }
    }
    let msg = OutboundMessage(text: text, attachments: descs, postback: postback)
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

  static func messagesPage(threadId: UUID, scrollToken: String?, limit: Int?) async throws -> [String: Any] {
    let p = try provider(for: threadId)
    let target = max(0, limit ?? 10)
    var page: [Message]
    if let token = scrollToken, token == p.chatThread.scrollToken {
      // Load older messages until we reach the requested page size or no more
      let before = p.chatThread.messages
      let beforeIds = Set(before.map { $0.id })
      var loaded = 0
      while loaded < target && p.chatThread.hasMoreMessagesToLoad {
        try await p.loadMoreMessages()
        loaded = p.chatThread.messages.filter { !beforeIds.contains($0.id) }.count
      }
      let after = p.chatThread.messages
      let delta = after.filter { !beforeIds.contains($0.id) }
      page = Array(delta)
    } else {
      // Initial page: ensure we have at least `target` messages
      while p.chatThread.messages.count < target && p.chatThread.hasMoreMessagesToLoad {
        try await p.loadMoreMessages()
      }
      page = p.chatThread.messages
    }
    // Sort by createdAt descending for chat box consumption
    let sorted = page.sorted { $0.createdAt > $1.createdAt }
    let limited = Array(sorted.prefix(target))
    let encoded = limited.compactMap { JSONBridge.encode($0) as? [String: Any] }
    return [
      "messages": encoded,
      "scrollToken": p.chatThread.scrollToken,
      "hasMore": p.chatThread.hasMoreMessagesToLoad,
    ]
  }

  // Note: SDK doesn't provide server-side limit fetching; callers should
  // call loadMoreMessages() as needed before calling messages(...).

  static func listDetails() -> [[String: Any]] {
    let threads = CXoneChat.shared.threads.get()
    return threads.compactMap { JSONBridge.encode($0) as? [String: Any] }
  }

  static func getDetails(threadId: UUID) throws -> [String: Any] {
    let p = try provider(for: threadId)
    return (JSONBridge.encode(p.chatThread) as? [String: Any]) ?? [:]
  }

  // Limited variants removed; prefer callers to page with loadMore
  // and then use getDetails/listDetails/messages.
}
