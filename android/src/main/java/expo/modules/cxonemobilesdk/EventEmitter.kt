package expo.modules.cxonemobilesdk

import android.util.Log
import expo.modules.cxonemobilesdk.BuildConfig
import expo.modules.cxonemobilesdk.dto.ChatUpdatedEventDTO
import expo.modules.cxonemobilesdk.dto.ConnectionErrorEventDTO
import expo.modules.cxonemobilesdk.dto.EmptyEventDTO
import expo.modules.cxonemobilesdk.dto.ErrorEventDTO
import org.json.JSONArray
import org.json.JSONObject

private const val TAG = "[ExpoCxonemobilesdk]"

internal fun ExpoCxonemobilesdkModule.logRawEvent(label: String, raw: Any?) {
  if (BuildConfig.DEBUG) {
    Log.d(TAG, "[EventRaw] $label: ${raw ?: "null"}")
  }
}

internal fun ExpoCxonemobilesdkModule.emitEvent(name: String, payload: Map<String, Any?>) {
  if (BuildConfig.DEBUG) {
    Log.d(TAG, "[Event] $name payload:\n${payload.toPrettyJson()}")
  }
  this.sendEvent(name, payload)
}

internal fun ExpoCxonemobilesdkModule.emitChatSnapshot() {
  emitEvent("chatUpdated", ChatUpdatedEventDTO.snapshot().toMap())
}

internal fun ExpoCxonemobilesdkModule.emitConnectionError(phase: String, message: String) {
  emitEvent("connectionError", ConnectionErrorEventDTO(phase, message).toMap())
  emitError(message)
}

internal fun ExpoCxonemobilesdkModule.emitError(message: String) {
  emitEvent("error", ErrorEventDTO(message).toMap())
}

internal fun ExpoCxonemobilesdkModule.emitEmptyEvent(name: String) {
  emitEvent(name, EmptyEventDTO().toMap())
}

private fun Map<String, Any?>.toPrettyJson(): String = try {
  val json = JSONObject()
  forEach { (key, value) ->
    json.put(key, value.toJsonValue())
  }
  json.toString(2)
} catch (t: Throwable) {
  toString()
}

private fun Any?.toJsonValue(): Any? = when (this) {
  null -> JSONObject.NULL
  is Map<*, *> -> {
    val json = JSONObject()
    for ((key, value) in this) {
      if (key is String) {
        json.put(key, value.toJsonValue())
      }
    }
    json
  }
  is Iterable<*> -> {
    val array = JSONArray()
    for (item in this) {
      array.put(item.toJsonValue())
    }
    array
  }
  is Array<*> -> {
    val array = JSONArray()
    for (item in this) {
      array.put(item.toJsonValue())
    }
    array
  }
  is Boolean, is Number, is String -> this
  else -> toString()
}
