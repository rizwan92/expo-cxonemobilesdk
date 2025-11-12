package expo.modules.cxonemobilesdk.definitions

import expo.modules.cxonemobilesdk.CXoneManager
import expo.modules.cxonemobilesdk.ExpoCxonemobilesdkModule
import expo.modules.cxonemobilesdk.emitEmptyEvent
import expo.modules.kotlin.modules.ModuleDefinitionBuilder

internal fun ModuleDefinitionBuilder.addCustomFieldsDefinitions(owner: ExpoCxonemobilesdkModule) {
  Function("customerCustomFieldsGet") {
    val result: Map<String, String> = CXoneManager.withChatOrNull { chat ->
      chat?.fields?.associate { f -> f.id to f.value } ?: emptyMap()
    }
    result
  }
  AsyncFunction("customerCustomFieldsSet") { fields: Map<String, String> ->
    CXoneManager.withChat { it.customFields().add(fields) }
    owner.emitEmptyEvent("customerCustomFieldsSet")
  }
  Function("threadCustomFieldsGet") { threadId: String ->
    val t = CXoneManager.findThreadById(threadId) ?: return@Function emptyMap<String, String>()
    t.fields.associate { f -> f.id to f.value }
  }
  AsyncFunction("threadCustomFieldsSet") { threadId: String, fields: Map<String, String> ->
    CXoneManager.withThreadHandler(threadId) { customFields().add(fields) }
    owner.emitEmptyEvent("contactCustomFieldsSet")
  }

  // Auth / sign out
  Function("signOut") { CXoneManager.signOut() }
}
