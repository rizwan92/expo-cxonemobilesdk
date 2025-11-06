import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEvent } from 'expo';
import ExpoCxonemobilesdk, { Threads, Connection } from 'expo-cxonemobilesdk';
import type { ChatThreadDetails } from 'expo-cxonemobilesdk';

type Props = {
  connected: boolean;
};

export default function ThreadsCard({ connected }: Props) {
  const router = useRouter();
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, 'threadsUpdated');

  const [threadList, setThreadList] = useState<ChatThreadDetails[]>([]);
  const refreshThreads = useCallback(() => {
    if (!connected) return;
    setThreadList(Threads.get());
  }, [connected]);

  useEffect(() => {
    if (connected) refreshThreads();
  }, [connected, refreshThreads]);

  useEffect(() => {
    if (connected && threadsUpdated?.threads) {
      setThreadList(threadsUpdated.threads);
    }
  }, [threadsUpdated?.threads, connected]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Threads</Text>
      <FlatList
        data={threadList}
        keyExtractor={(t) => t.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.thread} onPress={() => router.push(`/chat-app/thread/${item.id}`)}>
            <Text style={styles.threadText}>{item.name && item.name.length ? item.name : item.id}</Text>
            <Text style={styles.meta}>
              State: {String(item.state)} • Messages: {item.messagesCount} • More: {String(item.hasMoreMessagesToLoad)}
            </Text>
            {item.assignedAgent?.fullName ? (
              <Text style={styles.meta}>Agent: {item.assignedAgent.fullName}</Text>
            ) : item.lastAssignedAgent?.fullName ? (
              <Text style={styles.meta}>Last Agent: {item.lastAssignedAgent.fullName}</Text>
            ) : null}
            {typeof item.scrollToken === 'string' && (
              <Text style={styles.meta}>
                Scroll: {item.scrollToken.length > 16 ? `${item.scrollToken.slice(0, 16)}…` : item.scrollToken}
              </Text>
            )}
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
  meta: { color: '#555' },
  thread: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10 },
  threadText: { color: '#111827' },
});
