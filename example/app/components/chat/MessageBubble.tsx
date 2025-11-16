import React, { useMemo } from 'react';
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

export default function MessageBubble(props: Props) {
  const { text, isMe, createdAtMs, status, authorName, direction, attachments } = props;
  const bubbleStyle = useMemo(
    () => [styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem],
    [isMe],
  );
  const textStyle = useMemo(
    () => [styles.text, isMe ? styles.textMe : styles.textThem],
    [isMe],
  );
  const metaStyle = useMemo(
    () => [styles.metaRow, isMe ? styles.metaMe : styles.metaThem],
    [isMe],
  );

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
      <View style={styles.messageColumn}>
        {!isMe && authorName && <Text style={styles.author}>{authorName}</Text>}
        <View style={bubbleStyle}>
          <Text style={textStyle}>{text}</Text>
          {attachments?.map((attachment) => (
            <AttachmentPreview
              key={attachment.url || attachment.friendlyName}
              attachment={attachment}
              isMe={isMe}
            />
          ))}
        </View>
        <View style={metaStyle}>
          {!!direction && <DirectionIcon direction={direction} />}
          <Timestamp ms={createdAtMs} style={styles.metaText} variant="full" />
          {isMe && <StatusTicks status={status} />}
        </View>
      </View>
    </View>
  );
}

function AttachmentPreview({ attachment, isMe }: { attachment: Attachment; isMe: boolean }) {
  if (!attachment.url) return null;
  const isImage = attachment.mimeType?.startsWith('image/');
  const isVideo = attachment.mimeType?.startsWith('video/');
  const label = attachment.friendlyName ?? attachment.fileName ?? 'Attachment';
  const handleOpen = () => {
    if (attachment.url) Linking.openURL(attachment.url).catch(() => {});
  };

  if (isImage) {
    return (
      <TouchableOpacity
        style={[styles.attachmentImageWrapper, isMe ? styles.attachmentImageWrapperMe : styles.attachmentImageWrapperThem]}
        onPress={handleOpen}
      >
        <Image source={{ uri: attachment.url }} style={styles.attachmentImage} />
        <Text style={[styles.attachmentCaption, isMe ? styles.attachmentCaptionMe : styles.attachmentCaptionThem]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.attachmentChip} onPress={handleOpen}>
      <Text style={[styles.attachmentChipText, isMe ? styles.attachmentChipTextMe : styles.attachmentChipTextThem]}>
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
  messageColumn: { maxWidth: '85%' },
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
  attachmentImageWrapper: { marginTop: 8, borderRadius: 12, overflow: 'hidden' },
  attachmentImageWrapperMe: { backgroundColor: 'rgba(255,255,255,0.1)' },
  attachmentImageWrapperThem: { backgroundColor: '#e2e8f0' },
  attachmentImage: { width: 220, height: 160 },
  attachmentCaption: { fontSize: 12, marginTop: 4 },
  attachmentCaptionMe: { color: '#f8fafc' },
  attachmentCaptionThem: { color: '#111827' },
  attachmentChip: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  attachmentChipText: { color: '#111827' },
  attachmentChipTextMe: { color: '#f8fafc' },
  attachmentChipTextThem: { color: '#111827' },
});
