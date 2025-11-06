import CXoneChatSDK
import Foundation

/// Minimal DTO mirroring `CustomerIdentity` to keep JS payloads stable across platforms.
struct CustomerIdentityDTO: Encodable {
  let id: String
  let firstName: String?
  let lastName: String?

  init(_ identity: CustomerIdentity) {
    self.id = identity.id
    self.firstName = identity.firstName
    self.lastName = identity.lastName
  }
}
