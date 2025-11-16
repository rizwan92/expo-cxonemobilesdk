import React, { useCallback, useMemo, useState } from 'react';
import { View, TextInput, Button, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';

type Props = {
  onSend: (text: string) => Promise<void> | void;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  canSend?: (text: string) => boolean;
  attachmentActions?: { label: string; onPress: () => void }[];
  attachments?: Array<{
    id: string;
    name: string;
    mimeType?: string;
    size?: number | null;
  }>;
  onRemoveAttachment?: (id: string) => void;
};

export default function Composer({
  onSend,
  placeholder = 'Type a message',
  value,
  onChangeText,
  canSend,
  attachmentActions = [],
  attachments = [],
  onRemoveAttachment,
}: Props) {
  const isControlled = typeof value === 'string' && typeof onChangeText === 'function';
  const [inner, setInner] = useState('');
  const text = isControlled ? (value as string) : inner;
  const setText = isControlled ? (onChangeText as (t: string) => void) : setInner;
  const [sending, setSending] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const canSendMessage = useMemo(
    () => (canSend ? canSend(text) : text.trim().length > 0),
    [canSend, text],
  );
  const hasAttachmentActions = attachmentActions.length > 0;
  const hasAttachments = attachments.length > 0;

  const handleSend = useCallback(async () => {
    if (sending) return;
    if (!(canSendMessage || hasAttachments)) return;
    setSending(true);
    try {
      await onSend(text);
      // In controlled mode, parent updates value; do not clear here.
      if (!isControlled) setInner('');
    } finally {
      setSending(false);
    }
  }, [canSendMessage, hasAttachments, isControlled, onSend, sending, text]);

  const toggleAttachmentMenu = useCallback(() => {
    setShowAttachments((prev) => !prev);
  }, []);

  return (
    <View style={styles.container}>
      {hasAttachments && (
        <AttachmentTray attachments={attachments} onRemoveAttachment={onRemoveAttachment} />
      )}
      <View style={styles.composerRow}>
        {hasAttachmentActions ? (
          <View style={styles.leftColumn}>
            <TouchableOpacity
              style={styles.attachmentTrigger}
              onPress={toggleAttachmentMenu}
              disabled={sending}
            >
              <Text style={styles.attachmentTriggerText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            autoCorrect
            autoCapitalize="sentences"
            editable={!sending}
          />
        </View>
        <Button
          title={sending ? 'Sending…' : 'Send'}
          onPress={handleSend}
          disabled={sending || !(canSendMessage || hasAttachments)}
        />
        {showAttachments && hasAttachmentActions && (
          <AttachmentMenu
            actions={attachmentActions}
            onDismiss={() => setShowAttachments(false)}
          />
        )}
      </View>
    </View>
  );
}

type AttachmentTrayProps = {
  attachments: NonNullable<Props['attachments']>;
  onRemoveAttachment?: (id: string) => void;
};

function AttachmentTray({ attachments, onRemoveAttachment }: AttachmentTrayProps) {
  return (
    <ScrollView
      horizontal
      style={styles.attachmentsWrapper}
      contentContainerStyle={styles.attachmentsContent}
      showsHorizontalScrollIndicator={false}
    >
      {attachments.map((attachment) => (
        <View key={attachment.id} style={styles.attachmentChip}>
          <View style={styles.attachmentIcon}>
            <Text style={styles.attachmentIconText}>📎</Text>
          </View>
          <View style={styles.attachmentInfo}>
            <Text style={styles.attachmentName} numberOfLines={1}>
              {attachment.name}
            </Text>
            <Text style={styles.attachmentMeta} numberOfLines={1}>
              {attachment.mimeType ?? 'unknown'}
              {attachment.size ? ` • ${(attachment.size / 1024).toFixed(1)} KB` : ''}
            </Text>
          </View>
          {onRemoveAttachment && (
            <TouchableOpacity onPress={() => onRemoveAttachment(attachment.id)}>
              <Text style={styles.removeAttachment}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

type AttachmentMenuProps = {
  actions: NonNullable<Props['attachmentActions']>;
  onDismiss: () => void;
};

function AttachmentMenu({ actions, onDismiss }: AttachmentMenuProps) {
  return (
    <View style={styles.attachmentMenu}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.attachmentOption}
          onPress={() => {
            onDismiss();
            action.onPress();
          }}
        >
          <Text style={styles.attachmentOptionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    position: 'relative',
    gap: 8,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftColumn: {
    marginRight: 8,
  },
  attachmentTrigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentTriggerText: {
    fontSize: 20,
    color: '#0369a1',
    fontWeight: '600',
  },
  inputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachmentMenu: {
    position: 'absolute',
    left: 8,
    bottom: 56,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    gap: 4,
  },
  attachmentOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  attachmentOptionText: {
    color: '#0369a1',
    fontWeight: '600',
  },
  attachmentsWrapper: {
    maxHeight: 70,
  },
  attachmentsContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 8,
  },
  attachmentIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentIconText: { fontSize: 14 },
  attachmentInfo: { flex: 1, minWidth: 120 },
  attachmentName: { fontWeight: '600', color: '#0f172a', fontSize: 13 },
  attachmentMeta: { color: '#64748b', fontSize: 11 },
  removeAttachment: { color: '#dc2626', fontWeight: '600', paddingHorizontal: 4 },
});
