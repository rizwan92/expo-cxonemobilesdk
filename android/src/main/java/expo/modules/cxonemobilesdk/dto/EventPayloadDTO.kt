package expo.modules.cxonemobilesdk.dto

import expo.modules.cxonemobilesdk.CXoneManager

data class ChatUpdatedEventDTO(val state: String, val mode: String) {
  fun toMap() = mapOf("state" to state, "mode" to mode)

  companion object {
    fun snapshot(): ChatUpdatedEventDTO {
      return ChatUpdatedEventDTO(CXoneManager.getChatStateString(), CXoneManager.getChatModeString())
    }
  }
}

data class ThreadsUpdatedEventDTO(val threads: List<ChatThreadDTO>) {
  fun toMap() = mapOf("threads" to threads.map { it.toMap() })

  companion object {
    fun from(chatThreads: List<com.nice.cxonechat.thread.ChatThread>) =
      ThreadsUpdatedEventDTO(chatThreads.map { ChatThreadDTO.from(it) })
  }
}

data class ThreadUpdatedEventDTO(val thread: ChatThreadDTO) {
  fun toMap() = mapOf("thread" to thread.toMap())

  companion object {
    fun from(thread: com.nice.cxonechat.thread.ChatThread) = ThreadUpdatedEventDTO(ChatThreadDTO.from(thread))
  }
}

data class AgentTypingEventDTO(val isTyping: Boolean, val threadId: String, val agent: AgentDTO?) {
  fun toMap() = mapOf(
    "isTyping" to isTyping,
    "threadId" to threadId,
    "agent" to agent?.toMap(),
  )
}

data class CustomEventMessageDTO(val base64: String) {
  fun toMap() = mapOf("base64" to base64)
}

data class AuthorizationChangedEventDTO(val status: String, val code: Boolean = false, val verifier: Boolean = false) {
  fun toMap() = mapOf(
    "status" to status,
    "code" to code,
    "verifier" to verifier,
  )
}

data class ConnectionErrorEventDTO(val phase: String, val message: String) {
  fun toMap() = mapOf("phase" to phase, "message" to message)
}

data class ErrorEventDTO(val message: String) {
  fun toMap() = mapOf("message" to message)
}

data class ProactiveActionDTO(
  val actionId: String?,
  val name: String?,
  val type: String?,
  val variables: Map<String, Any?>,
  val eventId: String? = null,
) {
  fun toMap() = mapOf(
    "actionId" to actionId,
    "eventId" to eventId,
    "name" to name,
    "type" to type,
    "variables" to variables,
    "content" to null, // parity with iOS payload shape (not available on Android)
  )
}

data class ProactiveActionEventDTO(val action: ProactiveActionDTO) {
  fun toMap() = mapOf(
    "actionId" to action.actionId,
    "action" to action.toMap(),
  )
}

data class EmptyEventDTO(val placeholder: Boolean = true) {
  fun toMap() = emptyMap<String, Any?>()
}
