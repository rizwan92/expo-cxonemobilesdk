package expo.modules.cxonemobilesdk

import android.content.Context
import com.nice.cxonechat.state.Environment

// Thin wrapper to align naming with iOS (JSONBridge)
object JSONBridge {
  fun customEnvironmentFrom(chatUrl: String?, socketUrl: String?) = AndroidJSON.customEnvironmentFrom(chatUrl, socketUrl)
  fun configurationToMap(cfg: com.nice.cxonechat.state.Configuration) = AndroidJSON.configurationToMap(cfg)
  fun parseOutbound(message: Map<String, Any?>, context: Context) = AndroidJSON.parseOutbound(message, context)
  suspend fun fetchChannelConfiguration(context: Context, environment: Environment, brandId: Long, channelId: String) =
    AndroidJSON.fetchChannelConfiguration(context, environment, brandId, channelId)
}
