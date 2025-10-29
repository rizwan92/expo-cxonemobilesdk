import CXoneChatSDK
import Foundation

enum AnalyticsBridge {
    static func viewPage(title: String, url: String) async throws {
        NSLog("[ExpoCxonemobilesdk] Analytics.viewPage title=\(title) url=\(url)")
        try await CXoneChat.shared.analytics.viewPage(title: title, url: url)
    }

    static func viewPageEnded(title: String, url: String) async throws {
        NSLog("[ExpoCxonemobilesdk] Analytics.viewPageEnded title=\(title) url=\(url)")
        try await CXoneChat.shared.analytics.viewPageEnded(title: title, url: url)
    }

    static func chatWindowOpen() async throws {
        NSLog("[ExpoCxonemobilesdk] Analytics.chatWindowOpen")
        try await CXoneChat.shared.analytics.chatWindowOpen()
    }

    static func conversion(type: String, value: Double) async throws {
        NSLog("[ExpoCxonemobilesdk] Analytics.conversion type=\(type) value=\(value)")
        try await CXoneChat.shared.analytics.conversion(type: type, value: value)
    }
}
