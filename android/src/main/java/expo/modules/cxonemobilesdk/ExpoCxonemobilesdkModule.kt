package expo.modules.cxonemobilesdk

import expo.modules.cxonemobilesdk.definitions.addAnalyticsDefinitions
import expo.modules.cxonemobilesdk.definitions.addConnectionDefinitions
import expo.modules.cxonemobilesdk.definitions.addCustomerDefinitions
import expo.modules.cxonemobilesdk.definitions.addCustomFieldsDefinitions
import expo.modules.cxonemobilesdk.definitions.addThreadDefinitions
import expo.modules.cxonemobilesdk.definitions.addThreadListDefinitions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoCxonemobilesdkModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoCxonemobilesdk")

    // Events (parity with iOS)
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
      "proactivePopupAction",
    )

    // Feature definitions split across files
    addConnectionDefinitions(this@ExpoCxonemobilesdkModule)
    addCustomerDefinitions(this@ExpoCxonemobilesdkModule)
    addAnalyticsDefinitions(this@ExpoCxonemobilesdkModule)
    addThreadListDefinitions(this@ExpoCxonemobilesdkModule)
    addThreadDefinitions(this@ExpoCxonemobilesdkModule)
    addCustomFieldsDefinitions(this@ExpoCxonemobilesdkModule)
  }
}
