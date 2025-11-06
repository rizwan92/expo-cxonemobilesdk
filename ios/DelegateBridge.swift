import CXoneChatSDK
import ExpoModulesCore
import Foundation

/// CXoneChat delegate that forwards SDK events to JS as serialised DTO payloads.
extension ExpoCxonemobilesdkModule: CXoneChatDelegate {
    // Track chat state changes
    public func onChatUpdated(_ state: ChatState, mode: ChatMode) {
        let payload: [String: Any] = [
            "state": String(describing: state),
            "mode": String(describing: mode),
        ]
        self.sendEvent("chatUpdated", payload)
    }

    public func onThreadUpdated(_ chatThread: ChatThread) {
        let threadDict = (try? ChatThreadDTO(chatThread).asDictionary()) ?? [:]
        self.sendEvent("threadUpdated", ["thread": threadDict])
    }

    public func onThreadsUpdated(_ chatThreads: [ChatThread]) {
        let threads = chatThreads.compactMap { try? ChatThreadDTO($0).asDictionary() }
        self.sendEvent("threadsUpdated", ["threads": threads])
    }

    public func onCustomEventMessage(_ messageData: Data) {
        let base64 = messageData.base64EncodedString()
        self.sendEvent("customEventMessage", ["base64": base64])
    }

    public func onAgentTyping(_ isTyping: Bool, agent: Agent, threadId: UUID) {
        let payload: [String: Any] = [
            "isTyping": isTyping,
            "threadId": threadId.uuidString,
            "agent": (try? AgentDTO(agent).asDictionary()) ?? [:],
        ]
        self.sendEvent("agentTyping", payload)
    }

    public func onContactCustomFieldsSet() {
        self.sendEvent("contactCustomFieldsSet", [:])
    }

    public func onCustomerCustomFieldsSet() {
        self.sendEvent("customerCustomFieldsSet", [:])
    }

    public func onError(_ error: any Error) {
        self.sendEvent("error", ["message": String(describing: error)])
    }

    public func onUnexpectedDisconnect() {
        self.sendEvent("unexpectedDisconnect", [:])
    }

    public func onTokenRefreshFailed() {
        self.sendEvent("tokenRefreshFailed", [:])
    }

    public func onProactivePopupAction(data: [String: Any], actionId: UUID) {
        let dto = ProactiveActionDTO(actionId: actionId, payload: data)
        let dict = (try? dto.asDictionary()) ?? [:]
        self.sendEvent(
            "proactivePopupAction",
            [
                "actionId": actionId.uuidString,
                "action": dict,
            ])
    }
}
