import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ExpoCxonemobilesdk, { Threads } from 'expo-cxonemobilesdk';
import type { ChatMessage } from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';
import { ChatList, Composer } from '../../../components/chat';

export default function ThreadScreen() {
  const router = useRouter();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const threadUpdated = useEvent(ExpoCxonemobilesdk, 'threadUpdated');
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, 'threadsUpdated');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [counterText, setCounterText] = useState<string>('1');
  const [scrollKey, setScrollKey] = useState(0);
  const [customFields, setCustomFields] = useState<Record<string, string> | null>(null);

  const reload = useCallback(async () => {
    if (!threadId) return;
    const details = await Threads.getDetails(threadId);
    setMessages(details.messages);
    setHasMore(!!details.hasMoreMessagesToLoad);
    setCustomFields(details.customFields ?? null);
  }, [threadId]);

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      try {
        await Threads.load(threadId);
      } catch {}
      await reload();
    })();
  }, [threadId]);

  // Refresh when native notifies updates for this thread
  useEffect(() => {
    if (!threadId) return;
    if (threadUpdated?.thread?.id === threadId) {
      const details = threadUpdated.thread;
      setMessages(details.messages);
      setHasMore(!!details.hasMoreMessagesToLoad);
      setCustomFields(details.customFields ?? null);
    }
  }, [threadUpdated?.thread?.id, threadId, threadUpdated?.thread]);
  useEffect(() => {
    if (!threadId) return;
    const match = threadsUpdated?.threads?.find((t) => t.id === threadId);
    if (match) {
      setMessages(match.messages);
      setHasMore(!!match.hasMoreMessagesToLoad);
      setCustomFields(match.customFields ?? null);
    }
  }, [threadsUpdated?.threads, threadId]);

  const onSend = useCallback(
    async (text: string) => {
      if (!threadId || !text) return;
      await Threads.send(threadId, { text });
      // Increment counter for next send
      const n = Number(text);
      if (Number.isFinite(n)) {
        setCounterText(String(n + 1));
      }
      await reload();
      // Explicitly scroll to bottom after sending
      setScrollKey((k) => k + 1);
    },
    [threadId, reload],
  );

  const onLoadEarlier = useCallback(async () => {
    if (!threadId) return;
    if (!hasMore) return;
    setLoadingEarlier(true);
    try {
      const details = await Threads.loadMore(threadId);
      setMessages(details.messages);
      setHasMore(!!details.hasMoreMessagesToLoad);
    } finally {
      setLoadingEarlier(false);
    }
  }, [threadId, hasMore]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="Back" onPress={() => router.back()} />
        <Text style={styles.title} numberOfLines={1}>
          Thread: {threadId}
        </Text>
        <View style={{ width: 60 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {customFields && Object.keys(customFields).length ? (
          <View style={styles.customFieldsCard}>
            <Text style={styles.sectionTitle}>Thread Details</Text>
            {Object.entries(customFields).map(([key, value]) => (
              <View style={styles.fieldRow} key={key}>
                <Text style={styles.fieldKey}>{key}</Text>
                <Text style={styles.fieldValue}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
          {loadingEarlier ? (
            <ActivityIndicator />
          ) : (
            <Button title="Load earlier" onPress={onLoadEarlier} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <ChatList
            messages={messages}
            hasMore={hasMore}
            loadingMore={loadingEarlier}
            onLoadMore={onLoadEarlier}
            scrollToBottomKey={scrollKey}
          />
        </View>
        <Composer onSend={onSend} value={counterText} onChangeText={setCounterText} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  title: { fontSize: 14, fontWeight: '600', flex: 1, marginHorizontal: 12 },
  customFieldsCard: {
    margin: 12,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#1e1b4b' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  fieldKey: { fontWeight: '600', color: '#312e81', flex: 1, marginRight: 8 },
  fieldValue: { color: '#1f2937', flex: 1, textAlign: 'right' },
});
