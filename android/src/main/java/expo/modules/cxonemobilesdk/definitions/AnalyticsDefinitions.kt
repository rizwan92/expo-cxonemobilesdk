package expo.modules.cxonemobilesdk.definitions

import com.nice.cxonechat.ChatEventHandlerActions.chatWindowOpen
import com.nice.cxonechat.ChatEventHandlerActions.conversion
import com.nice.cxonechat.ChatEventHandlerActions.pageView
import com.nice.cxonechat.ChatEventHandlerActions.pageViewEnded
import expo.modules.cxonemobilesdk.CXoneManager
import expo.modules.cxonemobilesdk.ExpoCxonemobilesdkModule
import expo.modules.kotlin.modules.ModuleDefinitionBuilder

internal fun ModuleDefinitionBuilder.addAnalyticsDefinitions(owner: ExpoCxonemobilesdkModule) {
  AsyncFunction("analyticsViewPage") { title: String, url: String ->
    CXoneManager.withChat { it.events().pageView(title, url) }
  }
  AsyncFunction("analyticsViewPageEnded") { title: String, url: String ->
    CXoneManager.withChat { it.events().pageViewEnded(title, url) }
  }
  AsyncFunction("analyticsChatWindowOpen") {
    CXoneManager.withChat { it.events().chatWindowOpen() }
  }
  AsyncFunction("analyticsConversion") { type: String, value: Double ->
    CXoneManager.withChat { it.events().conversion(type, value) }
  }
}
