import CXoneChatSDK
import ExpoModulesCore
import Foundation

/// CXoneChat delegate that forwards SDK events to JS as serialised DTO payloads.
extension ExpoCxonemobilesdkModule: CXoneChatDelegate {
    // Track chat state changes
    public func onChatUpdated(_ state: ChatState, mode: ChatMode) {
        logRawEvent("chatUpdated(raw)", raw: "state=\(state), mode=\(mode)")
        let payload = ChatUpdatedEventDTO(state: state, mode: mode)
        self.sendEvent("chatUpdated", dto: payload)
    }

    public func onThreadUpdated(_ chatThread: ChatThread) {
        logRawEvent("threadUpdated(raw)", raw: chatThread)
        if let dto = try? ThreadUpdatedEventDTO(thread: chatThread) {
            self.sendEvent("threadUpdated", dto: dto)
        }
    }

    public func onThreadsUpdated(_ chatThreads: [ChatThread]) {
        logRawEvent("threadsUpdated(raw)", raw: chatThreads)
        let payload = ThreadsUpdatedEventDTO(threads: chatThreads)
        self.sendEvent("threadsUpdated", dto: payload)
    }

    public func onCustomEventMessage(_ messageData: Data) {
        logRawEvent("customEventMessage(raw)", raw: messageData)
        self.sendEvent("customEventMessage", dto: CustomEventMessageDTO(data: messageData))
    }

    public func onAgentTyping(_ isTyping: Bool, agent: Agent, threadId: UUID) {
        logRawEvent("agentTyping(raw)", raw: "threadId=\(threadId) agent=\(agent)")
        let payload = AgentTypingEventDTO(isTyping: isTyping, agent: agent, threadId: threadId)
        self.sendEvent("agentTyping", dto: payload)
    }

    public func onContactCustomFieldsSet() {
        self.sendEvent("contactCustomFieldsSet", dto: EmptyEventDTO())
    }

    public func onCustomerCustomFieldsSet() {
        logRawEvent("customerCustomFieldsSet(raw)", raw: [:])
        self.sendEvent("customerCustomFieldsSet", dto: EmptyEventDTO())
    }

    public func onError(_ error: any Error) {
        logRawEvent("error(raw)", raw: error)
        self.sendEvent("error", dto: ErrorEventDTO(message: String(describing: error)))
    }

    public func onUnexpectedDisconnect() {
        logRawEvent("unexpectedDisconnect(raw)", raw: [:])
        self.sendEvent("unexpectedDisconnect", dto: EmptyEventDTO())
    }

    public func onTokenRefreshFailed() {
        logRawEvent("tokenRefreshFailed(raw)", raw: [:])
        self.sendEvent("tokenRefreshFailed", dto: EmptyEventDTO())
    }

    public func onProactivePopupAction(data: [String: Any], actionId: UUID) {
        logRawEvent("proactivePopupAction(raw)", raw: data)
        let payload = ProactivePopupActionEventDTO(actionId: actionId, payload: data)
        self.sendEvent("proactivePopupAction", dto: payload)
    }
}
