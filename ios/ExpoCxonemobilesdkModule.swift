import ExpoModulesCore
import CXoneChatSDK

public class ExpoCxonemobilesdkModule: Module {
    
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module.
    Name("ExpoCxonemobilesdk")

    // Example sync function removed per request.

    Function("disconnect") {
      NSLog("[ExpoCxonemobilesdk] disconnect() called")
      CXoneChat.shared.connection.disconnect()
      NSLog("[ExpoCxonemobilesdk] disconnect() completed")
    }

    AsyncFunction("prepare") { (env: String, brandId: Int, channelId: String) async throws in
      NSLog("[ExpoCxonemobilesdk] prepare(env:\(env), brandId:\(brandId), channelId:\(channelId)) called")
      guard let environment = Environment(rawValue: env.uppercased()) else {
        let err = NSError(
          domain: "ExpoCxonemobilesdk",
          code: -2,
          userInfo: [NSLocalizedDescriptionKey: "Unsupported CXone environment '\(env)'"]
        )
        NSLog("[ExpoCxonemobilesdk] prepare failed: \(err)")
        throw err
      }
      do {
        try await CXoneChat.shared.connection.prepare(environment: environment, brandId: brandId, channelId: channelId)
        NSLog("[ExpoCxonemobilesdk] prepare completed successfully")
      } catch {
        NSLog("[ExpoCxonemobilesdk] prepare error: \(error)")
        throw error
      }
    }

    AsyncFunction("connect") { () async throws in
      NSLog("[ExpoCxonemobilesdk] connect() called")
      do {
        try await CXoneChat.shared.connection.connect()
        NSLog("[ExpoCxonemobilesdk] connect() completed successfully")
      } catch {
        NSLog("[ExpoCxonemobilesdk] connect() error: \(error)")
        throw error
      }
    }


  }
}
