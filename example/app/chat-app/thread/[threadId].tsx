import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Threads } from "expo-cxonemobilesdk";
import type { ChatMessage } from "expo-cxonemobilesdk";
import { useEvent } from "expo";
import { ChatList, Composer } from "../../../components/chat";

export default function ThreadScreen() {
  const router = useRouter();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const threadUpdated = useEvent(
    require("expo-cxonemobilesdk").default,
    "threadUpdated"
  );
  const threadsUpdated = useEvent(
    require("expo-cxonemobilesdk").default,
    "threadsUpdated"
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingEarlier, setLoadingEarlier] = useState(false);

  const reload = useCallback(async () => {
    if (!threadId) return;
    const raw = await Threads.getMessages(threadId);
    console.log("Loaded messages for thread", threadId, JSON.stringify(raw, null, 2));
    setMessages(raw);
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
    if (threadUpdated?.threadId === threadId) reload();
  }, [threadUpdated?.threadId]);
  useEffect(() => {
    reload();
  }, [threadsUpdated?.threadIds?.length]);

  const onSend = useCallback(
    async (text: string) => {
      if (!threadId || !text) return;
      await Threads.sendText(threadId, text);
      await reload();
    },
    [threadId, reload]
  );

  const onLoadEarlier = useCallback(async () => {
    if (!threadId) return;
    setLoadingEarlier(true);
    try {
      await Threads.loadMore(threadId);
      await reload();
    } finally {
      setLoadingEarlier(false);
    }
  }, [threadId]);

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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
          {loadingEarlier ? (
            <ActivityIndicator />
          ) : (
            <Button title="Load earlier" onPress={onLoadEarlier} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <ChatList messages={messages} />
        </View>
        <Composer onSend={onSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  title: { fontSize: 14, fontWeight: "600", flex: 1, marginHorizontal: 12 },
});
