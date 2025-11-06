package expo.modules.cxonemobilesdk

import android.content.Context
import android.net.Uri
import com.nice.cxonechat.Chat
import com.nice.cxonechat.ChatBuilder
import com.nice.cxonechat.SocketFactoryConfiguration
import com.nice.cxonechat.message.Message
import com.nice.cxonechat.state.Configuration
import com.nice.cxonechat.state.Environment
import com.nice.cxonechat.thread.ChatThread

object AndroidJSON {
  fun customEnvironmentFrom(chatUrl: String?, socketUrl: String?): Environment {
    val chat = chatUrl ?: "https://channels.example.com/chat/"
    val base = chat.substringBeforeLast("/chat/") + "/"
    val sock = socketUrl ?: ("wss://" + Uri.parse(base).host?.let { "chat-gateway-$it" })
    val origin = base.replace("channels", "livechat").trimEnd('/')
    return object : Environment {
      override val name: String = "CUSTOM"
      override val location: String = "custom"
      override val baseUrl: String = base
      override val socketUrl: String = sock ?: "wss://socket.example.com"
      override val originHeader: String = origin
      override val chatUrl: String = chat
    }
  }

  fun threadToMap(t: ChatThread): Map<String, Any?> {
    return mapOf(
      "id" to t.id.toString(),
      "name" to t.threadName,
      "state" to t.threadState.name.lowercase(),
      "hasMoreMessagesToLoad" to t.hasMoreMessagesToLoad,
      "positionInQueue" to t.positionInQueue,
      "assignedAgent" to t.threadAgent?.let { a ->
        mapOf(
          "id" to a.id,
          "name" to a.fullName,
          "isTyping" to a.isTyping,
        )
      },
      "messagesCount" to t.messages.size,
      "scrollToken" to t.scrollToken,
      "messages" to t.messages.map { messageToMap(it) },
    )
  }

  private fun messageToMap(m: Message): Map<String, Any?> {
    val base = mutableMapOf<String, Any?>(
      "id" to m.id.toString(),
      "threadId" to m.threadId.toString(),
      "createdAt" to m.createdAt.time,
      "direction" to m.direction.name.lowercase(),
      "fallbackText" to m.fallbackText,
    )
    when (m) {
      is Message.Text -> {
        base["type"] = "text"
        base["payload"] = mapOf("text" to m.text)
      }
      is Message.RichLink -> {
        base["type"] = "richLink"
        base["data"] = mapOf(
          "title" to m.title,
          "url" to m.url,
          "fileName" to m.media.fileName,
          "fileUrl" to m.media.url,
          "mimeType" to m.media.mimeType,
        )
      }
      is Message.QuickReplies -> {
        base["type"] = "quickReplies"
        base["data"] = mapOf(
          "title" to m.title,
          "buttons" to m.actions.map { action ->
            val b = action as? com.nice.cxonechat.message.Action.ReplyButton
            val media = b?.media
            mapOf(
              "text" to (b?.text ?: ""),
              "description" to (b?.description),
              "postback" to (b?.postback),
              "iconName" to media?.fileName,
              "iconUrl" to media?.url,
              "iconMimeType" to media?.mimeType,
            )
          }
        )
      }
      is Message.ListPicker -> {
        base["type"] = "listPicker"
        base["data"] = mapOf(
          "title" to m.title,
          "text" to m.text,
          "buttons" to m.actions.map { action ->
            val b = action as? com.nice.cxonechat.message.Action.ReplyButton
            val media = b?.media
            mapOf(
              "text" to (b?.text ?: ""),
              "description" to b?.description,
              "postback" to b?.postback,
              "iconName" to media?.fileName,
              "iconUrl" to media?.url,
              "iconMimeType" to media?.mimeType,
            )
          }
        )
      }
      else -> base["type"] = "unknown"
    }
    return base
  }

  // Best-effort reflective encoder to expose as much of the SDK Configuration as possible
  private fun reflectToJson(value: Any?, depth: Int = 0, visited: MutableSet<Int> = mutableSetOf()): Any? {
    if (value == null) return null
    if (depth > 8) return null
    // primitives
    when (value) {
      is String, is Number, is Boolean -> return value
    }
    if (value is java.util.UUID) return value.toString()
    if (value is java.util.Date) return value.time
    if (value is Enum<*>) return value.name.lowercase()
    if (value is Map<*, *>) {
      val out = mutableMapOf<String, Any?>()
      value.forEach { (k, v) ->
        if (k is String) out[k] = reflectToJson(v, depth + 1, visited)
      }
      return out
    }
    if (value is Iterable<*>) {
      return value.map { v -> reflectToJson(v, depth + 1, visited) }
    }
    if (value.javaClass.isArray) {
      val arr = java.lang.reflect.Array.getLength(value)
      val list = ArrayList<Any?>(arr)
      for (i in 0 until arr) list.add(reflectToJson(java.lang.reflect.Array.get(value, i), depth + 1, visited))
      return list
    }
    // prevent cycles
    val id = System.identityHashCode(value)
    if (!visited.add(id)) return null
    // reflect object fields (including private)
    val out = mutableMapOf<String, Any?>()
    var c: Class<*>? = value.javaClass
    while (c != null && c != Any::class.java) {
      for (f in c.declaredFields) {
        try {
          f.isAccessible = true
          val name = f.name
          val v = f.get(value)
          out[name] = reflectToJson(v, depth + 1, visited)
        } catch (_: Throwable) {}
      }
      c = c.superclass
    }
    return out
  }

  fun configurationToMap(cfg: Configuration): Map<String, Any?> {
    // Try a deep reflective map first to include all nested details
    val full = reflectToJson(cfg) as? Map<String, Any?>
    if (full != null && full.isNotEmpty()) return full
    // Fallback to curated minimal mapping
    val fr = cfg.fileRestrictions
    return mapOf(
      "hasMultipleThreadsPerEndUser" to cfg.hasMultipleThreadsPerEndUser,
      "isProactiveChatEnabled" to cfg.isProactiveChatEnabled,
      "isAuthorizationEnabled" to cfg.isAuthorizationEnabled,
      "isLiveChat" to cfg.isLiveChat,
      "isOnline" to cfg.isOnline,
      "fileRestrictions" to mapOf(
        "allowedFileSize" to fr.allowedFileSize,
        "isAttachmentsEnabled" to fr.isAttachmentsEnabled,
        "allowedFileTypes" to fr.allowedFileTypes.map { aft ->
          mapOf(
            "mimeType" to aft.mimeType,
            "description" to aft.description,
          )
        }
      )
    )
  }

  fun parseOutbound(message: Map<String, Any?>, context: Context): Triple<String, String?, List<com.nice.cxonechat.message.ContentDescriptor>> {
    val text = (message["text"] as? String) ?: ""
    val postback = message["postback"] as? String
    val attachments = (message["attachments"] as? List<*>)?.mapNotNull { it as? Map<*, *> } ?: emptyList()
    val desc = attachments.mapNotNull { a ->
      val mime = a["mimeType"] as? String ?: return@mapNotNull null
      val fileName = a["fileName"] as? String ?: return@mapNotNull null
      val friendly = a["friendlyName"] as? String
      val url = a["url"] as? String
      val data = a["data"] as? String
      when {
        url != null -> com.nice.cxonechat.message.ContentDescriptor(Uri.parse(url), context, mime, fileName, friendly)
        data != null -> {
          val bytes = try { android.util.Base64.decode(data, android.util.Base64.DEFAULT) } catch (_: Throwable) { ByteArray(0) }
          com.nice.cxonechat.message.ContentDescriptor(bytes, mime, fileName, friendly)
        }
        else -> null
      }
    }
    return Triple(text, postback, desc)
  }

  suspend fun fetchChannelConfiguration(
    context: Context,
    environment: Environment,
    brandId: Long,
    channelId: String
  ): Map<String, Any?> {
    // Build a transient chat to fetch configuration
    var result: Map<String, Any?> = emptyMap()
    val latch = java.util.concurrent.CountDownLatch(1)
    val cfg = SocketFactoryConfiguration(environment, brandId, channelId)
    ChatBuilder(context.applicationContext, cfg).build { res ->
      res.onSuccess { chat: Chat ->
        result = configurationToMap(chat.configuration)
        chat.close()
      }.onFailure {
        result = emptyMap()
      }
      latch.countDown()
    }
    // Await briefly for completion (best-effort)
    latch.await(5, java.util.concurrent.TimeUnit.SECONDS)
    return result
  }
}
