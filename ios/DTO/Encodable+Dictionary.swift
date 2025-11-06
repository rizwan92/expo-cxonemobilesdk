import Foundation

extension Encodable {
  /// Serialises any `Encodable` DTO into a `[String: Any]` dictionary that can be bridged to JS.
  /// The helper intentionally ignores JSON fragments that aren't dictionaries, falling back to an empty map.
  func asDictionary() throws -> [String: Any] {
    let encoder = JSONEncoder()
    let data = try encoder.encode(self)
    let object = try JSONSerialization.jsonObject(with: data, options: [])
    return object as? [String: Any] ?? [:]
  }
}
