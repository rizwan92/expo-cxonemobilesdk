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
  Function("setAuthorizationCode") { code: String -> CXoneManager.setAuthorizationCode(code) }
  Function("setCodeVerifier") { verifier: String -> CXoneManager.setCodeVerifier(verifier) }
  Function("getVisitorId") { CXoneManager.getVisitorId() }
}
