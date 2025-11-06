import CXoneChatSDK
import Foundation

struct ChannelConfigurationDTO: Encodable {
  let hasMultipleThreadsPerEndUser: Bool
  let isProactiveChatEnabled: Bool
  let isAuthorizationEnabled: Bool
  let fileRestrictions: FileRestrictionsDTO
  let features: [String: Bool]
  let isOnline: Bool
  let isLiveChat: Bool

  init(_ cfg: ChannelConfiguration) {
    self.hasMultipleThreadsPerEndUser = cfg.hasMultipleThreadsPerEndUser
    self.isProactiveChatEnabled = cfg.isProactiveChatEnabled
    self.isAuthorizationEnabled = cfg.isAuthorizationEnabled
    self.fileRestrictions = FileRestrictionsDTO(cfg.fileRestrictions)
    self.features = cfg.features
    self.isOnline = cfg.isOnline
    self.isLiveChat = cfg.isLiveChat
  }
}

struct FileRestrictionsDTO: Encodable {
  let allowedFileSize: AllowedFileSizeDTO?
  let isAttachmentsEnabled: Bool
  let allowedFileTypes: [AllowedFileTypeDTO]

  init(_ restrictions: FileRestrictions) {
    self.isAttachmentsEnabled = restrictions.isAttachmentsEnabled
    self.allowedFileSize = AllowedFileSizeDTO(restrictions.allowedFileSize)
    self.allowedFileTypes = FileRestrictionsDTO.buildAllowedFileTypes(restrictions.allowedFileTypes)
  }

  private static func buildAllowedFileTypes(_ value: Any?) -> [AllowedFileTypeDTO] {
    guard let value else { return [] }
    if let swiftArray = value as? [Any] {
      return swiftArray.compactMap { AllowedFileTypeDTO($0) }
    }
    let mirror = Mirror(reflecting: value)
    guard mirror.displayStyle == .collection || mirror.displayStyle == .set else { return [] }
    return mirror.children.compactMap { AllowedFileTypeDTO($0.value) }
  }
}

enum AllowedFileSizeDTO: Encodable {
  case number(Int)
  case range(minKb: Int?, maxKb: Int?)

  init?(_ value: Any?) {
    guard let value else { return nil }
    if let intValue = value as? Int { self = .number(intValue); return }
    if let num = value as? NSNumber { self = .number(num.intValue); return }
    if let doubleVal = value as? Double { self = .number(Int(doubleVal)); return }
    if let str = value as? String, let intValue = Int(str) { self = .number(intValue); return }
    let mirror = Mirror(reflecting: value)
    var minKb: Int?
    var maxKb: Int?
    var exact: Int?
    for child in mirror.children {
      guard let label = child.label else { continue }
      if let intVal = child.value as? Int {
        switch label {
        case "minKb", "min": minKb = intVal
        case "maxKb", "max": maxKb = intVal
        case "value": exact = intVal
        default: break
        }
      } else if let num = child.value as? NSNumber {
        switch label {
        case "minKb", "min": minKb = num.intValue
        case "maxKb", "max": maxKb = num.intValue
        case "value": exact = num.intValue
        default: break
        }
      }
    }
    if let exact { self = .number(exact); return }
    if minKb != nil || maxKb != nil { self = .range(minKb: minKb, maxKb: maxKb); return }
    return nil
  }

  func encode(to encoder: Encoder) throws {
    switch self {
    case .number(let value):
      var container = encoder.singleValueContainer()
      try container.encode(value)
    case .range(let minKb, let maxKb):
      var container = encoder.container(keyedBy: CodingKeys.self)
      try container.encodeIfPresent(minKb, forKey: .minKb)
      try container.encodeIfPresent(maxKb, forKey: .maxKb)
    }
  }

  private enum CodingKeys: String, CodingKey {
    case minKb
    case maxKb
  }
}

struct AllowedFileTypeDTO: Encodable {
  let mimeType: String
  let details: String?

  init?(_ value: Any) {
    if let dict = value as? [String: Any] {
      guard let mime = dict["mimeType"] as? String else { return nil }
      self.mimeType = mime
      self.details = dict["details"] as? String ?? dict["description"] as? String
      return
    }
    let mirror = Mirror(reflecting: value)
    var mime: String?
    var details: String?
    for child in mirror.children {
      guard let label = child.label else { continue }
      if label == "mimeType", let str = child.value as? String { mime = str }
      if (label == "description" || label == "details"), let str = child.value as? String { details = str }
    }
    guard let mime else { return nil }
    self.mimeType = mime
    self.details = details
  }
}

extension Encodable {
  func asDictionary() throws -> [String: Any] {
    let encoder = JSONEncoder()
    let data = try encoder.encode(self)
    let object = try JSONSerialization.jsonObject(with: data, options: [])
    return object as? [String: Any] ?? [:]
  }
}
