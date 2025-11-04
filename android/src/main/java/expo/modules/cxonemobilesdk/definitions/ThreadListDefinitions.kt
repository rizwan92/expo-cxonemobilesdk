package expo.modules.cxonemobilesdk.definitions

import expo.modules.cxonemobilesdk.CXoneManager
import expo.modules.cxonemobilesdk.ExpoCxonemobilesdkModule
import expo.modules.cxonemobilesdk.JSONBridge
import expo.modules.kotlin.modules.ModuleDefinitionBuilder

internal fun ModuleDefinitionBuilder.addThreadListDefinitions(owner: ExpoCxonemobilesdkModule) {
  Function("threadsGet") {
    CXoneManager.getThreads().map { JSONBridge.threadToMap(it) }
  }
  AsyncFunction("threadsCreate") { customFields: Map<String, String>? ->
    val details = CXoneManager.createThread(customFields ?: emptyMap())
    JSONBridge.threadToMap(details)
  }
  AsyncFunction("threadsLoad") { threadId: String? ->
    CXoneManager.refreshThreads(threadId)
  }
  Function("threadsGetDetails") { threadId: String ->
    val t = CXoneManager.findThreadById(threadId)
      ?: throw IllegalArgumentException("Thread not found: $threadId")
    JSONBridge.threadToMap(t)
  }
}
