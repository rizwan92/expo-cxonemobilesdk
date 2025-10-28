import Foundation
import CXoneChatSDK

enum ConnectionBridge {
  static func prepare(env: String, brandId: Int, channelId: String) async throws {
    NSLog("[ExpoCxonemobilesdk] Connection.prepare env=\(env) brandId=\(brandId) channelId=\(channelId)")
    guard let environment = Environment(rawValue: env.uppercased()) else {
      let err = NSError(
        domain: "ExpoCxonemobilesdk",
        code: -2,
        userInfo: [NSLocalizedDescriptionKey: "Unsupported CXone environment '\(env)'"]
      )
      throw err
    }
    try await CXoneChat.shared.connection.prepare(environment: environment, brandId: brandId, channelId: channelId)
  }

  static func prepare(chatURL: String, socketURL: String, brandId: Int, channelId: String) async throws {
    NSLog("[ExpoCxonemobilesdk] Connection.prepareWithURLs chatURL=\(chatURL) socketURL=\(socketURL) brandId=\(brandId) channelId=\(channelId)")
    try await CXoneChat.shared.connection.prepare(chatURL: chatURL, socketURL: socketURL, brandId: brandId, channelId: channelId)
  }

  static func connect() async throws {
    NSLog("[ExpoCxonemobilesdk] Connection.connect")
    try await CXoneChat.shared.connection.connect()
  }

  static func disconnect() {
    NSLog("[ExpoCxonemobilesdk] Connection.disconnect")
    CXoneChat.shared.connection.disconnect()
  }

  static func executeTrigger(_ triggerId: UUID) async throws {
    NSLog("[ExpoCxonemobilesdk] Connection.executeTrigger id=\(triggerId)")
    try await CXoneChat.shared.connection.executeTrigger(triggerId)
  }

  static func modeString() -> String {
    switch CXoneChat.shared.mode {
    case .singlethread: return "singlethread"
    case .multithread: return "multithread"
    case .liveChat: return "liveChat"
    @unknown default: return "unknown"
    }
  }

  static func stateString() -> String {
    let s = String(describing: CXoneChat.shared.state)
    NSLog("[ExpoCxonemobilesdk] Connection.state -> \(s)")
    return s
  }

  static func isConnected() -> Bool {
    switch CXoneChat.shared.state {
    case .connected, .ready:
      NSLog("[ExpoCxonemobilesdk] Connection.isConnected -> true")
      return true
    default:
      NSLog("[ExpoCxonemobilesdk] Connection.isConnected -> false")
      return false
    }
  }

  // MARK: Channel configuration fetchers
  static func getChannelConfiguration(env: String, brandId: Int, channelId: String) async throws -> [String: Any] {
    NSLog("[ExpoCxonemobilesdk] Connection.getChannelConfiguration env=\(env) brandId=\(brandId) channelId=\(channelId)")
    guard let environment = Environment(rawValue: env.uppercased()) else {
      let err = NSError(
        domain: "ExpoCxonemobilesdk",
        code: -2,
        userInfo: [NSLocalizedDescriptionKey: "Unsupported CXone environment '\(env)'"]
      )
      throw err
    }
    let cfg = try await CXoneChat.shared.connection.getChannelConfiguration(environment: environment, brandId: brandId, channelId: channelId)
    return (JSONBridge.encode(cfg) as? [String: Any]) ?? [:]
  }

  static func getChannelConfiguration(chatURL: String, brandId: Int, channelId: String) async throws -> [String: Any] {
    NSLog("[ExpoCxonemobilesdk] Connection.getChannelConfiguration chatURL=\(chatURL) brandId=\(brandId) channelId=\(channelId)")
    let cfg = try await CXoneChat.shared.connection.getChannelConfiguration(chatURL: chatURL, brandId: brandId, channelId: channelId)
    return (JSONBridge.encode(cfg) as? [String: Any]) ?? [:]
  }
}
