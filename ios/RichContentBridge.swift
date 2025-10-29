import CXoneChatSDK
import Foundation

enum RichContentBridge {
    static func sendAttachmentURL(threadId: UUID, url: URL, mimeType: String, fileName: String, friendlyName: String)
        async throws
    {
        let desc = ContentDescriptor(url: url, mimeType: mimeType, fileName: fileName, friendlyName: friendlyName)
        let msg = OutboundMessage(text: "", attachments: [desc], postback: nil)
        try await ThreadBridge.provider(for: threadId).send(msg)
    }

    static func sendAttachmentBase64(
        threadId: UUID, base64: String, mimeType: String, fileName: String, friendlyName: String
    ) async throws {
        guard let data = Data(base64Encoded: base64) else {
            throw NSError(
                domain: "ExpoCxonemobilesdk", code: -11, userInfo: [NSLocalizedDescriptionKey: "Invalid base64 data"])
        }
        let desc = ContentDescriptor(data: data, mimeType: mimeType, fileName: fileName, friendlyName: friendlyName)
        let msg = OutboundMessage(text: "", attachments: [desc], postback: nil)
        try await ThreadBridge.provider(for: threadId).send(msg)
    }
}
