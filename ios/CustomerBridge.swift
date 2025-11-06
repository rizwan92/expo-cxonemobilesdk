import CXoneChatSDK
import Foundation

/// Customer-related helpers used by the module definition.
enum CustomerBridge {
    /// Returns the current identity, normalised for JS consumption.
    static func identityDict() -> [String: Any]? {
        // CXoneChat.shared.customer conforms to a provider exposing get()
        if let ident = CXoneChat.shared.customer.get() {
            return try? CustomerIdentityDTO(ident).asDictionary()
        }
        return nil
    }

    static func setName(firstName: String, lastName: String) {
        NSLog("[ExpoCxonemobilesdk] Customer.setName first=\(firstName) last=\(lastName)")
        CXoneChat.shared.customer.setName(firstName: firstName, lastName: lastName)
    }

    static func setIdentity(id: String, firstName: String?, lastName: String?) throws {
        NSLog(
            "[ExpoCxonemobilesdk] Customer.setIdentity id=\(id) first=\(String(describing: firstName)) last=\(String(describing: lastName))"
        )
        let identity = CustomerIdentity(id: id, firstName: firstName, lastName: lastName)
        try CXoneChat.shared.customer.set(customer: identity)
    }

    static func clearIdentity() throws {
        NSLog("[ExpoCxonemobilesdk] Customer.clearIdentity")
        try CXoneChat.shared.customer.set(customer: nil)
    }

    static func setDeviceToken(_ token: String) {
        NSLog("[ExpoCxonemobilesdk] Customer.setDeviceToken <redacted>")
        CXoneChat.shared.customer.setDeviceToken(token)
    }

    static func setAuthorizationCode(_ code: String) {
        NSLog("[ExpoCxonemobilesdk] Customer.setAuthorizationCode <redacted>")
        CXoneChat.shared.customer.setAuthorizationCode(code)
    }

    static func setCodeVerifier(_ verifier: String) {
        NSLog("[ExpoCxonemobilesdk] Customer.setCodeVerifier <redacted>")
        CXoneChat.shared.customer.setCodeVerifier(verifier)
    }

    static func visitorId() -> String? {
        CXoneChat.shared.analytics.visitorId?.uuidString
    }

    // No direct getter provided by SDK; identity is not cached locally.
}
