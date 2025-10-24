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

  private static func encodeMessage(_ m: Message) -> [String: Any] {
    var text: String? = nil
    switch m.contentType {
    case .text(let payload): text = payload.text
    case .richLink(_): text = "[rich link]"
    case .quickReplies(_): text = "[quick replies]"
    case .listPicker(_): text = "[list picker]"
    case .unknown: text = "[unknown]"
    }
    var author: [String: Any]? = nil
    if let a = m.authorUser { author = encodeAgent(a) }
    return [
      "id": m.id.uuidString,
      "threadId": m.threadId.uuidString,
      "text": text as Any,
      "createdAt": iso.string(from: m.createdAt),
      "createdAtMs": Int64(m.createdAt.timeIntervalSince1970 * 1000),
      "direction": String(describing: m.direction),
      "status": String(describing: m.status),
      "author": author as Any,
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

