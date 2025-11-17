import Foundation

extension ExpoCxonemobilesdkModule {
    /// Emits the current chat state/mode snapshot to JS.
    func emitChatSnapshot() {
        let payload = ChatUpdatedEventDTO(
            state: ConnectionBridge.state(), mode: ConnectionBridge.mode())
        self.sendEvent("chatUpdated", dto: payload)
    }

    func emitConnectionError(phase: String, message: String) {
        let payload = ConnectionErrorEventDTO(phase: phase, message: message)
        self.sendEvent("connectionError", dto: payload)
        emitError(message: message)
    }

    func emitError(message: String) {
        self.sendEvent("error", dto: ErrorEventDTO(message: message))
    }

    func logRawEvent(_ name: String, raw: Any) {
#if DEBUG
        NSLog("[ExpoCxonemobilesdk][EventRaw] \(name): \(raw)")
#endif
    }

}
