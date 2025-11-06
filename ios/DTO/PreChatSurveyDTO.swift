import CXoneChatSDK
import Foundation

struct PreChatSurveyDTO: Encodable {
  let name: String
  let fields: [FieldDTO]

  init(_ survey: PreChatSurvey) {
    self.name = survey.name
    self.fields = survey.customFields.compactMap { FieldDTO($0) }
  }

  struct FieldDTO: Encodable {
    let id: String
    let label: String
    let required: Bool
    let type: String
    let isEmail: Bool?
    let value: String?
    let options: [OptionDTO]?
    let nodes: [NodeDTO]?

    init?(_ field: PreChatSurveyCustomField) {
      self.required = field.isRequired

      switch field.type {
      case .textField(let textField):
        self.id = textField.ident
        self.label = textField.label
        self.type = textField.isEmail ? "email" : "text"
        self.isEmail = textField.isEmail
        self.value = textField.value
        self.options = nil
        self.nodes = nil

      case .selector(let selector):
        self.id = selector.ident
        self.label = selector.label
        self.type = "select"
        self.isEmail = nil
        self.value = selector.value
        self.options = selector.options.map { OptionDTO(id: $0.key, label: $0.value) }
        self.nodes = nil

      case .hierarchical(let hierarchical):
        self.id = hierarchical.ident
        self.label = hierarchical.label
        self.type = "hierarchical"
        self.isEmail = nil
        self.value = hierarchical.value
        self.options = nil
        self.nodes = hierarchical.nodes.map(NodeDTO.init)
      }
    }
  }

  struct OptionDTO: Encodable {
    let id: String
    let label: String
  }

  struct NodeDTO: Encodable {
    let value: String
    let label: String
    let children: [NodeDTO]

    init(_ node: CustomFieldHierarchicalNode) {
      self.value = node.value
      self.label = node.label
      self.children = node.children.map(NodeDTO.init)
    }
  }
}

