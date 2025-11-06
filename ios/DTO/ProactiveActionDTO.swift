import Foundation

/// Human-readable content for proactive popups.
struct ProactiveActionContentDTO: Encodable {
  let bodyText: String?
  let headlineText: String?
  let headlineSecondaryText: String?
  let image: String?

  init(_ dictionary: [String: Any]) {
    self.bodyText = ProactiveActionDTO.string(from: dictionary["bodyText"])
    self.headlineText = ProactiveActionDTO.string(from: dictionary["headlineText"])
    self.headlineSecondaryText = ProactiveActionDTO.string(from: dictionary["headlineSecondaryText"])
    self.image = ProactiveActionDTO.string(from: dictionary["image"])
  }
}

/// DTO wrapping the loosely-typed proactive popup payload emitted by the SDK.
struct ProactiveActionDTO: Encodable {
  let actionId: String
  let eventId: String?
  let name: String?
  let type: String?
  let content: ProactiveActionContentDTO?

  init(actionId: UUID, payload: [String: Any]) {
    self.actionId = actionId.uuidString

    let destination = payload["destination"] as? [String: Any]
    self.eventId = ProactiveActionDTO.string(from: destination?["id"])

    let actionDetails = (payload["proactiveAction"] as? [String: Any])?[
      "action"
    ] as? [String: Any]

    self.name = ProactiveActionDTO.string(from: actionDetails?["actionName"])
    self.type = ProactiveActionDTO.string(from: actionDetails?["actionType"])

    if let data = actionDetails?["data"] as? [String: Any],
       let contentDict = data["content"] as? [String: Any] {
      self.content = ProactiveActionContentDTO(contentDict)
    } else {
      self.content = nil
    }
  }

  static func string(from value: Any?) -> String? {
    guard let value else { return nil }
    if let s = value as? String { return s }
    if let num = value as? NSNumber { return num.stringValue }
    return nil
  }
}
