// React primitives for state/effect management as well as refs
import React, { useCallback, useEffect, useRef, useState } from 'react';
// Core RN components used to compose the chat screen UI
import {
  SafeAreaView,
  View,
  Text,
  Button,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
// Router helpers for reading the route param (threadId) and navigating back
import { useLocalSearchParams, useRouter } from 'expo-router';
// Native module surface + typed helpers for thread operations
import ExpoCxonemobilesdk, { Thread } from 'expo-cxonemobilesdk';
// Message shape mirrored from the native SDK
import type { ChatMessage, ChatThreadDetails } from 'expo-cxonemobilesdk';
// Expo helper to subscribe to native events
import { useEvent } from 'expo';
// Reusable chat UI building blocks
import { ChatList, Composer } from '../../components/chat';

type PendingAttachment = {
  id: string;
  name: string;
  mimeType: string;
  type: 'image' | 'video' | 'file';
  base64: string;
  size?: number | null;
};

export default function ThreadScreen() {
  // Expo Router instance for navigation actions (back / push)
  const router = useRouter();
  // Extract the current threadId from the route (e.g., /thread/[threadId])
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  // Subscribe to native `threadUpdated` events so UI reflects server pushes
  const threadUpdated = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.UPDATED);
  const agentTypingEvent = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.AGENT_TYPING);
  const contactFieldsEvent = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.CONTACT_CUSTOM_FIELDS_SET);

  // Rendered chat messages (mirrors native payload order)
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadInfo, setThreadInfo] = useState<ChatThreadDetails | null>(null);
  // Track whether we are fetching older history to show spinner/disable loads
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  // Whether more history is available server-side (native informs us)
  const [hasMore, setHasMore] = useState<boolean>(false);
  // Simple helper text used by the demo to send sequential numbers quickly
  const [counterText, setCounterText] = useState<string>('1');
  // Bumping this value tells the list to auto-scroll to the bottom
  const [scrollKey, setScrollKey] = useState(0);
  // Cached custom fields so the thread details card can display them
  const [customFields, setCustomFields] = useState<Record<string, string> | null>(null);
  // Pull-to-refresh visual state
  const [refreshing, setRefreshing] = useState(false);
  const [agentTypingIndicator, setAgentTypingIndicator] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  // Guard flag to avoid processing events while a manual reload is pending
  const reloadingRef = useRef(false);
  const suppressAutoScrollRef = useRef(false);

  // Always hydrate from native so we don't keep any optimistic/pending copies in JS.
  const getInitialMessages = useCallback(async () => {
    // Skip if the screen was opened without a thread id
    if (!threadId) return;
    // Mark that a reload is happening to mute event-driven updates mid-flight
    reloadingRef.current = true;
    try {
      const details = await Thread.getDetails(threadId);
      setMessages(details.messages);
      setHasMore(!!details.hasMoreMessagesToLoad);
      setScrollKey((k) => k + 1);
      setCustomFields(details.customFields ?? null);
      setThreadInfo(details);
    } catch (err) {
      console.error('[ChatApp/Thread] getInitialMessages failed', err);
    } finally {
      reloadingRef.current = false;
    }
  }, [threadId]);

  useEffect(() => {
    // Fetch messages whenever the route changes to a new thread id
    if (!threadId) return;
    getInitialMessages();
  }, [threadId, getInitialMessages]);

  useEffect(() => {
    if (!threadId || !contactFieldsEvent) return;
    getInitialMessages();
  }, [threadId, contactFieldsEvent, getInitialMessages]);

  // Refresh when native notifies updates for this thread
  useEffect(() => {
    // Ignore events until we finish a manual hydration
    if (!threadId || reloadingRef.current) return;
    if (threadUpdated?.thread?.id === threadId) {
      // CXone emits the full message history for recovered threads, so just mirror it.
      setMessages(threadUpdated.thread.messages);
      setHasMore(!!threadUpdated.thread.hasMoreMessagesToLoad);
      setCustomFields(threadUpdated.thread.customFields ?? null);
      if (!suppressAutoScrollRef.current) {
        setScrollKey((k) => k + 1);
      }
      setThreadInfo(threadUpdated.thread as ChatThreadDetails);
    }
  }, [threadId, threadUpdated?.thread]);

  useEffect(() => {
    if (!threadId || !agentTypingEvent) return;
    if (agentTypingEvent.threadId !== threadId) return;
    const agentName =
      agentTypingEvent.agent?.fullName?.trim() ||
      agentTypingEvent.agent?.nickname?.trim() ||
      agentTypingEvent.agent?.firstName?.trim() ||
      'Agent';
    if (agentTypingEvent.isTyping) {
      setAgentTypingIndicator(`${agentName} is typing…`);
    } else {
      setAgentTypingIndicator(null);
    }
  }, [
    agentTypingEvent?.agent?.firstName,
    agentTypingEvent?.agent?.fullName,
    agentTypingEvent?.agent?.nickname,
    agentTypingEvent?.isTyping,
    agentTypingEvent?.threadId,
    threadId,
  ]);

  // Send handler invoked by the Composer component
  const onSend = useCallback(
    async (text: string) => {
      if (!threadId) return;
      const trimmed = text.trim();
      const hasText = trimmed.length > 0;
      const hasAttachments = pendingAttachments.length > 0;
      if (!hasText && !hasAttachments) return;

      try {
        await Thread.send(threadId, {
          text: hasText ? trimmed : '',
          attachments: hasAttachments
            ? pendingAttachments.map((attachment) => ({
                data: attachment.base64,
                mimeType: attachment.mimeType,
                fileName: attachment.name,
                friendlyName: attachment.name,
              }))
            : undefined,
        });
        if (hasAttachments) {
          setPendingAttachments([]);
        }
        const n = Number(trimmed);
        if (hasText && Number.isFinite(n)) {
          setCounterText(String(n + 1));
        }
        setScrollKey((k) => k + 1);
      } catch (err) {
        console.error('[ChatApp/Thread] onSend failed', err);
        throw err;
      }
    },
    [threadId, pendingAttachments],
  );

  // Manual "load older history" action. We only call getDetails when needed.
  const onLoadEarlier = useCallback(async () => {
    if (!threadId) return;
    if (!hasMore && Platform.OS !== 'ios') return;
    // Show spinner while more history loads from native
    setLoadingEarlier(true);
    suppressAutoScrollRef.current = true;
    try {
      const details = await Thread.loadMore(threadId);
      setMessages(details.messages);
      setHasMore(!!details.hasMoreMessagesToLoad);
      setThreadInfo(details);
    } finally {
      suppressAutoScrollRef.current = false;
      setLoadingEarlier(false);
    }
  }, [threadId, hasMore]);

  // Pull-to-refresh handler: simply re-fetch the native snapshot
  const handleRefresh = useCallback(async () => {
    if (!threadId || refreshing) return;
    setRefreshing(true);
    try {
      await getInitialMessages();
    } finally {
      setRefreshing(false);
    }
  }, [threadId, refreshing, getInitialMessages]);

  const addAttachment = useCallback((attachment: PendingAttachment) => {
    setPendingAttachments((prev) => [...prev, attachment]);
  }, []);

  const handlePickMedia = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'image';
      const mimeType = asset.mimeType ?? (type === 'video' ? 'video/mp4' : 'image/jpeg');
      let base64 = asset.base64;
      if (!base64 && asset.uri) {
        const file = new File(asset.uri);
        base64 = await file.base64();
      }
      if (!base64) {
        Alert.alert('Attachment error', 'Unable to read the selected media.');
        return;
      }
      addAttachment({
        id: `${Date.now()}-${Math.random()}`,
        name: asset.fileName ?? `media-${Date.now()}`,
        mimeType,
        type,
        base64,
        size: asset.fileSize,
      });
    } catch (error) {
      console.error('[ChatApp/Thread] pick media failed', error);
      Alert.alert('Attachment error', 'Failed to pick media file.');
    }
  }, [addAttachment]);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.uri) return;
      const file = new File(asset.uri);
      const base64 = await file.base64();
      addAttachment({
        id: `${Date.now()}-${Math.random()}`,
        name: asset.name ?? 'document',
        mimeType: asset.mimeType ?? 'application/octet-stream',
        type: 'file',
        base64,
        size: asset.size,
      });
    } catch (error) {
      console.error('[ChatApp/Thread] pick document failed', error);
      Alert.alert('Attachment error', 'Failed to pick document.');
    }
  }, [addAttachment]);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((att) => att.id !== id));
  }, []);

  return (
    // Basic safe-area wrapper for notch devices
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.leftColumn}>
          <Button title="Back" onPress={() => router.back()} />
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.threadIdBlock}>
            <Text style={styles.threadIdLabel}>Thread ID</Text>
            <Text style={styles.threadIdValue} selectable numberOfLines={2}>
              {threadId ?? 'Unknown'}
            </Text>
          </View>
          <View style={styles.threadIdBlock}>
            <Text style={styles.threadIdLabel}>Case ID</Text>
            <Text style={styles.threadIdValue} selectable numberOfLines={2}>
              {threadInfo?.contactId ?? 'Unknown'}
            </Text>
          </View>
          <View style={styles.headerContainer}>
            <Button
              title={refreshing ? 'Refreshing…' : 'Refresh'}
              onPress={handleRefresh}
              disabled={refreshing}
            />
            <Button
              title="Edit Details"
              onPress={() => router.push(`/chat-app/threads/create?threadId=${threadId}`)}
              disabled={!threadId}
            />
          </View>
        </View>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {threadInfo?.state || (customFields && Object.keys(customFields).length) ? (
          // Show custom fields when the thread supplies metadata
          <View style={styles.customFieldsCard}>
            <Text style={styles.sectionTitle}>Thread Details</Text>
            {threadInfo?.state ? (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldKey}>Status</Text>
                <Text style={styles.fieldValue}>{String(threadInfo.state)}</Text>
              </View>
            ) : null}
            {customFields
              ? Object.entries(customFields).map(([key, value]) => (
                  <View style={styles.fieldRow} key={key}>
                    <Text style={styles.fieldKey}>{key}</Text>
                    <Text style={styles.fieldValue}>{value}</Text>
                  </View>
                ))
              : null}
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
          {/* Chat list handles rendering the message bubbles & infinite scroll */}
          <ChatList
            messages={messages}
            hasMore={hasMore}
            loadingMore={loadingEarlier}
            onLoadMore={onLoadEarlier}
            scrollToBottomKey={scrollKey}
          />
        </View>
        {agentTypingIndicator ? (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>{agentTypingIndicator}</Text>
          </View>
        ) : null}
        {/* Composer exposes the send UI and passes text to onSend */}
        <Composer
          onSend={onSend}
          value={counterText}
          onChangeText={setCounterText}
          canSend={(text) => pendingAttachments.length > 0 || text.trim().length > 0}
          attachments={pendingAttachments}
          onRemoveAttachment={removeAttachment}
          attachmentActions={[
            { label: 'Photo/Video', onPress: handlePickMedia },
            { label: 'Document', onPress: handlePickDocument },
          ]}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  leftColumn: { width: 80, justifyContent: 'center' },
  rightColumn: { flex: 1, alignItems: 'center', gap: 8 },
  headerActions: {
    flexDirection: 'column',
    gap: 8,
  },
  threadIdBlock: {
    alignItems: 'center',
  },
  threadIdLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 2,
  },
  threadIdValue: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined }),
    fontSize: 13,
    color: '#111827',
    textAlign: 'center',
  },
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
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  typingText: { color: '#6b7280', fontStyle: 'italic' },
});
