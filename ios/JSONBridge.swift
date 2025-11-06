import CXoneChatSDK
import Foundation
import ObjectiveC.runtime

// Generic JSON encoder for CXoneChatSDK objects and common Swift types.
// Produces JSON-serializable structures ([String: Any], [Any], String, Double, Bool, NSNull).
enum JSONBridge {
    // ISO8601DateFormatter is not guaranteed thread-safe; guard with a serial queue.
    private static let iso = ISO8601DateFormatter()
    private static let isoQueue = DispatchQueue(label: "ExpoCxonemobilesdk.ISO8601DateFormatter")
    // Allow deeper traversal for rich configuration payloads
    private static let maxDepth = 12

    static func encode(_ value: Any) -> Any? {
        var visited = Set<ObjectIdentifier>()
        return encode(value, visited: &visited, depth: 0)
    }

    // MARK: - Internal encoder with cycle/depth protection
    private static func encode(_ value: Any, visited: inout Set<ObjectIdentifier>, depth: Int) -> Any? {
        if depth > maxDepth { return nil }

        // Optional handling via reflection (avoids fragile OptionalProtocol casting)
        let mirrorTop = Mirror(reflecting: value)
        if mirrorTop.displayStyle == .optional {
            if mirrorTop.children.count == 0 { return NSNull() }
            // Unwrap first child
            if let first = mirrorTop.children.first { return encode(first.value, visited: &visited, depth: depth + 1) }
        }

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
        if let d = value as? Date {
            return isoQueue.sync { iso.string(from: d) }
        }
        if let url = value as? URL { return url.absoluteString }
        if let data = value as? Data { return data.base64EncodedString() }

        // Enums — encode as string representation
        if mirrorTop.displayStyle == .enum { return String(describing: value) }

        // Arrays bridged to Swift
        if let arr = value as? [Any] {
            return arr.compactMap { encode($0, visited: &visited, depth: depth + 1) }
        }
        // Dictionaries bridged to Swift
        if let dict = value as? [String: Any] {
            var out: [String: Any] = [:]
            for (k, v) in dict { if let ev = encode(v, visited: &visited, depth: depth + 1) { out[k] = ev } }
            return out
        }

        // Generic collections/sets/dictionaries via Mirror when not bridged above
        let mirrorGeneric = Mirror(reflecting: value)
        if mirrorGeneric.displayStyle == .collection || mirrorGeneric.displayStyle == .set {
            var outArr: [Any] = []
            for child in mirrorGeneric.children {
                if let ev = encode(child.value, visited: &visited, depth: depth + 1) { outArr.append(ev) }
            }
            return outArr
        }
        if mirrorGeneric.displayStyle == .dictionary {
            var out: [String: Any] = [:]
            for child in mirrorGeneric.children {
                // Child is a key/value tuple
                let pair = Mirror(reflecting: child.value)
                var kStr: String = ""
                var val: Any? = nil
                for kv in pair.children {
                    if kv.label == "key" { kStr = String(describing: kv.value) }
                    if kv.label == "value" { val = kv.value }
                }
                if !kStr.isEmpty, let vEncoded = encode(val as Any, visited: &visited, depth: depth + 1) {
                    out[kStr] = vEncoded
                }
            }
            return out
        }

        // NSObject-based objects: attempt Objective-C property introspection for readable keys
        if let nsobj = value as? NSObject {
            var out: [String: Any] = [:]
            var currentClass: AnyClass? = type(of: nsobj)
            while let cls = currentClass, cls != NSObject.self {
                var count: UInt32 = 0
                if let props = class_copyPropertyList(cls, &count) {
                    for i in 0..<Int(count) {
                        let prop: objc_property_t = props[i]
                        if let name = String(utf8String: property_getName(prop)) {
                            if out.keys.contains(name) { continue }
                            // Avoid reserved names
                            if name == "description" || name == "debugDescription" || name == "hash" || name == "superclass" { continue }
                            let v = nsobj.value(forKey: name)
                            if let ev = encode(v as Any, visited: &visited, depth: depth + 1) { out[name] = ev }
                        }
                    }
                    free(props)
                }
                currentClass = class_getSuperclass(cls)
            }
            if !out.isEmpty { return out }
        }

        // Known SDK types with curated mapping
        if let m = value as? Message { return encodeMessage(m) }
        if let t = value as? ChatThread { return encodeThread(t) }
        if let a = value as? Agent { return encodeAgent(a) }

        // Fallback: reflect fields

        let mirror = Mirror(reflecting: value)

        // Prevent cycles for class instances
        if let obj = value as AnyObject? {
            let id = ObjectIdentifier(obj)
            if visited.contains(id) { return nil }
            visited.insert(id)
        }

        var out: [String: Any] = [:]
        for child in mirror.children {
            guard let key = child.label else { continue }
            if let ev = encode(child.value, visited: &visited, depth: depth + 1) { out[key] = ev }
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
                ],
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
                ],
            ]
        case .quickReplies(let qr):
            let buttons: [[String: Any]] = qr.buttons.map { encodeReplyButton($0) }
            return [
                "type": "quickReplies",
                "data": [
                    "title": qr.title,
                    "buttons": buttons,
                ],
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
                ],
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
                dict["seenAt"] = isoQueue.sync { iso.string(from: seen) }
            }
            if let read = us.readAt {
                dict["readAt"] = isoQueue.sync { iso.string(from: read) }
            }
            userStats = dict
        }
        let attachments = m.attachments.map { encodeAttachment($0) }
        let content = encodeContent(m.contentType)
        return [
            "id": m.id.uuidString,
            "threadId": m.threadId.uuidString,
            "createdAt": isoQueue.sync { iso.string(from: m.createdAt) },
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
        // Return messages newest-first to match UI expectations (index 0 is newest with inverted lists)
        let sorted = t.messages.sorted { $0.createdAt > $1.createdAt }
        base["messages"] = sorted.map { encodeMessage($0) }
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
