package expo.modules.cxonemobilesdk

import com.nice.cxonechat.thread.ChatThread
import java.lang.reflect.Field

object ThreadIntrospection {
  fun contactIdOf(thread: ChatThread): String? {
    return runCatching {
      var current: Class<*>? = thread.javaClass
      while (current != null) {
        try {
          val field: Field = current.getDeclaredField("contactId")
          field.isAccessible = true
          return field.get(thread) as? String
        } catch (_: NoSuchFieldException) {
          current = current.superclass
        }
      }
      null
    }.getOrNull()
  }
}
