import CXoneChatSDK
import Foundation

// MARK: - Helpers

/// Shared ISO 8601 formatter (with fractional seconds) used by DTOs.
private enum ISO8601Helper {
  static let queue = DispatchQueue(label: "ExpoCxonemobilesdk.ISO8601Formatter")
  static let formatter: ISO8601DateFormatter = {
    let fmt = ISO8601DateFormatter()
    fmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return fmt
  }()

  static func string(from date: Date) -> String {
    queue.sync { formatter.string(from: date) }
  }
}

// MARK: - DTOs

/// Normalised view of an `Agent` for JS consumers.
struct AgentDTO: Encodable {
  let id: Int
  let firstName: String
  let surname: String
  let nickname: String?
  let fullName: String
  let imageUrl: String

  init(_ agent: Agent) {
    self.id = agent.id
    self.firstName = agent.firstName
    self.surname = agent.surname
    self.nickname = agent.nickname
    self.fullName = agent.fullName
    self.imageUrl = agent.imageUrl
  }
}

/// Attachment metadata exposed by CXone.
struct AttachmentDTO: Encodable {
  let url: String
  let friendlyName: String
  let mimeType: String
  let fileName: String

  init(_ attachment: Attachment) {
    self.url = attachment.url
    self.friendlyName = attachment.friendlyName
    self.mimeType = attachment.mimeType
    self.fileName = attachment.fileName
  }
}

/// Represents quick reply/list picker buttons included in rich messages.
struct MessageReplyButtonDTO: Encodable {
  let text: String
  let description: String?
  let postback: String?
  let iconName: String?
  let iconUrl: String?
  let iconMimeType: String?

  init(_ button: MessageReplyButton) {
    self.text = button.text
    self.description = button.description
    self.postback = button.postback
    self.iconName = button.iconName
    self.iconUrl = button.iconUrl?.absoluteString
    self.iconMimeType = button.iconMimeType
  }
}

/// Message delivery metadata (seen/read timestamps).
struct MessageUserStatisticsDTO: Encodable {
  let seenAt: String?
  let readAt: String?

  init(_ stats: UserStatistics) {
    self.seenAt = stats.seenAt.map(ISO8601Helper.string)
    self.readAt = stats.readAt.map(ISO8601Helper.string)
  }
}

struct SenderInfoDTO: Encodable {
  let id: String
  let firstName: String?
  let lastName: String?
  let fullName: String?

  init(_ info: SenderInfo) {
    self.id = info.id
    self.firstName = info.firstName
    self.lastName = info.lastName
    self.fullName = info.fullName
  }
}

/// Encapsulates the union of message content variants the SDK exposes.
enum MessageContentDTO: Encodable {
  case text(MessagePayloadDTO)
  case richLink(MessageRichLinkDTO)
  case quickReplies(MessageQuickRepliesDTO)
  case listPicker(MessageListPickerDTO)
  case unknown

  init(_ content: MessageContentType) {
    switch content {
    case .text(let payload):
      self = .text(MessagePayloadDTO(payload))
    case .richLink(let link):
      self = .richLink(MessageRichLinkDTO(link))
    case .quickReplies(let replies):
      self = .quickReplies(MessageQuickRepliesDTO(replies))
    case .listPicker(let picker):
      self = .listPicker(MessageListPickerDTO(picker))
    case .unknown:
      self = .unknown
    }
  }

  enum CodingKeys: String, CodingKey {
    case type
    case payload
    case data
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    switch self {
    case .text(let payload):
      try container.encode("text", forKey: .type)
      try container.encode(payload, forKey: .payload)
    case .richLink(let data):
      try container.encode("richLink", forKey: .type)
      try container.encode(data, forKey: .data)
    case .quickReplies(let data):
      try container.encode("quickReplies", forKey: .type)
      try container.encode(data, forKey: .data)
    case .listPicker(let data):
      try container.encode("listPicker", forKey: .type)
      try container.encode(data, forKey: .data)
    case .unknown:
      try container.encode("unknown", forKey: .type)
    }
  }
}

struct MessagePayloadDTO: Encodable {
  let text: String
  let postback: String?

  init(_ payload: MessagePayload) {
    self.text = payload.text
    self.postback = payload.postback
  }
}

struct MessageRichLinkDTO: Encodable {
  let title: String
  let url: String
  let fileName: String
  let fileUrl: String
  let mimeType: String

  init(_ link: MessageRichLink) {
    self.title = link.title
    self.url = link.url.absoluteString
    self.fileName = link.fileName
    self.fileUrl = link.fileUrl.absoluteString
    self.mimeType = link.mimeType
  }
}

struct MessageQuickRepliesDTO: Encodable {
  let title: String
  let buttons: [MessageReplyButtonDTO]

  init(_ quickReplies: MessageQuickReplies) {
    self.title = quickReplies.title
    self.buttons = quickReplies.buttons.map { MessageReplyButtonDTO($0) }
  }
}

struct MessageListPickerDTO: Encodable {
  let title: String
  let text: String
  let buttons: [MessageReplyButtonDTO]

  init(_ listPicker: MessageListPicker) {
    self.title = listPicker.title
    self.text = listPicker.text
    self.buttons = listPicker.buttons.compactMap { sub in
      switch sub {
      case .replyButton(let button):
        return MessageReplyButtonDTO(button)
      }
    }
  }
}

/// Canonical serialisable `Message` representation.
struct MessageDTO: Encodable {
  let id: String
  let threadId: String
  let createdAt: String
  let direction: String
  let status: String
  let authorUser: AgentDTO?
  let authorEndUserIdentity: CustomerIdentityDTO?
  let senderInfo: SenderInfoDTO?
  let userStatistics: MessageUserStatisticsDTO?
  let attachments: [AttachmentDTO]
  let contentType: MessageContentDTO

  init(_ message: Message) {
    self.id = message.id.uuidString
    self.threadId = message.threadId.uuidString
    self.createdAt = ISO8601Helper.string(from: message.createdAt)
    self.direction = String(describing: message.direction)
    self.status = String(describing: message.status)
    self.authorUser = message.authorUser.map(AgentDTO.init)
    self.authorEndUserIdentity = message.authorEndUserIdentity.map(CustomerIdentityDTO.init)
    self.senderInfo = message.senderInfo.map(SenderInfoDTO.init)
    self.userStatistics = message.userStatistics.map(MessageUserStatisticsDTO.init)
    self.attachments = message.attachments.map { AttachmentDTO($0) }
    self.contentType = MessageContentDTO(message.contentType)
  }
}

/// Complete thread snapshot used throughout the JS API.
struct ChatThreadDTO: Encodable {
  let id: String
  let name: String?
  let state: String
  let hasMoreMessagesToLoad: Bool
  let positionInQueue: Int?
  let assignedAgent: AgentDTO?
  let lastAssignedAgent: AgentDTO?
  let messagesCount: Int
  let messages: [MessageDTO]
  let scrollToken: String?

  init(_ thread: ChatThread) {
    self.id = thread.id.uuidString
    self.name = thread.name
    self.state = String(describing: thread.state)
    self.hasMoreMessagesToLoad = thread.hasMoreMessagesToLoad
    self.positionInQueue = thread.positionInQueue
    self.assignedAgent = thread.assignedAgent.map(AgentDTO.init)
    self.lastAssignedAgent = thread.lastAssignedAgent.map(AgentDTO.init)
    self.messagesCount = thread.messages.count
    let sorted = thread.messages.sorted { $0.createdAt > $1.createdAt }
    self.messages = sorted.map { MessageDTO($0) }
    self.scrollToken = ChatThreadDTO.scrollToken(from: thread)
  }

  private static func scrollToken(from thread: ChatThread) -> String? {
    let mirror = Mirror(reflecting: thread)
    for child in mirror.children {
      if child.label == "scrollToken", let value = child.value as? String {
        return value
      }
    }
    return nil
  }
}
