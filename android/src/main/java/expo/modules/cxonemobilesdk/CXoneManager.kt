package expo.modules.cxonemobilesdk

import android.content.Context
import android.util.Log
import com.nice.cxonechat.*
import com.nice.cxonechat.ChatState.*
import com.nice.cxonechat.analytics.ActionMetadata
import com.nice.cxonechat.exceptions.RuntimeChatException
import com.nice.cxonechat.message.ContentDescriptor
import com.nice.cxonechat.log.LoggerAndroid
import com.nice.cxonechat.thread.ChatThread
import com.nice.cxonechat.thread.ChatThreadState
import java.lang.ref.WeakReference
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.coroutines.resume
import java.util.*

object CXoneManager : ChatInstanceProvider.Listener {
  private const val TAG = "[ExpoCxonemobilesdk]"

  private var moduleRef: WeakReference<ExpoCxonemobilesdkModule>? = null
  private var appContext: Context? = null

  // Current provider and caches
  private var provider: ChatInstanceProvider? = null
  private var threadsHandlerCancellable: Cancellable? = null
  private var actionHandler: ChatActionHandler? = null

  // Cache of latest known threads
  private val threads: MutableList<ChatThread> = mutableListOf()

  // Pending auth codes
  private var pendingAuthCode: String? = null
  private var pendingVerifier: String? = null

  // Last captured error for quick diagnostics
  @Volatile
  private var lastError: String? = null

  fun initialize(context: Context, cfg: SocketFactoryConfiguration, module: ExpoCxonemobilesdkModule) {
    appContext = context.applicationContext
    moduleRef = WeakReference(module)
    // Replace singleton provider with our configuration
    provider = ChatInstanceProvider.create(
      configuration = cfg,
      authorization = null,
      userName = null,
      developmentMode = true,
      deviceTokenProvider = null,
      logger = LoggerAndroid("CXoneChat"),
      customerId = null,
    )
    provider?.addListener(this)
  }

  fun prepare() {
    val ctx = requireNotNull(appContext) { "Context not set" }
    provider?.prepare(ctx)
  }

  suspend fun prepareAwait() {
    val ctx = requireNotNull(appContext) { "Context not set" }
    val prov = requireNotNull(provider) { "Provider not initialized" }
    // If already prepared or beyond, return immediately
    if (prov.chatState in setOf(ChatState.Prepared, ChatState.Connected, ChatState.Ready, ChatState.Offline)) return
    return kotlinx.coroutines.suspendCancellableCoroutine { cont ->
      var sawPreparing = prov.chatState == ChatState.Preparing
      val listener = object : ChatInstanceProvider.Listener {
        override fun onChatChanged(chat: Chat?) {}
        override fun onChatStateChanged(chatState: ChatState) {
          if (chatState == ChatState.Preparing) {
            sawPreparing = true
          }
          if (chatState in setOf(ChatState.Prepared, ChatState.Connected, ChatState.Ready, ChatState.Offline)) {
            provider?.removeListener(this)
            if (cont.isActive) cont.resume(Unit) {}
          } else if (chatState == ChatState.Initial && sawPreparing) {
            provider?.removeListener(this)
            val msg = "Prepare failed: returned to Initial"
            lastError = msg
            moduleRef?.get()?.sendEvent("connectionError", mapOf("phase" to "prepare", "message" to msg))
            moduleRef?.get()?.sendEvent("error", mapOf("message" to msg))
            if (cont.isActive) cont.resumeWith(Result.failure(IllegalStateException(msg)))
          }
        }
        override fun onChatRuntimeException(exception: RuntimeChatException) {
          // Keep listening; state callback will follow. Do not fail here.
          lastError = exception.message ?: "unknown"
          moduleRef?.get()?.sendEvent("connectionError", mapOf("phase" to "prepare", "message" to lastError!!))
          moduleRef?.get()?.sendEvent("error", mapOf("message" to (exception.message ?: "unknown")))
        }
      }
      provider?.addListener(listener)
      // Kick off prepare only if we're in INITIAL; otherwise just wait for current attempt to finish
      if (prov.chatState == ChatState.Initial) {
        prov.prepare(ctx)
      }
      // Timeout as a safety net
      val timeoutJob = kotlinx.coroutines.GlobalScope.launch(kotlinx.coroutines.Dispatchers.Default) {
        kotlinx.coroutines.delay(7000)
        if (cont.isActive) {
          provider?.removeListener(listener)
          val msg = "Prepare timeout"
          lastError = msg
          moduleRef?.get()?.sendEvent("connectionError", mapOf("phase" to "prepare", "message" to msg))
          moduleRef?.get()?.sendEvent("error", mapOf("message" to msg))
          cont.resumeWith(Result.failure(IllegalStateException(msg)))
        }
      }
      cont.invokeOnCancellation { provider?.removeListener(listener); timeoutJob.cancel() }
    }
  }

  suspend fun connectAwait() {
    val prov = requireNotNull(provider) { "Provider not initialized" }
    // If already connected or ready, no-op
    if (prov.chatState in setOf(ChatState.Connected, ChatState.Ready)) return
    // Only connect from valid states
    when (prov.chatState) {
      ChatState.Prepared, ChatState.Offline -> prov.connect()
      ChatState.Preparing -> { /* wait below */ }
      ChatState.Initial -> {
        val msg = "Connect called before prepare"
        lastError = msg
        throw IllegalStateException(msg)
      }
      else -> { /* ConnectionLost also handled by connect below */ prov.connect() }
    }

    return kotlinx.coroutines.suspendCancellableCoroutine { cont ->
      val listener = object : ChatInstanceProvider.Listener {
        override fun onChatChanged(chat: Chat?) {}
        override fun onChatStateChanged(chatState: ChatState) {
          if (chatState in setOf(ChatState.Connected, ChatState.Ready)) {
            provider?.removeListener(this)
            if (cont.isActive) cont.resume(Unit) {}
          }
        }
        override fun onChatRuntimeException(exception: RuntimeChatException) {
          lastError = exception.message ?: "unknown"
          moduleRef?.get()?.sendEvent("connectionError", mapOf("phase" to "connect", "message" to lastError!!))
          moduleRef?.get()?.sendEvent("error", mapOf("message" to (exception.message ?: "unknown")))
        }
      }
      provider?.addListener(listener)
      val timeoutJob = GlobalScope.launch(Dispatchers.Default) {
        delay(7000)
        if (cont.isActive) {
          provider?.removeListener(listener)
          val msg = "Connect timeout"
          lastError = msg
          moduleRef?.get()?.sendEvent("connectionError", mapOf("phase" to "connect", "message" to msg))
          moduleRef?.get()?.sendEvent("error", mapOf("message" to msg))
          cont.resumeWith(Result.failure(IllegalStateException(msg)))
        }
      }
      cont.invokeOnCancellation { provider?.removeListener(listener); timeoutJob.cancel() }
    }
  }

  fun connect() {
    provider?.connect()
  }

  fun disconnect() {
    try {
      provider?.chat?.close()
    } catch (_: Throwable) {
    }
  }

  fun signOut() {
    try {
      provider?.signOut()
    } catch (_: Throwable) {}
  }

  fun getChatModeString(): String {
    val mode = provider?.chat?.chatMode ?: return "unknown"
    return when (mode) {
      ChatMode.LiveChat -> "liveChat"
      ChatMode.MultiThread -> "multithread"
      ChatMode.SingleThread -> "singlethread"
    }
  }

  fun getChatStateString(): String {
    return when (provider?.chatState) {
      null -> "initial"
      Initial -> "initial"
      Preparing -> "preparing"
      Prepared -> "prepared"
      Offline -> "offline"
      Connecting -> "connecting"
      Connected -> "connected"
      Ready -> "ready"
      ConnectionLost -> "closed"
    }
  }

  fun isConnected(): Boolean {
    return provider?.chatState in setOf(Connected, Ready)
  }

  fun setUserName(firstName: String, lastName: String) {
    provider?.chat?.setUserName(firstName, lastName)
    val ctx = appContext ?: return
    provider?.configure(ctx) {
      userName = UserName(lastName, firstName)
    }
  }

  fun setCustomerIdentity(id: String, firstName: String?, lastName: String?) {
    val ctx = appContext ?: return
    provider?.configure(ctx) {
      customerId = id
      userName = if (firstName != null || lastName != null) UserName(lastName ?: "", firstName ?: "") else userName
    }
  }

  fun clearCustomerIdentity() {
    val ctx = appContext ?: return
    provider?.configure(ctx) { customerId = null }
  }

  fun setDeviceToken(token: String) {
    provider?.chat?.setDeviceToken(token)
    val ctx = appContext ?: return
    provider?.configure(ctx) {
      deviceTokenProvider = ChatInstanceProvider.DeviceTokenProvider { cb -> cb(token) }
    }
  }

  fun setAuthorizationCode(code: String) { pendingAuthCode = code; applyAuthIfPossible() }
  fun setCodeVerifier(verifier: String) { pendingVerifier = verifier; applyAuthIfPossible() }

  private fun applyAuthIfPossible() {
    val ctx = appContext ?: return
    val code = pendingAuthCode
    val verifier = pendingVerifier
    if (!code.isNullOrBlank() && !verifier.isNullOrBlank()) {
      provider?.configure(ctx) {
        authorization = Authorization(code, verifier)
      }
    }
  }

  fun getVisitorId(): String? {
    // Not exposed publicly by SDK; return null for now.
    return null
  }

  fun getThreads(): List<ChatThread> = synchronized(threads) { threads.toList() }

  fun createThread(customFields: Map<String, String>): ChatThread {
    val chat = provider?.chat ?: throw IllegalStateException("Chat not ready")
    val handler = if (customFields.isEmpty()) chat.threads().create() else chat.threads().create(customFields)
    return handler.get()
  }

  fun refreshThreads(threadId: String?) {
    val chat = provider?.chat ?: return
    if (threadId == null) {
      chat.threads().refresh()
    } else {
      val t = findThreadById(threadId) ?: return
      chat.threads().thread(t).refresh()
    }
  }

  fun withThreadHandler(threadId: String, block: ChatThreadHandler.() -> Unit) {
    val chat = provider?.chat ?: throw IllegalStateException("Chat not ready")
    val t = findThreadById(threadId) ?: throw IllegalArgumentException("Thread not found: $threadId")
    val handler = chat.threads().thread(t)
    handler.block()
  }

  fun sendMessage(threadId: String, text: String, postback: String?, attachments: List<ContentDescriptor>) {
    withThreadHandler(threadId) {
      messages().send(attachments, text, postback)
    }
  }

  fun loadMore(threadId: String) {
    withThreadHandler(threadId) { messages().loadMore() }
  }

  fun findThreadById(id: String): ChatThread? = synchronized(threads) {
    threads.firstOrNull { it.id.toString().equals(id, ignoreCase = true) }
  }

  fun withChat(block: (Chat) -> Unit) {
    val chat = provider?.chat ?: throw IllegalStateException("Chat not ready")
    block(chat)
  }

  fun <T> withChatOrNull(block: (Chat?) -> T): T { return block(provider?.chat) }

  // ChatInstanceProvider.Listener
  override fun onChatChanged(chat: Chat?) {
    Log.i(TAG, "onChatChanged: ${chat != null}")
    threadsHandlerCancellable?.cancel()
    actionHandler?.close()
    if (chat != null) {
      // subscribe to thread list updates
      threadsHandlerCancellable = chat.threads().threads { list ->
        synchronized(threads) {
          threads.clear()
          threads.addAll(list)
        }
        // Emit threadsUpdated and per-thread threadUpdated events
        val ids = list.map { it.id.toString() }
        moduleRef?.get()?.sendEvent("threadsUpdated", mapOf("threadIds" to ids))
        list.forEach { t ->
          moduleRef?.get()?.sendEvent("threadUpdated", mapOf("threadId" to t.id.toString()))
          // also derive typing signal if available
          val typing = t.threadAgent?.isTyping == true
          if (typing) {
            moduleRef?.get()?.sendEvent("agentTyping", mapOf(
              "isTyping" to true,
              "threadId" to t.id.toString()
            ))
          }
        }
      }

      // Subscribe to proactive actions
      actionHandler = chat.actions().also { actions ->
        actions.onPopup { variables: Map<String, Any?>, _: ActionMetadata ->
          moduleRef?.get()?.sendEvent("proactivePopupAction", mapOf(
            "actionId" to "unknown",
            "data" to variables
          ))
        }
      }
    }
  }

  override fun onChatStateChanged(chatState: ChatState) {
    moduleRef?.get()?.sendEvent("chatUpdated", mapOf(
      "state" to when (chatState) {
        Initial -> "initial"
        Preparing -> "preparing"
        Prepared -> "prepared"
        Offline -> "offline"
        Connecting -> "connecting"
        Connected -> "connected"
        Ready -> "ready"
        ConnectionLost -> "closed"
      },
      "mode" to getChatModeString(),
    ))

    if (chatState == ConnectionLost) {
      moduleRef?.get()?.sendEvent("unexpectedDisconnect", emptyMap<String, Any>())
    }
  }

  override fun onChatRuntimeException(exception: RuntimeChatException) {
    lastError = exception.message ?: "unknown"
    moduleRef?.get()?.sendEvent("connectionError", mapOf("phase" to "runtime", "message" to lastError!!))
    moduleRef?.get()?.sendEvent("error", mapOf("message" to (exception.message ?: "unknown")))
  }
}
