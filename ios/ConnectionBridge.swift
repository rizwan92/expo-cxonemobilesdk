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
    
    static func mode() -> ChatMode {
        CXoneChat.shared.mode
    }
    
    static func state() -> ChatState {
        CXoneChat.shared.state
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
    static func getChannelConfiguration(env: String, brandId: Int, channelId: String) async throws -> ChannelConfiguration {
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
        return cfg
    }
    
    static func getChannelConfiguration(chatURL: String, brandId: Int, channelId: String) async throws -> ChannelConfiguration {
        NSLog("[ExpoCxonemobilesdk] Connection.getChannelConfiguration chatURL=\(chatURL) brandId=\(brandId) channelId=\(channelId)")
        let cfg = try await CXoneChat.shared.connection.getChannelConfiguration(chatURL: chatURL, brandId: brandId, channelId: channelId)
        return cfg
    }
}
