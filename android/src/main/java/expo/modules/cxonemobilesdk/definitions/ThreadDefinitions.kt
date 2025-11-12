package expo.modules.cxonemobilesdk.definitions

import android.net.Uri
import com.nice.cxonechat.ChatThreadEventHandlerActions.markThreadRead
import com.nice.cxonechat.ChatThreadEventHandlerActions.typingEnd
import com.nice.cxonechat.ChatThreadEventHandlerActions.typingStart
import com.nice.cxonechat.message.ContentDescriptor
import expo.modules.cxonemobilesdk.CXoneManager
import expo.modules.cxonemobilesdk.ExpoCxonemobilesdkModule
import expo.modules.cxonemobilesdk.JSONBridge
import expo.modules.cxonemobilesdk.dto.ChatThreadDTO
import expo.modules.kotlin.modules.ModuleDefinitionBuilder

internal fun ModuleDefinitionBuilder.addThreadDefinitions(owner: ExpoCxonemobilesdkModule) {
  AsyncFunction("threadsSend") { threadId: String, message: Map<String, Any?> ->
    val ctx = requireNotNull(owner.appContext.reactContext) { "No React context" }
    val (text, postback, attachments) = JSONBridge.parseOutbound(message, ctx)
    CXoneManager.sendMessage(threadId, text, postback, attachments)
  }
  AsyncFunction("threadsLoadMore") { threadId: String ->
    val thread = CXoneManager.loadMore(threadId)
    ChatThreadDTO.from(thread).toMap()
  }
  AsyncFunction("threadsMarkRead") { threadId: String ->
    CXoneManager.withThreadHandler(threadId) { events().markThreadRead() }
  }
  AsyncFunction("threadsUpdateName") { threadId: String, name: String ->
    CXoneManager.withThreadHandler(threadId) { setName(name) }
  }
  AsyncFunction("threadsArchive") { threadId: String ->
    CXoneManager.withThreadHandler(threadId) { archive() }
  }
  AsyncFunction("threadsEndContact") { threadId: String ->
    CXoneManager.withThreadHandler(threadId) { endContact() }
  }
  AsyncFunction("threadsReportTypingStart") { threadId: String, didStart: Boolean ->
    CXoneManager.withThreadHandler(threadId) {
      if (didStart) events().typingStart() else events().typingEnd()
    }
  }
  AsyncFunction("threadsSendAttachmentURL") { threadId: String, url: String, mimeType: String, fileName: String, friendlyName: String ->
    val ctx = requireNotNull(owner.appContext.reactContext) { "No React context" }
    val descriptor = ContentDescriptor(Uri.parse(url), ctx, mimeType, fileName, friendlyName)
    CXoneManager.sendMessage(threadId, "", null, listOf(descriptor))
  }
  AsyncFunction("threadsSendAttachmentBase64") { threadId: String, base64: String, mimeType: String, fileName: String, friendlyName: String ->
    val bytes = try { android.util.Base64.decode(base64, android.util.Base64.DEFAULT) } catch (_: Throwable) {
      throw IllegalArgumentException("Invalid base64 data")
    }
    val descriptor = ContentDescriptor(bytes, mimeType, fileName, friendlyName)
    CXoneManager.sendMessage(threadId, "", null, listOf(descriptor))
  }
}
