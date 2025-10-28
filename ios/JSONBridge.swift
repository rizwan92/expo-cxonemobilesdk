import Foundation
import CXoneChatSDK

// Generic JSON encoder for CXoneChatSDK objects and common Swift types.
// Produces JSON-serializable structures ([String: Any], [Any], String, Double, Bool, NSNull).
enum JSONBridge {
  private static let iso = ISO8601DateFormatter()

  static func encode(_ value: Any) -> Any? {
    // Nil handling
    if let opt = value as? OptionalProtocol { return opt.isNil ? NSNull() : encode(opt.wrappedAny as Any) }

    // Primitives
    switch value {
    case let v as String: return v
    case let v as Int: return v
    case let v as Int64: return v
    case let v as Double: return v
    case let v as Float: return Double(v)
    case let v as Bool: return v
    case _ as NSNull: return NSNull()
    default: break
    }

    // Common bridged types
    if let u = value as? UUID { return u.uuidString }
    if let d = value as? Date { return iso.string(from: d) }
    if let url = value as? URL { return url.absoluteString }
    if let data = value as? Data { return data.base64EncodedString() }

    // Arrays
    if let arr = value as? [Any] { return arr.compactMap { encode($0) } }
    // Dictionaries
    if let dict = value as? [String: Any] {
      var out: [String: Any] = [:]
      for (k, v) in dict { if let ev = encode(v) { out[k] = ev } }
      return out
    }

    // Known SDK types with curated mapping
    if let m = value as? Message { return encodeMessage(m) }
    if let t = value as? ChatThread { return encodeThread(t) }
    if let a = value as? Agent { return encodeAgent(a) }

    // Fallback: reflect fields
    let mirror = Mirror(reflecting: value)
    var out: [String: Any] = [:]
    for child in mirror.children {
      guard let key = child.label else { continue }
      if let ev = encode(child.value) { out[key] = ev }
    }
    return out
  }

  // MARK: Curated encoders for stability where UI expects specific fields
  private static func encodeAgent(_ a: Agent) -> [String: Any] {
    return [
      "id": a.id,
      "firstName": a.firstName,
      "surname": a.surname,
      "nickname": a.nickname as Any,
      "fullName": a.fullName,
      "imageUrl": a.imageUrl,
    ]
  }

  private static func encodeAttachment(_ att: Attachment) -> [String: Any] {
    return [
      "url": att.url,
      "friendlyName": att.friendlyName,
      "mimeType": att.mimeType,
      "fileName": att.fileName,
    ]
  }

  private static func encodeReplyButton(_ btn: MessageReplyButton) -> [String: Any] {
    return [
      "text": btn.text,
      "description": btn.description as Any,
      "postback": btn.postback as Any,
      "iconName": btn.iconName as Any,
      "iconUrl": btn.iconUrl?.absoluteString as Any,
      "iconMimeType": btn.iconMimeType as Any,
    ]
  }

  private static func encodeContent(_ c: MessageContentType) -> [String: Any] {
    switch c {
    case .text(let payload):
      return [
        "type": "text",
        "payload": [
          "text": payload.text,
          "postback": payload.postback as Any,
        ]
      ]
    case .richLink(let link):
      return [
        "type": "richLink",
        "data": [
          "title": link.title,
          "url": link.url.absoluteString,
          "fileName": link.fileName,
          "fileUrl": link.fileUrl.absoluteString,
          "mimeType": link.mimeType,
        ]
      ]
    case .quickReplies(let qr):
      let buttons: [[String: Any]] = qr.buttons.compactMap { sub in
        switch sub {
        case .replyButton(let b):
          return encodeReplyButton(b)
        }
      }
      return [
        "type": "quickReplies",
        "data": [
          "title": qr.title,
          "buttons": buttons,
        ]
      ]
    case .listPicker(let lp):
      let buttons: [[String: Any]] = lp.buttons.compactMap { sub in
        switch sub {
        case .replyButton(let b):
          return encodeReplyButton(b)
        }
      }
      return [
        "type": "listPicker",
        "data": [
          "title": lp.title,
          "text": lp.text,
          "buttons": buttons,
        ]
      ]
    case .unknown:
      return ["type": "unknown"]
    }
  }

  private static func encodeMessage(_ m: Message) -> [String: Any] {
    var author: [String: Any]? = nil
    if let a = m.authorUser { author = encodeAgent(a) }
    var endUserIdentity: [String: Any]? = nil
    if let eu = m.authorEndUserIdentity {
      endUserIdentity = [
        "id": eu.id,
        "firstName": eu.firstName as Any,
        "lastName": eu.lastName as Any,
      ]
    }
    var senderInfo: [String: Any]? = nil
    if let s = m.senderInfo {
      senderInfo = [
        "id": s.id,
        "firstName": s.firstName as Any,
        "lastName": s.lastName as Any,
        "fullName": s.fullName as Any,
      ]
    }
    var userStats: [String: Any]? = nil
    if let us = m.userStatistics {
      var dict: [String: Any] = [:]
      if let seen = us.seenAt {
        dict["seenAt"] = iso.string(from: seen)
      }
      if let read = us.readAt {
        dict["readAt"] = iso.string(from: read)
      }
      userStats = dict
    }
    let attachments = m.attachments.map { encodeAttachment($0) }
    let content = encodeContent(m.contentType)
    return [
      "id": m.id.uuidString,
      "threadId": m.threadId.uuidString,
      "createdAt": iso.string(from: m.createdAt),
      "direction": String(describing: m.direction),
      "status": String(describing: m.status),
      "authorUser": author as Any,
      "authorEndUserIdentity": endUserIdentity as Any,
      "senderInfo": senderInfo as Any,
      "userStatistics": userStats as Any,
      "attachments": attachments,
      "contentType": content,
    ]
  }

  private static func encodeThread(_ t: ChatThread) -> [String: Any] {
    var base: [String: Any] = [
      "id": t.id.uuidString,
      "name": t.name as Any,
      "state": String(describing: t.state),
      "hasMoreMessagesToLoad": t.hasMoreMessagesToLoad,
      "positionInQueue": t.positionInQueue as Any,
      "assignedAgent": encode(t.assignedAgent as Any) as Any,
      "lastAssignedAgent": encode(t.lastAssignedAgent as Any) as Any,
      "messagesCount": t.messages.count,
    ]
    base["messages"] = t.messages.map { encodeMessage($0) }
    // Grab scrollToken if exposed
    let mirror = Mirror(reflecting: t)
    for child in mirror.children {
      if child.label == "scrollToken", let token = child.value as? String {
        base["scrollToken"] = token
      }
    }
    return base
  }
}

// Utility to detect Optional without generic constraints
private protocol OptionalProtocol { var isNil: Bool { get }; var wrappedAny: Any? { get } }
extension Optional: OptionalProtocol {
  var isNil: Bool { self == nil }
  var wrappedAny: Any? { self }
}
