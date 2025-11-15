package expo.modules.cxonemobilesdk.logging

import com.nice.cxonechat.log.Level
import com.nice.cxonechat.log.Logger

/**
 * Simple logger wrapper that drops messages below [minLevel] before forwarding to [delegate].
 */
internal class FilteredLogger(
  private val delegate: Logger,
  private val minLevel: Level,
) : Logger {

  override fun log(level: Level, message: String, throwable: Throwable?) {
    if (level >= minLevel) {
      delegate.log(level, message, throwable)
    }
  }
}
