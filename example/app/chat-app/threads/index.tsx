import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import ThreadsCard from '../../../components/ThreadsCard';
import { useConnection } from '../../../components/ConnectionContext';

export default function ThreadListScreen() {
  const router = useRouter();
  const { chatState, chatMode, connected, refresh } = useConnection();

  const status = useMemo(
    () => `${chatState} ${connected ? '• Online' : '• Offline'} • Mode: ${chatMode}`,
    [chatState, connected, chatMode],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Thread List</Text>
        <Text style={styles.meta}>{status}</Text>
        <Button title="Refresh" onPress={refresh} />
        <View style={{ height: 12 }} />
        <Button
          title="Create Thread"
          onPress={() => router.push('/chat-app/threads/create')}
          disabled={!connected}
        />
      </View>

      <ThreadsCard connected={connected} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 12 },
  header: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
  },
  headerText: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  meta: { color: '#555', marginBottom: 8 },
});
