import CXoneChatSDK
import Foundation

struct ChatUpdatedEventDTO: Encodable {
    let state: String
    let mode: String

    init(state: ChatState, mode: ChatMode) {
        self.state = String(describing: state)
        self.mode = String(describing: mode)
    }
}

struct ThreadUpdatedEventDTO: Encodable {
    let thread: ChatThreadDTO

    init(thread: ChatThread) throws {
        self.thread = try ChatThreadDTO(thread)
    }
}

struct ThreadsUpdatedEventDTO: Encodable {
    let threads: [ChatThreadDTO]

    init(threads: [ChatThread]) {
        self.threads = threads.compactMap { try? ChatThreadDTO($0) }
    }
}

struct AgentTypingEventDTO: Encodable {
    let isTyping: Bool
    let threadId: String
    let agent: AgentDTO

    init(isTyping: Bool, agent: Agent, threadId: UUID) {
        self.isTyping = isTyping
        self.threadId = threadId.uuidString
        self.agent = AgentDTO(agent)
    }
}

struct CustomEventMessageDTO: Encodable {
    let base64: String

    init(data: Data) {
        self.base64 = data.base64EncodedString()
    }
}

struct AuthorizationChangedEventDTO: Encodable {
    let status: String
    let code: Bool
    let verifier: Bool

    init(status: String, code: Bool = false, verifier: Bool = false) {
        self.status = status
        self.code = code
        self.verifier = verifier
    }
}

struct ConnectionErrorEventDTO: Encodable {
    let phase: String
    let message: String
}

struct ErrorEventDTO: Encodable {
    let message: String
}

struct ProactivePopupActionEventDTO: Encodable {
    let actionId: String
    let action: ProactiveActionDTO

    init(actionId: UUID, payload: [String: Any]) {
        self.actionId = actionId.uuidString
        self.action = ProactiveActionDTO(actionId: actionId, payload: payload)
    }
}

struct EmptyEventDTO: Encodable {}

extension ExpoCxonemobilesdkModule {
    func sendEvent<T: Encodable>(_ name: String, dto: T) {
        let dict = (try? dto.asDictionary()) ?? [:]
#if DEBUG
        if let data = try? JSONSerialization.data(withJSONObject: dict, options: [.prettyPrinted]),
           let json = String(data: data, encoding: .utf8) {
            NSLog("[ExpoCxonemobilesdk][Event] \(name) payload:\n\(json)")
        } else {
            NSLog("[ExpoCxonemobilesdk][Event] \(name) payload serialization failed")
        }
#endif
        self.sendEvent(name, dict)
    }
}
