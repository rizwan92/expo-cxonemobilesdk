package expo.modules.cxonemobilesdk.dto

import com.nice.cxonechat.analytics.ActionMetadata
import java.util.UUID

internal object ActionMetadataMapper {
  fun map(metadata: ActionMetadata): ProactiveActionMetadata {
    val actionId = invokeAccessor(metadata, "component1") as? UUID
      ?: invokeAccessor(metadata, "getId") as? UUID
    val name = (invokeAccessor(metadata, "component2") ?: invokeAccessor(metadata, "getName")) as? String
    val type = invokeAccessor(metadata, "component3") ?: invokeAccessor(metadata, "getType")
    return ProactiveActionMetadata(
      actionId = actionId?.toString(),
      name = name,
      type = type?.let { stringifyType(it) },
    )
  }

  private fun invokeAccessor(metadata: ActionMetadata, methodName: String): Any? {
    return runCatching {
      val method = metadata.javaClass.methods.firstOrNull { it.name == methodName }
        ?: metadata.javaClass.declaredMethods.firstOrNull { it.name == methodName }
        ?: metadata.javaClass.methods.firstOrNull { it.name.startsWith(methodName) }
        ?: metadata.javaClass.declaredMethods.firstOrNull { it.name.startsWith(methodName) }
      method?.isAccessible = true
      method?.invoke(metadata)
    }.getOrNull()
  }

  private fun stringifyType(value: Any): String? {
    return when (value) {
      is Enum<*> -> runCatching {
        val method = value.javaClass.methods.firstOrNull { it.name == "getValue" }
        method?.isAccessible = true
        method?.invoke(value) as? String
      }.getOrNull() ?: value.name
      else -> value.toString()
    }
  }
}

data class ProactiveActionMetadata(
  val actionId: String?,
  val name: String?,
  val type: String?,
)
