import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEvent } from 'expo';
import ExpoCxonemobilesdk, { Threads } from 'expo-cxonemobilesdk';
import type { ChatThreadDetails, ChatMessage } from 'expo-cxonemobilesdk';
import { useConnection } from './ConnectionContext';

type Props = {
  connected?: boolean;
};

export default function ThreadsCard({ connected }: Props) {
  const { connected: ctxConnected } = useConnection();
  const isConnected = connected ?? ctxConnected;
  const router = useRouter();
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, 'threadsUpdated');

  const [threadList, setThreadList] = useState<ChatThreadDetails[]>([]);
  const refreshThreads = useCallback(() => {
    if (!isConnected) return;
    setThreadList(Threads.get());
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) refreshThreads();
  }, [isConnected, refreshThreads]);

  useEffect(() => {
    if (isConnected && threadsUpdated?.threads) {
      setThreadList(threadsUpdated.threads);
    }
  }, [threadsUpdated?.threads, isConnected]);

  const formatTime = (iso?: string) => {
    if (!iso) return '—';
    const date = new Date(iso);
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  const threadCreatedAt = (thread: ChatThreadDetails) => {
    const oldest = thread.messages[thread.messages.length - 1];
    return oldest?.createdAt;
  };

  const latestMessage = (thread: ChatThreadDetails): ChatMessage | undefined => thread.messages[0];

  const messagePreview = (message?: ChatMessage) => {
    if (!message) return 'No messages yet';
    switch (message.contentType.type) {
      case 'text':
        return message.contentType.payload.text;
      case 'richLink':
        return message.contentType.data.title;
      case 'quickReplies':
        return message.contentType.data.title ?? 'Quick replies';
      case 'listPicker':
        return message.contentType.data.title ?? 'List Picker';
      default:
        return 'Unsupported message type';
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Threads</Text>
      <FlatList
        data={threadList}
        keyExtractor={(t) => t.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.thread} onPress={() => router.push(`/chat-app/thread/${item.id}`)}>
            <View style={styles.row}>
              <View style={styles.icon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.threadText}>{item.name && item.name.length ? item.name : 'Untitled Case'}</Text>
                <Text style={styles.previewText} numberOfLines={1}>
                  {messagePreview(latestMessage(item))}
                </Text>
                <Text style={styles.meta}>
                  Created: {formatTime(threadCreatedAt(item))} • Last: {formatTime(latestMessage(item)?.createdAt)} • Status: {String(item.state)}
                </Text>
              </View>
              <Text style={styles.timeText}>{formatTime(latestMessage(item)?.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.meta}>No threads yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  meta: { color: '#6b7280', fontSize: 12 },
  thread: { padding: 12, backgroundColor: '#f8fafc', borderRadius: 12 },
  threadText: { color: '#111827', fontSize: 16, fontWeight: '600' },
  previewText: { color: '#4b5563', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0e7ff' },
  timeText: { color: '#2563eb', fontWeight: '600' },
});
