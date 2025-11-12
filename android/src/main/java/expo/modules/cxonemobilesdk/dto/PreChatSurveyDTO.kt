package expo.modules.cxonemobilesdk.dto

import com.nice.cxonechat.prechat.PreChatSurvey
import com.nice.cxonechat.state.FieldDefinition
import com.nice.cxonechat.state.HierarchyNode
import com.nice.cxonechat.state.SelectorNode
import kotlin.sequences.toList

data class PreChatSurveyDTO(
  val name: String,
  val fields: List<FieldDTO>,
) {
  fun toMap() = mapOf(
    "name" to name,
    "fields" to fields.map { it.toMap() },
  )

  companion object {
    fun from(survey: PreChatSurvey): PreChatSurveyDTO {
      val fieldDtos = survey.fields.toList().mapNotNull { FieldDTO.from(it) }
      return PreChatSurveyDTO(name = survey.name, fields = fieldDtos)
    }
  }

  data class FieldDTO(
    val id: String,
    val label: String,
    val required: Boolean,
    val type: String,
    val value: String?,
    val isEmail: Boolean?,
    val options: List<OptionDTO>?,
    val nodes: List<NodeDTO>?,
  ) {
    fun toMap() = mapOf(
      "id" to id,
      "label" to label,
      "required" to required,
      "type" to type,
      "value" to value,
      "isEmail" to isEmail,
      "options" to options?.map { it.toMap() },
      "nodes" to nodes?.map { it.toMap() },
    )

    companion object {
      fun from(field: FieldDefinition): FieldDTO? = when (field) {
        is FieldDefinition.Text -> FieldDTO(
          id = field.fieldId,
          label = field.label,
          required = field.isRequired,
          type = if (field.isEMail) "email" else "text",
          value = null,
          isEmail = field.isEMail,
          options = null,
          nodes = null,
        )
        is FieldDefinition.Selector -> FieldDTO(
          id = field.fieldId,
          label = field.label,
          required = field.isRequired,
          type = "select",
          value = null,
          isEmail = null,
          options = field.values.toList().map { OptionDTO.from(it) },
          nodes = null,
        )
        is FieldDefinition.Hierarchy -> FieldDTO(
          id = field.fieldId,
          label = field.label,
          required = field.isRequired,
          type = "hierarchical",
          value = null,
          isEmail = null,
          options = null,
          nodes = field.values.toList().map { NodeDTO.from(it) },
        )
        else -> null
      }
    }
  }

  data class OptionDTO(val id: String, val label: String) {
    fun toMap() = mapOf("id" to id, "label" to label)

    companion object {
      fun from(node: SelectorNode): OptionDTO = OptionDTO(
        id = node.nodeId ?: "",
        label = node.label ?: "",
      )
    }
  }

  data class NodeDTO(
    val value: String,
    val label: String,
    val children: List<NodeDTO>,
  ) {
    fun toMap(): Map<String, Any?> {
      val childMaps: List<Map<String, Any?>> = children.map { child -> child.toMap() }
      return mapOf(
        "value" to value,
        "label" to label,
        "children" to childMaps,
      )
    }

    companion object {
      fun from(node: HierarchyNode<String>): NodeDTO {
        val childNodes: List<NodeDTO> = node.children
          .map { child -> from(child) }
          .toList()
        return NodeDTO(
          value = node.nodeId ?: "",
          label = node.label ?: "",
          children = childNodes,
        )
      }
    }
  }
}
