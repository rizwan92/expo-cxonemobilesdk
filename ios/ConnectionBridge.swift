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
}

