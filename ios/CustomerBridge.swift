import Foundation
import CXoneChatSDK

enum CustomerBridge {
    static func setName(firstName: String, lastName: String) {
        NSLog("[ExpoCxonemobilesdk] Customer.setName first=\(firstName) last=\(lastName)")
        CXoneChat.shared.customer.setName(firstName: firstName, lastName: lastName)
    }
    
    static func setIdentity(id: String, firstName: String?, lastName: String?) throws {
        NSLog("[ExpoCxonemobilesdk] Customer.setIdentity id=\(id) first=\(String(describing: firstName)) last=\(String(describing: lastName))")
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
}

