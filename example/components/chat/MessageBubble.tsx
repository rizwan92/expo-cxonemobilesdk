import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Timestamp from './Timestamp';
import StatusTicks from './StatusTicks';
import DirectionIcon from './DirectionIcon';

type Props = {
  text: string;
  isMe: boolean;
  createdAtMs?: number;
  status?: 'sent' | 'delivered' | 'seen' | 'failed';
  authorName?: string | null;
  direction?: 'toAgent' | 'toClient';
};

export default function MessageBubble({ text, isMe, createdAtMs, status, authorName, direction }: Props) {
  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowThem]}>
      <View style={{ maxWidth: '85%' }}>
        {!isMe && !!authorName && (
          <Text style={styles.author}>{authorName}</Text>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>{text}</Text>
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
});
