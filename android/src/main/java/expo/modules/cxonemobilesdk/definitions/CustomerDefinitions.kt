package expo.modules.cxonemobilesdk.definitions

import expo.modules.cxonemobilesdk.CXoneManager
import expo.modules.cxonemobilesdk.ExpoCxonemobilesdkModule
import expo.modules.kotlin.modules.ModuleDefinitionBuilder

internal fun ModuleDefinitionBuilder.addCustomerDefinitions(owner: ExpoCxonemobilesdkModule) {
  Function("setCustomerName") { firstName: String, lastName: String ->
    CXoneManager.setUserName(firstName, lastName)
  }
  Function("setCustomerIdentity") { id: String, firstName: String?, lastName: String? ->
    CXoneManager.setCustomerIdentity(id, firstName, lastName)
  }
  Function("clearCustomerIdentity") { CXoneManager.clearCustomerIdentity() }
  Function("setDeviceToken") { token: String -> CXoneManager.setDeviceToken(token) }
  Function("setAuthorizationCode") { code: String ->
    CXoneManager.setAuthorizationCode(code)
    owner.sendEvent("authorizationChanged", mapOf("status" to "pending", "code" to true))
  }
  Function("setCodeVerifier") { verifier: String ->
    CXoneManager.setCodeVerifier(verifier)
    owner.sendEvent("authorizationChanged", mapOf("status" to "pending", "verifier" to true))
  }
  Function("getVisitorId") { CXoneManager.getVisitorId() }
}
