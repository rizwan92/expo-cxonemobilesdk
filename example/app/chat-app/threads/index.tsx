import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, Button, StyleSheet } from 'react-native';
import { useEvent } from 'expo';
import ExpoCxonemobilesdk, { Connection } from 'expo-cxonemobilesdk';
import ThreadsCard from '../ThreadsCard';

export default function ThreadListScreen() {
  const chatUpdated = useEvent(ExpoCxonemobilesdk, 'chatUpdated');
  const [chatState, setChatState] = useState(Connection.getChatState());
  const [chatMode, setChatMode] = useState<
    'singlethread' | 'multithread' | 'liveChat' | 'unknown'
  >(Connection.getChatMode());

  const connected = useMemo(
    () => chatState === 'connected' || chatState === 'ready',
    [chatState],
  );

  const refreshState = useCallback(() => {
    const state = Connection.getChatState();
    setChatState(state);
    if (state === 'connected' || state === 'ready') {
      setChatMode(Connection.getChatMode());
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  useEffect(() => {
    if (!chatUpdated?.state) return;
    setChatState(chatUpdated.state);
    if (chatUpdated.state === 'connected' || chatUpdated.state === 'ready') {
      setChatMode(Connection.getChatMode());
    }
  }, [chatUpdated?.state]);

  const status = useMemo(
    () => `${chatState} ${connected ? '• Online' : '• Offline'} • Mode: ${chatMode}`,
    [chatState, connected, chatMode],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerText}>Thread List</Text>
          <Text style={styles.meta}>{status}</Text>
          <Button title="Refresh" onPress={refreshState} />
        </View>
        <ThreadsCard connected={connected} chatMode={chatMode} />
      </ScrollView>
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
