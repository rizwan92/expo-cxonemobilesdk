package expo.modules.cxonemobilesdk.definitions

import expo.modules.cxonemobilesdk.CXoneManager
import expo.modules.cxonemobilesdk.ExpoCxonemobilesdkModule
import expo.modules.cxonemobilesdk.dto.ChatThreadDTO
import expo.modules.cxonemobilesdk.dto.PreChatSurveyDTO
import expo.modules.kotlin.modules.ModuleDefinitionBuilder

internal fun ModuleDefinitionBuilder.addThreadListDefinitions(owner: ExpoCxonemobilesdkModule) {
  Function("threadsGetPreChatSurvey") {
    CXoneManager.withChatOrNull { chat ->
      val survey = chat?.threads()?.preChatSurvey ?: return@withChatOrNull null
      PreChatSurveyDTO.from(survey).toMap()
    }
  }
  Function("threadsGet") {
    CXoneManager.getThreads().map { ChatThreadDTO.from(it).toMap() }
  }
  AsyncFunction("threadsCreate") { customFields: Map<String, String>? ->
    val details = CXoneManager.createThread(customFields ?: emptyMap())
    ChatThreadDTO.from(details).toMap()
  }
  AsyncFunction("threadsLoad") { threadId: String? ->
    CXoneManager.refreshThreads(threadId)
  }
  Function("threadsGetDetails") { threadId: String ->
    val t = CXoneManager.getThreadDetails(threadId)
    ChatThreadDTO.from(t).toMap()
  }
}
