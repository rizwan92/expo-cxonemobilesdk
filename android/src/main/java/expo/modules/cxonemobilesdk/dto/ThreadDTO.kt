package expo.modules.cxonemobilesdk.dto

import com.nice.cxonechat.message.Action
import com.nice.cxonechat.message.Attachment
import com.nice.cxonechat.message.Media
import com.nice.cxonechat.message.Message
import com.nice.cxonechat.message.MessageAuthor
import com.nice.cxonechat.message.MessageMetadata
import com.nice.cxonechat.message.MessageDirection
import com.nice.cxonechat.thread.Agent
import com.nice.cxonechat.thread.ChatThread
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private val isoFormatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US).apply {
  timeZone = TimeZone.getTimeZone("UTC")
}

private fun Date?.toIsoString(): String? = this?.let {
  synchronized(isoFormatter) { isoFormatter.format(it) }
}

data class AgentDTO(
  val id: Int,
  val firstName: String,
  val surname: String,
  val nickname: String?,
  val fullName: String,
  val imageUrl: String,
) {
  fun toMap() = mapOf(
    "id" to id,
    "firstName" to firstName,
    "surname" to surname,
    "nickname" to nickname,
    "fullName" to fullName,
    "imageUrl" to imageUrl,
  )

  companion object {
    fun from(agent: Agent) = AgentDTO(
      id = agent.id,
      firstName = agent.firstName,
      surname = agent.lastName,
      nickname = agent.nickname,
      fullName = agent.fullName,
      imageUrl = agent.imageUrl,
    )
  }
}

data class SenderInfoDTO(
  val id: String,
  val firstName: String?,
  val lastName: String?,
  val fullName: String?,
) {
  fun toMap() = mapOf(
    "id" to id,
    "firstName" to firstName,
    "lastName" to lastName,
    "fullName" to fullName,
  )

  companion object {
    fun from(author: MessageAuthor) = SenderInfoDTO(
      id = author.id ?: "",
      firstName = author.firstName,
      lastName = author.lastName,
      fullName = author.name,
    )
  }
}

data class CustomerIdentityDTO(
  val id: String,
  val firstName: String?,
  val lastName: String?,
) {
  fun toMap() = mapOf(
    "id" to id,
    "firstName" to firstName,
    "lastName" to lastName,
  )
}

data class AttachmentDTO(
  val url: String?,
  val friendlyName: String?,
  val mimeType: String?,
  val fileName: String?,
) {
  fun toMap() = mapOf(
    "url" to url,
    "friendlyName" to friendlyName,
    "mimeType" to mimeType,
    "fileName" to fileName,
  )

  companion object {
    fun from(attachment: Attachment): AttachmentDTO {
      val url = attachment.url
      val friendly = attachment.friendlyName
      return AttachmentDTO(
        url = url,
        friendlyName = friendly,
        mimeType = attachment.mimeType,
        fileName = when {
          !friendly.isNullOrBlank() -> friendly
          url != null -> url.substringAfterLast('/').ifBlank { null }
          else -> null
        },
      )
    }
  }
}

data class MessageReplyButtonDTO(
  val text: String,
  val description: String?,
  val postback: String?,
  val iconName: String?,
  val iconUrl: String?,
  val iconMimeType: String?,
) {
  fun toMap() = mapOf(
    "text" to text,
    "description" to description,
    "postback" to postback,
    "iconName" to iconName,
    "iconUrl" to iconUrl,
    "iconMimeType" to iconMimeType,
  )

  companion object {
    fun from(action: Action.ReplyButton): MessageReplyButtonDTO {
      val media: Media? = action.media
      return MessageReplyButtonDTO(
        text = action.text ?: "",
        description = action.description,
        postback = action.postback,
        iconName = media?.fileName,
        iconUrl = media?.url,
        iconMimeType = media?.mimeType,
      )
    }
  }
}

data class MessageUserStatisticsDTO(
  val seenAt: String?,
  val readAt: String?,
) {
  fun toMap() = mapOf(
    "seenAt" to seenAt,
    "readAt" to readAt,
  )

  companion object {
    fun from(metadata: MessageMetadata): MessageUserStatisticsDTO? {
      val seen = metadata.seenAt ?: metadata.seenByCustomerAt
      val read = metadata.readAt
      if (seen == null && read == null) return null
      return MessageUserStatisticsDTO(
        seenAt = seen.toIsoString(),
        readAt = read.toIsoString(),
      )
    }
  }
}

data class MessageDTO(
  val id: String,
  val threadId: String,
  val createdAt: String,
  val direction: String,
  val status: String,
  val authorUser: AgentDTO?,
  val authorEndUserIdentity: CustomerIdentityDTO?,
  val senderInfo: SenderInfoDTO?,
  val userStatistics: MessageUserStatisticsDTO?,
  val attachments: List<AttachmentDTO>,
  val contentType: Map<String, Any?>,
  val fallbackText: String?,
) {
  fun toMap() = mapOf(
    "id" to id,
    "threadId" to threadId,
    "createdAt" to createdAt,
    "direction" to direction,
    "status" to status,
    "authorUser" to authorUser?.toMap(),
    "authorEndUserIdentity" to authorEndUserIdentity?.toMap(),
    "senderInfo" to senderInfo?.toMap(),
    "userStatistics" to userStatistics?.toMap(),
    "attachments" to attachments.map { it.toMap() },
    "contentType" to contentType,
    "fallbackText" to fallbackText,
  )

  companion object {
    fun from(message: Message): MessageDTO {
      val metadata = message.metadata
      val author = message.author
      return MessageDTO(
        id = message.id.toString(),
        threadId = message.threadId.toString(),
        createdAt = message.createdAt.toIsoString() ?: "",
        direction = message.direction.toBridgeString(),
        status = metadata?.status?.name?.lowercase(Locale.US) ?: "unknown",
        authorUser = null, // SDK does not expose typed agent authors separately on Android.
        authorEndUserIdentity = null,
        senderInfo = author?.let { SenderInfoDTO.from(it) },
        userStatistics = metadata?.let { MessageUserStatisticsDTO.from(it) },
        attachments = message.attachments.map { AttachmentDTO.from(it) },
        contentType = MessageContentMapper.map(message),
        fallbackText = message.fallbackText,
      )
    }
  }
}

private object MessageContentMapper {
  fun map(message: Message): Map<String, Any?> = when (message) {
    is Message.Text -> mapOf(
      "type" to "text",
      "payload" to mapOf(
        "text" to message.text,
        "postback" to null,
      ),
    )
    is Message.RichLink -> {
      val media = message.media
      mapOf(
        "type" to "richLink",
        "data" to mapOf(
          "title" to message.title,
          "url" to message.url,
          "fileName" to media?.fileName,
          "fileUrl" to media?.url,
          "mimeType" to media?.mimeType,
        ),
      )
    }
    is Message.QuickReplies -> mapOf(
      "type" to "quickReplies",
      "data" to mapOf(
        "title" to message.title,
        "buttons" to message.actions.mapNotNull { action ->
          (action as? Action.ReplyButton)?.let { MessageReplyButtonDTO.from(it).toMap() }
        },
      ),
    )
    is Message.ListPicker -> mapOf(
      "type" to "listPicker",
      "data" to mapOf(
        "title" to message.title,
        "text" to message.text,
        "buttons" to message.actions.mapNotNull { action ->
          (action as? Action.ReplyButton)?.let { MessageReplyButtonDTO.from(it).toMap() }
        },
      ),
    )
    else -> mapOf(
      "type" to "unknown",
      "data" to mapOf("fallbackText" to message.fallbackText)
    )
  }
}

private fun MessageDirection.toBridgeString(): String = when (this) {
  MessageDirection.ToAgent -> "toAgent"
  MessageDirection.ToClient -> "toClient"
}

data class ChatThreadDTO(
  val id: String,
  val name: String?,
  val state: String,
  val hasMoreMessagesToLoad: Boolean,
  val positionInQueue: Int?,
  val assignedAgent: AgentDTO?,
  val lastAssignedAgent: AgentDTO?,
  val messagesCount: Int,
  val scrollToken: String?,
  val customFields: Map<String, String>,
  val messages: List<MessageDTO>,
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "id" to id,
    "name" to name,
    "state" to state,
    "hasMoreMessagesToLoad" to hasMoreMessagesToLoad,
    "positionInQueue" to positionInQueue,
    "assignedAgent" to assignedAgent?.toMap(),
    "lastAssignedAgent" to lastAssignedAgent?.toMap(),
    "messagesCount" to messagesCount,
    "scrollToken" to scrollToken,
    "customFields" to customFields,
    "messages" to messages.map { it.toMap() },
  )

  companion object {
    fun from(thread: ChatThread, hasMoreOverride: Boolean? = null): ChatThreadDTO {
      val sortedMessages = thread.messages.sortedByDescending { it.createdAt }
      val seen = linkedSetOf<String>()
      val uniqueMessages = sortedMessages.mapNotNull { message ->
        val id = message.id.toString()
        if (seen.add(id)) MessageDTO.from(message) else null
      }
      val hasMore = hasMoreOverride ?: thread.hasMoreMessagesToLoad
      return ChatThreadDTO(
        id = thread.id.toString(),
        name = thread.threadName,
        state = thread.threadState.name.lowercase(Locale.US),
        hasMoreMessagesToLoad = hasMore,
        positionInQueue = thread.positionInQueue,
        assignedAgent = thread.threadAgent?.let { AgentDTO.from(it) },
        lastAssignedAgent = null,
        messagesCount = uniqueMessages.size,
        scrollToken = if (hasMore) thread.scrollToken.takeIf { it.isNotBlank() } else null,
        customFields = thread.fields.associate { it.id to it.value },
        messages = uniqueMessages,
      )
    }
  }
}
