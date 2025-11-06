import CXoneChatSDK
import Foundation
import ExpoModulesCore

public class ExpoCxonemobilesdkModule: Module {
    private var delegateRegistered = false
    private func registerDelegateIfNeeded() {
        if !delegateRegistered {
            CXoneChat.shared.add(delegate: self)
            delegateRegistered = true
        }
    }

    private func emitChatSnapshot() {
        let stateStr = (JSONBridge.encode(ConnectionBridge.state()) as? String) ?? "unknown"
        let modeStr = (JSONBridge.encode(ConnectionBridge.mode()) as? String) ?? "unknown"
        self.sendEvent("chatUpdated", ["state": stateStr, "mode": modeStr])
    }

    private func waitUntil(_ timeoutMs: Int = 7000, _ predicate: @escaping () -> Bool) async throws {
        let start = Date()
        while !predicate() {
            try await Task.sleep(nanoseconds: 200_000_000)  // 200ms
            if Date().timeIntervalSince(start) * 1000.0 > Double(timeoutMs) {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -10,
                    userInfo: [NSLocalizedDescriptionKey: "Timeout while waiting for state"])
                    as Error
            }
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
            "authorizationChanged",
            "connectionError",
            "error",
            "tokenRefreshFailed",
            "proactivePopupAction"
        )

        // Example sync function removed per request.

        Function("disconnect") {
            ConnectionBridge.disconnect()
        }

        AsyncFunction("prepareAndConnect") {
            (env: String, brandId: Int, channelId: String) async throws in
            self.registerDelegateIfNeeded()

            // Preflight fetch to surface server-side configuration errors early
            do {
                _ = try await ConnectionBridge.getChannelConfiguration(
                    env: env, brandId: brandId, channelId: channelId)
            } catch {
                self.sendEvent(
                    "connectionError", ["phase": "preflight", "message": String(describing: error)])
                self.sendEvent("error", ["message": String(describing: error)])
                throw error
            }

            // Small helpers for clarity
            func prepareNow() async throws {
                do {
                    try await ConnectionBridge.prepare(
                        env: env, brandId: brandId, channelId: channelId)
                } catch {
                    self.sendEvent(
                        "connectionError",
                        ["phase": "prepare", "message": String(describing: error)])
                    self.sendEvent("error", ["message": String(describing: error)])
                    throw error
                }
            }
            func connectNow() async throws {
                do { try await ConnectionBridge.connect() } catch {
                    self.sendEvent(
                        "connectionError",
                        ["phase": "connect", "message": String(describing: error)])
                    self.sendEvent("error", ["message": String(describing: error)])
                    throw error
                }
            }
            func waitForConnected() async throws {
                do {
                    try await self.waitUntil(7000) {
                        let s = CXoneChat.shared.state
                        return s == .connected || s == .ready
                    }
                } catch {
                    self.sendEvent(
                        "connectionError",
                        ["phase": "connect", "message": "Timeout waiting for connection"])
                    self.sendEvent("error", ["message": "Timeout waiting for connection"])
                    throw error
                }
            }
            func waitWhilePreparing() async throws {
                do {
                    try await self.waitUntil(7000) { CXoneChat.shared.state != .preparing }
                } catch {
                    self.sendEvent(
                        "connectionError",
                        ["phase": "prepare", "message": "Timeout waiting for preparing to finish"])
                    self.sendEvent("error", ["message": "Timeout waiting for preparing to finish"])
                    throw error
                }
            }

            // Loop until connected/ready with minimal state transitions
            while true {
                switch CXoneChat.shared.state {
                case .connected, .ready:
                    self.emitChatSnapshot()
                    return
                case .initial:
                    try await prepareNow()
                // next iteration will handle connect based on new state
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

        // Optional combined URL variant
        AsyncFunction("prepareAndConnectWithURLs") {
            (chatURL: String, socketURL: String, brandId: Int, channelId: String) async throws in
            self.registerDelegateIfNeeded()
            do {
                _ = try await ConnectionBridge.getChannelConfiguration(
                    chatURL: chatURL, brandId: brandId, channelId: channelId)
            } catch {
                self.sendEvent(
                    "connectionError", ["phase": "preflight", "message": String(describing: error)])
                self.sendEvent("error", ["message": String(describing: error)])
                throw error
            }
            do {
                try await ConnectionBridge.prepare(
                    chatURL: chatURL, socketURL: socketURL, brandId: brandId, channelId: channelId)
            } catch {
                self.sendEvent(
                    "connectionError", ["phase": "prepare", "message": String(describing: error)])
                self.sendEvent("error", ["message": String(describing: error)])
                throw error
            }
            do {
                try await ConnectionBridge.connect()
            } catch {
                self.sendEvent(
                    "connectionError", ["phase": "connect", "message": String(describing: error)])
                self.sendEvent("error", ["message": String(describing: error)])
                throw error
            }
        }

        // (prepare/connect were removed in favor of combined API)

        // MARK: Connection utilities
        Function("getChatMode") { () -> String in
            (JSONBridge.encode(ConnectionBridge.mode()) as? String) ?? "unknown"
        }
        Function("getChatState") { () -> String in
            (JSONBridge.encode(ConnectionBridge.state()) as? String) ?? "unknown"
        }
        Function("isConnected") { () -> Bool in
            ConnectionBridge.isConnected()
        }
        AsyncFunction("executeTrigger") { (triggerId: String) async throws in
            guard let uuid = UUID(uuidString: triggerId) else {
                let err = NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(triggerId)"])
                throw err
            }
            try await ConnectionBridge.executeTrigger(uuid)
        }
        AsyncFunction("getChannelConfiguration") {
            (env: String, brandId: Int, channelId: String) async throws -> [String: Any] in
            let cfg = try await ConnectionBridge.getChannelConfiguration(
                env: env, brandId: brandId, channelId: channelId)
            let dto = ChannelConfigurationDTO(cfg)
            return try dto.asDictionary()
        }
        AsyncFunction("getChannelConfigurationByURL") {
            (chatURL: String, brandId: Int, channelId: String) async throws -> [String: Any] in
            let cfg = try await ConnectionBridge.getChannelConfiguration(
                chatURL: chatURL, brandId: brandId, channelId: channelId)
            let dto = ChannelConfigurationDTO(cfg)
            return try dto.asDictionary()
        }

        // MARK: Customer
        Function("setCustomerName") { (firstName: String, lastName: String) in
            CustomerBridge.setName(firstName: firstName, lastName: lastName)
        }

        Function("setCustomerIdentity") {
            (id: String, firstName: String?, lastName: String?) throws in
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
            self.sendEvent("authorizationChanged", ["status": "pending", "code": true])
        }

        Function("setCodeVerifier") { (verifier: String) in
            CustomerBridge.setCodeVerifier(verifier)
            self.sendEvent("authorizationChanged", ["status": "pending", "verifier": true])
        }

        Function("getVisitorId") { () -> String? in
            CustomerBridge.visitorId()
        }
        Function("getCustomerIdentity") { () -> [String: Any]? in
            CustomerBridge.identityDict()
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
            let threads = ThreadListBridge.get()
            return threads.compactMap { JSONBridge.encode($0) as? [String: Any] }
        }
        AsyncFunction("threadsCreate") {
            (customFields: [String: String]?) async throws -> [String: Any] in
            let thread = try await ThreadListBridge.create(customFields: customFields)
            return (JSONBridge.encode(thread) as? [String: Any]) ?? [:]
        }
        AsyncFunction("threadsLoad") { (threadId: String?) async throws in
            let uuid = threadId.flatMap(UUID.init(uuidString:))
            try await ThreadListBridge.load(threadId: uuid)
        }
        Function("threadsGetDetails") { (threadId: String) throws -> [String: Any] in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            let t = try ThreadListBridge.getDetails(threadId: uuid)
            return (JSONBridge.encode(t) as? [String: Any]) ?? [:]
        }
        AsyncFunction("threadsSend") { (threadId: String, message: [String: Any]) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            let text = message["text"] as? String ?? ""
            let postback = message["postback"] as? String
            let attachments = message["attachments"] as? [[String: Any]] ?? []
            var descs: [ContentDescriptor] = []
            for a in attachments {
                if let urlStr = a["url"] as? String,
                    let mime = a["mimeType"] as? String,
                    let fileName = a["fileName"] as? String,
                    let friendly = a["friendlyName"] as? String,
                    let url = URL(string: urlStr)
                {
                    descs.append(
                        ContentDescriptor(
                            url: url, mimeType: mime, fileName: fileName, friendlyName: friendly))
                } else if let base64 = a["data"] as? String,
                    let data = Data(base64Encoded: base64),
                    let mime = a["mimeType"] as? String,
                    let fileName = a["fileName"] as? String,
                    let friendly = a["friendlyName"] as? String
                {
                    descs.append(
                        ContentDescriptor(
                            data: data, mimeType: mime, fileName: fileName, friendlyName: friendly))
                }
            }
            let outbound = OutboundMessage(text: text, attachments: descs, postback: postback)
            try await ThreadBridge.send(threadId: uuid, message: outbound)
        }
        AsyncFunction("threadsLoadMore") { (threadId: String) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            try await ThreadBridge.loadMore(threadId: uuid)
        }
        AsyncFunction("threadsMarkRead") { (threadId: String) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            try await ThreadBridge.markRead(threadId: uuid)
        }
        AsyncFunction("threadsUpdateName") { (threadId: String, name: String) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            try await ThreadBridge.updateName(threadId: uuid, name: name)
        }
        AsyncFunction("threadsArchive") { (threadId: String) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            try await ThreadBridge.archive(threadId: uuid)
        }
        AsyncFunction("threadsEndContact") { (threadId: String) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            try await ThreadBridge.endContact(threadId: uuid)
        }
        // Matches ChatThreadProvider.reportTypingStart(_ didStart: Bool)
        AsyncFunction("threadsReportTypingStart") {
            (threadId: String, didStart: Bool) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            try await ThreadBridge.reportTyping(threadId: uuid, isTyping: didStart)
        }

        // Note: Paging is performed by calling threadsLoadMore + threadsGetDetails
        // Limited variants removed

        // MARK: Rich content messages
        AsyncFunction("threadsSendAttachmentURL") {
            (
                threadId: String, url: String, mimeType: String, fileName: String,
                friendlyName: String
            ) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            guard let u = URL(string: url) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -12,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid URL: \(url)"])
            }
            try await RichContentBridge.sendAttachmentURL(
                threadId: uuid, url: u, mimeType: mimeType, fileName: fileName,
                friendlyName: friendlyName)
        }
        AsyncFunction("threadsSendAttachmentBase64") {
            (
                threadId: String, base64: String, mimeType: String, fileName: String,
                friendlyName: String
            ) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            try await RichContentBridge.sendAttachmentBase64(
                threadId: uuid, base64: base64, mimeType: mimeType, fileName: fileName,
                friendlyName: friendlyName)
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
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            return CustomFieldsBridge.getThread(threadId: uuid)
        }
        AsyncFunction("threadCustomFieldsSet") {
            (threadId: String, fields: [String: String]) async throws in
            guard let uuid = UUID(uuidString: threadId) else {
                throw NSError(
                    domain: "ExpoCxonemobilesdk", code: -3,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid UUID: \(threadId)"])
            }
            try await CustomFieldsBridge.setThread(threadId: uuid, fields: fields)
        }

        // MARK: Auth / sign out
        Function("signOut") {
            CXoneChat.signOut()
        }

    }
}
// Keep minimal surface: prepare + connect + events
