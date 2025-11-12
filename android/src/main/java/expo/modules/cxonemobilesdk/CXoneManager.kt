package expo.modules.cxonemobilesdk

import android.content.Context
import android.util.Log
import com.nice.cxonechat.*
import com.nice.cxonechat.ChatState.*
import com.nice.cxonechat.ChatThreadHandler
import com.nice.cxonechat.analytics.ActionMetadata
import com.nice.cxonechat.exceptions.RuntimeChatException
import com.nice.cxonechat.log.LoggerAndroid
import com.nice.cxonechat.message.ContentDescriptor
import com.nice.cxonechat.thread.ChatThread
import expo.modules.cxonemobilesdk.dto.ActionMetadataMapper
import expo.modules.cxonemobilesdk.dto.AgentDTO
import expo.modules.cxonemobilesdk.dto.AgentTypingEventDTO
import expo.modules.cxonemobilesdk.dto.ChatThreadDTO
import expo.modules.cxonemobilesdk.dto.ProactiveActionDTO
import expo.modules.cxonemobilesdk.dto.ProactiveActionEventDTO
import expo.modules.cxonemobilesdk.dto.ThreadUpdatedEventDTO
import expo.modules.cxonemobilesdk.dto.ThreadsUpdatedEventDTO
import java.lang.ref.WeakReference
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.coroutines.resume

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
  // Cache last identity we set (SDK has no public getter)
  private var lastCustomerId: String? = null
  private var lastFirstName: String? = null
  private var lastLastName: String? = null

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
            moduleRef?.get()?.emitConnectionError("prepare", msg)
            if (cont.isActive) cont.resumeWith(Result.failure(IllegalStateException(msg)))
          }
        }
        override fun onChatRuntimeException(exception: RuntimeChatException) {
          // Keep listening; state callback will follow. Do not fail here.
          lastError = exception.message ?: "unknown"
          moduleRef?.get()?.emitConnectionError("prepare", lastError!!)
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
          moduleRef?.get()?.emitConnectionError("prepare", msg)
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
        moduleRef?.get()?.emitConnectionError("connect", msg)
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
          moduleRef?.get()?.emitConnectionError("connect", lastError!!)
        }
      }
      provider?.addListener(listener)
      val timeoutJob = GlobalScope.launch(Dispatchers.Default) {
        delay(7000)
        if (cont.isActive) {
          provider?.removeListener(listener)
          val msg = "Connect timeout"
          lastError = msg
          moduleRef?.get()?.emitConnectionError("connect", msg)
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
    lastCustomerId = id
    lastFirstName = firstName
    lastLastName = lastName
  }

  fun clearCustomerIdentity() {
    val ctx = appContext ?: return
    provider?.configure(ctx) { customerId = null }
    lastCustomerId = null
    lastFirstName = null
    lastLastName = null
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
    // Try SDK analytics visitorId via reflection (not part of public API in 3.0.0)
    try {
      val chat = provider?.chat
      if (chat != null) {
        val analyticsMethod = chat.javaClass.methods.firstOrNull { it.name == "analytics" }
        val analytics = analyticsMethod?.invoke(chat)
        if (analytics != null) {
          val getVisitorId = analytics.javaClass.methods.firstOrNull { it.name == "getVisitorId" || it.name == "visitorId" }
          val value = getVisitorId?.invoke(analytics)
          val id = when (value) {
            is java.util.UUID -> value.toString()
            else -> value?.toString()
          }
          if (!id.isNullOrBlank()) return id
        }
      }
    } catch (_: Throwable) {
      // ignore and fallback
    }

    // Fallback: persistent app-scoped UUID to mirror iOS analytics.visitorId semantics
    val ctx = appContext ?: return null
    val prefs = ctx.getSharedPreferences("expo_cxone_prefs", Context.MODE_PRIVATE)
    var id = prefs.getString("visitor_id", null)
    if (id.isNullOrBlank()) {
      id = java.util.UUID.randomUUID().toString()
      prefs.edit().putString("visitor_id", id).apply()
    }
    return id
  }

  fun getThreads(): List<ChatThread> = synchronized(threads) { threads.toList() }

  fun getCustomerIdentity(): Map<String, Any>? {
    val id = lastCustomerId ?: return null
    val map = mutableMapOf<String, Any>("id" to id)
    lastFirstName?.let { map["firstName"] = it }
    lastLastName?.let { map["lastName"] = it }
    return map
  }

  // No direct getter for identity available

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

  fun <T> withThreadHandler(threadId: String, block: ChatThreadHandler.() -> T): T {
    val chat = provider?.chat ?: throw IllegalStateException("Chat not ready")
    val t = findThreadById(threadId) ?: throw IllegalArgumentException("Thread not found: $threadId")
    val handler = chat.threads().thread(t)
    return handler.block()
  }

  fun sendMessage(threadId: String, text: String, postback: String?, attachments: List<ContentDescriptor>) {
    withThreadHandler(threadId) {
      messages().send(attachments, text, postback)
    }
  }

  fun loadMore(threadId: String): ChatThread {
    withThreadHandler(threadId) { messages().loadMore() }
    return findThreadById(threadId) ?: throw IllegalStateException("Thread not found after load: $threadId")
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
        val module = moduleRef?.get() ?: return@threads
        module.logRawEvent("threadsUpdated(raw)", list)
        module.emitEvent("threadsUpdated", ThreadsUpdatedEventDTO.from(list).toMap())
        list.forEach { thread ->
          module.logRawEvent("threadUpdated(raw)", thread)
          module.emitEvent("threadUpdated", ThreadUpdatedEventDTO.from(thread).toMap())
          val agent = thread.threadAgent
          if (agent != null) {
            module.emitEvent(
              "agentTyping",
              AgentTypingEventDTO(
                isTyping = agent.isTyping,
                threadId = thread.id.toString(),
                agent = AgentDTO.from(agent),
              ).toMap()
            )
          }
        }
      }

      // Subscribe to proactive actions
      actionHandler = chat.actions().also { actions ->
        actions.onPopup { variables: Map<String, Any?>, metadata: ActionMetadata ->
          val module = moduleRef?.get() ?: return@onPopup
          module.logRawEvent("proactivePopupAction(raw)", mapOf("variables" to variables, "metadata" to metadata))
          val meta = ActionMetadataMapper.map(metadata)
          val dto = ProactiveActionEventDTO(
            ProactiveActionDTO(
              actionId = meta.actionId,
              name = meta.name,
              type = meta.type,
              variables = variables,
            )
          )
          module.emitEvent("proactivePopupAction", dto.toMap())
        }
      }
    }
  }

  override fun onChatStateChanged(chatState: ChatState) {
    val module = moduleRef?.get() ?: return
    val stateString = when (chatState) {
      Initial -> "initial"
      Preparing -> "preparing"
      Prepared -> "prepared"
      Offline -> "offline"
      Connecting -> "connecting"
      Connected -> "connected"
      Ready -> "ready"
      ConnectionLost -> "closed"
    }
    module.logRawEvent("chatUpdated(raw)", "state=$chatState mode=${getChatModeString()}")
    module.emitEvent("chatUpdated", mapOf("state" to stateString, "mode" to getChatModeString()))

    if (chatState == ConnectionLost) {
      module.emitEmptyEvent("unexpectedDisconnect")
    }
  }

  override fun onChatRuntimeException(exception: RuntimeChatException) {
    lastError = exception.message ?: "unknown"
    moduleRef?.get()?.emitConnectionError("runtime", lastError!!)
  }
}
