import ExpoModulesCore
import CXoneChatSDK

public class ExpoCxonemobilesdkModule: Module {
  private var delegateRegistered = false
  private func registerDelegateIfNeeded() {
    if !delegateRegistered {
      CXoneChat.shared.add(delegate: self)
      delegateRegistered = true
    }
  }
    
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module.
    Name("ExpoCxonemobilesdk")

    // Events emitted from CXoneChat delegate
    Events(
      "chatUpdated",
      "threadUpdated",
      "threadsUpdated",
      "agentTyping",
      "unexpectedDisconnect",
      "customEventMessage",
      "contactCustomFieldsSet",
      "customerCustomFieldsSet",
      "error",
      "tokenRefreshFailed",
      "proactivePopupAction"
    )

    // Example sync function removed per request.

    Function("disconnect") {
      ConnectionBridge.disconnect()
    }

    AsyncFunction("prepare") { (env: String, brandId: Int, channelId: String) async throws in
      self.registerDelegateIfNeeded()
      try await ConnectionBridge.prepare(env: env, brandId: brandId, channelId: channelId)
    }

    AsyncFunction("prepareWithURLs") { (chatURL: String, socketURL: String, brandId: Int, channelId: String) async throws in
      self.registerDelegateIfNeeded()
      try await ConnectionBridge.prepare(chatURL: chatURL, socketURL: socketURL, brandId: brandId, channelId: channelId)
    }

    AsyncFunction("connect") { () async throws in
      self.registerDelegateIfNeeded()
      try await ConnectionBridge.connect()
    }

    // MARK: Connection utilities
    Function("getChatMode") { () -> String in
      ConnectionBridge.modeString()
    }
    Function("getChatState") { () -> String in
      ConnectionBridge.stateString()
    }
    Function("isConnected") { () -> Bool in
      ConnectionBridge.isConnected()
    }
    AsyncFunction("executeTrigger") { (triggerId: String) async throws in
      guard let uuid = UUID(uuidString: triggerId) else {
        let err = NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(triggerId)"])
        throw err
      }
      try await ConnectionBridge.executeTrigger(uuid)
    }
    AsyncFunction("getChannelConfiguration") { (env: String, brandId: Int, channelId: String) async throws -> [String: Any] in
      try await ConnectionBridge.getChannelConfiguration(env: env, brandId: brandId, channelId: channelId)
    }
    AsyncFunction("getChannelConfigurationByURL") { (chatURL: String, brandId: Int, channelId: String) async throws -> [String: Any] in
      try await ConnectionBridge.getChannelConfiguration(chatURL: chatURL, brandId: brandId, channelId: channelId)
    }

    // MARK: Customer
    Function("setCustomerName") { (firstName: String, lastName: String) in
      CustomerBridge.setName(firstName: firstName, lastName: lastName)
    }

    Function("setCustomerIdentity") { (id: String, firstName: String?, lastName: String?) throws in
      try CustomerBridge.setIdentity(id: id, firstName: firstName, lastName: lastName)
    }

    Function("clearCustomerIdentity") { () throws in
      try CustomerBridge.clearIdentity()
    }

    Function("setDeviceToken") { (token: String) in
      CustomerBridge.setDeviceToken(token)
    }

    Function("setAuthorizationCode") { (code: String) in
      CustomerBridge.setAuthorizationCode(code)
    }

    Function("setCodeVerifier") { (verifier: String) in
      CustomerBridge.setCodeVerifier(verifier)
    }

    Function("getVisitorId") { () -> String? in
      CustomerBridge.visitorId()
    }

    // MARK: Analytics
    AsyncFunction("analyticsViewPage") { (title: String, url: String) async throws in
      try await AnalyticsBridge.viewPage(title: title, url: url)
    }

    AsyncFunction("analyticsViewPageEnded") { (title: String, url: String) async throws in
      try await AnalyticsBridge.viewPageEnded(title: title, url: url)
    }

    AsyncFunction("analyticsChatWindowOpen") { () async throws in
      try await AnalyticsBridge.chatWindowOpen()
    }

    AsyncFunction("analyticsConversion") { (type: String, value: Double) async throws in
      try await AnalyticsBridge.conversion(type: type, value: value)
    }

    // MARK: Threads (multithread support)
    // Matches ChatThreadListProvider.get()
    Function("threadsGet") { () -> [[String: Any]] in
      ThreadsBridge.listDetails()
    }
    AsyncFunction("threadsCreate") { (customFields: [String: String]?) async throws -> [String: Any] in
      try await ThreadsBridge.create(customFields: customFields)
    }
    AsyncFunction("threadsLoad") { (threadId: String?) async throws in
      let uuid = threadId.flatMap(UUID.init(uuidString:))
      try await ThreadsBridge.load(threadId: uuid)
    }
    Function("threadsGetDetails") { (threadId: String) throws -> [String: Any] in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      return try ThreadsBridge.getDetails(threadId: uuid)
    }
    AsyncFunction("threadsSend") { (threadId: String, message: [String: Any]) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      let text = message["text"] as? String ?? ""
      let postback = message["postback"] as? String
      let attachments = message["attachments"] as? [[String: Any]] ?? []
      try await ThreadsBridge.sendOutbound(threadId: uuid, text: text, postback: postback, attachments: attachments)
    }
    AsyncFunction("threadsLoadMore") { (threadId: String) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      try await ThreadsBridge.loadMore(threadId: uuid)
    }
    AsyncFunction("threadsMarkRead") { (threadId: String) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      try await ThreadsBridge.markRead(threadId: uuid)
    }
    AsyncFunction("threadsUpdateName") { (threadId: String, name: String) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      try await ThreadsBridge.updateName(threadId: uuid, name: name)
    }
    AsyncFunction("threadsArchive") { (threadId: String) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      try await ThreadsBridge.archive(threadId: uuid)
    }
    AsyncFunction("threadsEndContact") { (threadId: String) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      try await ThreadsBridge.endContact(threadId: uuid)
    }
    // Matches ChatThreadProvider.reportTypingStart(_ didStart: Bool)
    AsyncFunction("threadsReportTypingStart") { (threadId: String, didStart: Bool) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      try await ThreadsBridge.reportTyping(threadId: uuid, isTyping: didStart)
    }

    AsyncFunction("threadsGetMessages") { (threadId: String, scrollToken: String?, limit: Int?) async throws -> [String: Any] in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      return try await ThreadsBridge.messagesPage(threadId: uuid, scrollToken: scrollToken, limit: limit)
    }
    // Limited variants removed

    // MARK: Rich content messages
    AsyncFunction("threadsSendAttachmentURL") { (threadId: String, url: String, mimeType: String, fileName: String, friendlyName: String) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      guard let u = URL(string: url) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -12, userInfo: [NSLocalizedDescriptionKey: "Invalid URL: \(url)"])
      }
      try await RichContentBridge.sendAttachmentURL(threadId: uuid, url: u, mimeType: mimeType, fileName: fileName, friendlyName: friendlyName)
    }
    AsyncFunction("threadsSendAttachmentBase64") { (threadId: String, base64: String, mimeType: String, fileName: String, friendlyName: String) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      try await RichContentBridge.sendAttachmentBase64(threadId: uuid, base64: base64, mimeType: mimeType, fileName: fileName, friendlyName: friendlyName)
    }

    // MARK: Custom fields
    Function("customerCustomFieldsGet") { () -> [String: String] in
      CustomFieldsBridge.getCustomer()
    }
    AsyncFunction("customerCustomFieldsSet") { (fields: [String: String]) async throws in
      try await CustomFieldsBridge.setCustomer(fields)
    }
    Function("threadCustomFieldsGet") { (threadId: String) throws -> [String: String] in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      return CustomFieldsBridge.getThread(threadId: uuid)
    }
    AsyncFunction("threadCustomFieldsSet") { (threadId: String, fields: [String: String]) async throws in
      guard let uuid = UUID(uuidString: threadId) else {
        throw NSError(domain: "ExpoCxonemobilesdk", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
      }
      try await CustomFieldsBridge.setThread(threadId: uuid, fields: fields)
    }

    // MARK: Auth / sign out
    Function("signOut") {
      CXoneChat.signOut()
    }


  }
}
