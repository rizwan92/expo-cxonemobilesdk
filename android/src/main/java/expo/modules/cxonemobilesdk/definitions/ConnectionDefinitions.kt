package expo.modules.cxonemobilesdk.definitions

import android.util.Log
import com.nice.cxonechat.ChatEventHandlerActions.event
import com.nice.cxonechat.SocketFactoryConfiguration
import com.nice.cxonechat.enums.CXoneEnvironment
import expo.modules.cxonemobilesdk.CXoneManager
import expo.modules.cxonemobilesdk.ExpoCxonemobilesdkModule
import expo.modules.cxonemobilesdk.JSONBridge
import expo.modules.cxonemobilesdk.emitChatSnapshot
import expo.modules.cxonemobilesdk.emitConnectionError
import expo.modules.kotlin.modules.ModuleDefinitionBuilder
import expo.modules.kotlin.functions.Coroutine
import java.util.Locale
import java.util.UUID

internal fun ModuleDefinitionBuilder.addConnectionDefinitions(owner: ExpoCxonemobilesdkModule) {
  val tag = "[ExpoCxonemobilesdk]"

  // Disconnect
  Function("disconnect") {
    Log.i(tag, "Connection.disconnect")
    CXoneManager.disconnect()
  }

  AsyncFunction("prepare") Coroutine { env: String, brandId: Int, channelId: String ->
    Log.i(tag, "Connection.prepare env=$env brandId=$brandId channelId=$channelId")
    val environment = runCatching { CXoneEnvironment.valueOf(env.uppercase(Locale.ROOT)).value }
      .getOrElse { throw IllegalArgumentException("Unsupported CXone environment '$env'") }
    val cfg = SocketFactoryConfiguration(environment, brandId.toLong(), channelId)
    val ctx = requireNotNull(owner.appContext.reactContext) { "No React context" }
    CXoneManager.initialize(ctx.applicationContext, cfg, owner)
    runCatching { JSONBridge.fetchChannelConfiguration(ctx, environment, brandId.toLong(), channelId) }
      .onFailure { owner.emitConnectionError("preflight", it.message ?: "Failed to fetch channel configuration") }
    CXoneManager.prepareAwait()
    owner.emitChatSnapshot()
  }

  AsyncFunction("prepareWithURLs") Coroutine { chatURL: String, socketURL: String, brandId: Int, channelId: String ->
    Log.i(tag, "Connection.prepareWithURLs chatURL=$chatURL socketURL=$socketURL brandId=$brandId channelId=$channelId")
    val env = JSONBridge.customEnvironmentFrom(chatURL, socketURL)
    val cfg = SocketFactoryConfiguration(env, brandId.toLong(), channelId)
    val ctx = requireNotNull(owner.appContext.reactContext) { "No React context" }
    CXoneManager.initialize(ctx.applicationContext, cfg, owner)
    CXoneManager.prepareAwait()
    owner.emitChatSnapshot()
  }

  AsyncFunction("connect") Coroutine {
    Log.i(tag, "Connection.connect")
    CXoneManager.connectAwait()
    owner.emitChatSnapshot()
  }

  Function("getChatMode") { CXoneManager.getChatModeString() }
  Function("getChatState") { CXoneManager.getChatStateString() }
  Function("isConnected") { CXoneManager.isConnected() }
  Function("configureLogger") { level: String?, verbosity: String? ->
    CXoneManager.configureLogger(level, verbosity)
  }

  AsyncFunction("executeTrigger") { triggerId: String ->
    val id = try { UUID.fromString(triggerId) } catch (_: Throwable) {
      throw IllegalArgumentException("Invalid UUID: $triggerId")
    }
    CXoneManager.withChat { chat -> chat.events().event(id) }
  }

  AsyncFunction("getChannelConfiguration") Coroutine { env: String, brandId: Int, channelId: String ->
    val environment = runCatching { CXoneEnvironment.valueOf(env.uppercase(Locale.ROOT)).value }
      .getOrElse { throw IllegalArgumentException("Unsupported CXone environment '$env'") }
    val ctx = requireNotNull(owner.appContext.reactContext) { "No React context" }
    JSONBridge.fetchChannelConfiguration(ctx, environment, brandId.toLong(), channelId)
  }

  AsyncFunction("getChannelConfigurationByURL") Coroutine { chatURL: String, brandId: Int, channelId: String ->
    val environment = JSONBridge.customEnvironmentFrom(chatURL, null)
    val ctx = requireNotNull(owner.appContext.reactContext) { "No React context" }
    JSONBridge.fetchChannelConfiguration(ctx, environment, brandId.toLong(), channelId)
  }

}
