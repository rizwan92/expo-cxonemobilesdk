package expo.modules.cxonemobilesdk

import android.content.Context
import android.net.Uri
 
import com.nice.cxonechat.Chat
import com.nice.cxonechat.ChatBuilder
import com.nice.cxonechat.SocketFactoryConfiguration
import com.nice.cxonechat.state.Configuration
import com.nice.cxonechat.state.Configuration.Feature
import com.nice.cxonechat.state.Environment

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

  fun configurationToMap(cfg: Configuration): Map<String, Any?> {
    val fr = cfg.fileRestrictions
    val curatedFR = mapOf(
      "allowedFileSize" to fr.allowedFileSize,
      "isAttachmentsEnabled" to fr.isAttachmentsEnabled,
      "allowedFileTypes" to fr.allowedFileTypes.map { aft ->
        mapOf(
          "mimeType" to aft.mimeType,
          "description" to aft.description,
        )
      }
    )
    val featureMap = runCatching<Map<String, Boolean>> {
      Feature.values().associate { feature ->
        val key = runCatching {
          val method = feature.javaClass.getDeclaredMethod("getKey\$chat_sdk_core_release")
          method.isAccessible = true
          method.invoke(feature) as? String
        }.getOrNull() ?: feature.name.lowercase()
        key to cfg.hasFeature(feature)
      }
    }.getOrElse { emptyMap() }
    return mapOf(
      "hasMultipleThreadsPerEndUser" to cfg.hasMultipleThreadsPerEndUser,
      "isProactiveChatEnabled" to cfg.isProactiveChatEnabled,
      "isAuthorizationEnabled" to cfg.isAuthorizationEnabled,
      "isLiveChat" to cfg.isLiveChat,
      "isOnline" to cfg.isOnline,
      "features" to featureMap,
      "fileRestrictions" to curatedFR,
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
        // Diagnostics removed

        // Return the merged/friendly map to JS
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
