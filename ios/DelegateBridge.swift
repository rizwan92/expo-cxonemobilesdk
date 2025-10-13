import Foundation
import CXoneChatSDK
import ExpoModulesCore

extension ExpoCxonemobilesdkModule: CXoneChatDelegate {
  // Track chat state changes
  public func onChatUpdated(_ state: ChatState, mode: ChatMode) {
    let payload: [String: Any] = [
      "state": String(describing: state),
      "mode": String(describing: mode)
    ]
    self.sendEvent("chatUpdated", payload)
  }

  public func onThreadUpdated(_ chatThread: ChatThread) {
    let id = DelegateBridgeUtils.threadIdString(chatThread)
    self.sendEvent("threadUpdated", ["threadId": id as Any])
  }

  public func onThreadsUpdated(_ chatThreads: [ChatThread]) {
    let ids = chatThreads.compactMap { DelegateBridgeUtils.threadIdString($0) }
    self.sendEvent("threadsUpdated", ["threadIds": ids])
  }

  public func onCustomEventMessage(_ messageData: Data) {
    let base64 = messageData.base64EncodedString()
    self.sendEvent("customEventMessage", ["base64": base64])
  }

  public func onAgentTyping(_ isTyping: Bool, agent: Agent, threadId: UUID) {
    let payload: [String: Any] = [
      "isTyping": isTyping,
      "threadId": threadId.uuidString,
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

  public func onProactivePopupAction(data: [String : Any], actionId: UUID) {
    self.sendEvent("proactivePopupAction", [
      "actionId": actionId.uuidString,
      "data": data
    ])
  }
}

enum DelegateBridgeUtils {
  static func threadIdString(_ thread: ChatThread) -> String? {
    let mirror = Mirror(reflecting: thread)
    for child in mirror.children {
      if child.label == "id", let id = child.value as? UUID {
        return id.uuidString
      }
    }
    return nil
  }
}

