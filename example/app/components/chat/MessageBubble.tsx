import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import Timestamp from './Timestamp';
import StatusTicks from './StatusTicks';
import DirectionIcon from './DirectionIcon';
import type { Attachment } from 'expo-cxonemobilesdk';

type Props = {
  text: string;
  isMe: boolean;
  createdAtMs?: number;
  status?: 'sent' | 'delivered' | 'seen' | 'failed';
  authorName?: string | null;
  direction?: 'toAgent' | 'toClient';
  attachments?: Attachment[];
};

export default function MessageBubble({
  text,
  isMe,
  createdAtMs,
  status,
  authorName,
  direction,
  attachments,
}: Props) {
  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
      <View style={{ maxWidth: '85%' }}>
        {!isMe && !!authorName && <Text style={styles.author}>{authorName}</Text>}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>{text}</Text>
          {attachments?.map((attachment) => (
            <AttachmentPreview key={attachment.url || attachment.friendlyName} attachment={attachment} />
          ))}
        </View>
        <View style={[styles.metaRow, isMe ? styles.metaMe : styles.metaThem]}>
          {!!direction && <DirectionIcon direction={direction} />}
          <Timestamp ms={createdAtMs} style={styles.metaText} variant="full" />
          {isMe && <StatusTicks status={status} />}
        </View>
      </View>
    </View>
  );
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (!attachment.url) return null;
  const isImage = attachment.mimeType?.startsWith('image/');
  const isVideo = attachment.mimeType?.startsWith('video/');
  const label = attachment.friendlyName ?? attachment.fileName ?? 'Attachment';
  const handleOpen = () => {
    if (attachment.url) Linking.openURL(attachment.url).catch(() => {});
  };

  if (isImage) {
    return (
      <TouchableOpacity style={styles.attachmentImageWrapper} onPress={handleOpen}>
        <Image source={{ uri: attachment.url }} style={styles.attachmentImage} />
        <Text style={styles.attachmentCaption}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.attachmentChip} onPress={handleOpen}>
      <Text style={styles.attachmentChipText}>
        {isVideo ? '▶︎ ' : '📄 '}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 8 },
  rowMe: { justifyContent: 'flex-end' },
  rowThem: { justifyContent: 'flex-start' },
  bubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, maxWidth: '75%' },
  bubbleMe: { backgroundColor: '#2563eb' },
  bubbleThem: { backgroundColor: '#e5e7eb' },
  text: { fontSize: 15 },
  textMe: { color: 'white' },
  textThem: { color: '#111827' },
  author: { fontSize: 11, color: '#6b7280', marginLeft: 8, marginBottom: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 6 },
  metaMe: { justifyContent: 'flex-end' },
  metaThem: { justifyContent: 'flex-start' },
  metaText: { fontSize: 11, color: '#6b7280', marginRight: 6 },
  attachmentImageWrapper: { marginTop: 8 },
  attachmentImage: { width: 220, height: 160, borderRadius: 12 },
  attachmentCaption: { fontSize: 12, color: '#f8fafc', marginTop: 4 },
  attachmentChip: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  attachmentChipText: { color: '#111827' },
});
