import Foundation
import CXoneChatSDK

extension ExpoCxonemobilesdkModule {
    /// Emits the current chat state/mode snapshot to JS.
    func emitChatSnapshot() {
        let payload = ChatUpdatedEventDTO(
            state: ConnectionBridge.state(), mode: ConnectionBridge.mode())
        self.sendEvent("chatUpdated", dto: payload)
    }

    func emitConnectionError(phase: String, message: String) {
        let payload = ConnectionErrorEventDTO(phase: phase, message: message)
        self.sendEvent("connectionError", dto: payload)
        emitError(message: message)
    }

    func emitError(message: String) {
        self.sendEvent("error", dto: ErrorEventDTO(message: message))
    }

    func logRawEvent(_ name: String, raw: Any) {
#if DEBUG
        NSLog("[ExpoCxonemobilesdk][EventRaw] \(name): \(raw)")
#endif
    }

    func preflightChannel(env: String? = nil, chatURL: String? = nil, brandId: Int, channelId: String) async throws {
        do {
            if let env {
                _ = try await ConnectionBridge.getChannelConfiguration(env: env, brandId: brandId, channelId: channelId)
            } else if let chatURL {
                _ = try await ConnectionBridge.getChannelConfiguration(chatURL: chatURL, brandId: brandId, channelId: channelId)
            }
        } catch {
            emitConnectionError(phase: "preflight", message: String(describing: error))
            throw error
        }
    }

    func loopUntilConnected(env: String, brandId: Int, channelId: String) async throws {
        func prepareNow() async throws {
            do {
                try await ConnectionBridge.prepare(env: env, brandId: brandId, channelId: channelId)
            } catch {
                emitConnectionError(phase: "prepare", message: String(describing: error))
                throw error
            }
        }

        func connectNow() async throws {
            do { try await ConnectionBridge.connect() } catch {
                emitConnectionError(phase: "connect", message: String(describing: error))
                throw error
            }
        }

        func waitForConnected() async throws {
            do {
                try await waitUntil(7000) {
                    let s = CXoneChat.shared.state
                    return s == .connected || s == .ready
                }
            } catch {
                emitConnectionError(phase: "connect", message: "Timeout waiting for connection")
                throw error
            }
        }

        func waitWhilePreparing() async throws {
            do {
                try await waitUntil(7000) { CXoneChat.shared.state != .preparing }
            } catch {
                emitConnectionError(phase: "prepare", message: "Timeout waiting for preparing to finish")
                throw error
            }
        }

        while true {
            switch CXoneChat.shared.state {
            case .connected, .ready:
                emitChatSnapshot()
                return
            case .initial:
                try await prepareNow()
            case .prepared, .offline:
                try await connectNow()
            case .preparing:
                try await waitWhilePreparing()
            case .connecting:
                try await waitForConnected()
            @unknown default:
                try await prepareNow()
                try await connectNow()
            }
        }
    }
}
