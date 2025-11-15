import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEvent } from 'expo';
import ExpoCxonemobilesdk, { Threads, Thread } from 'expo-cxonemobilesdk';
import type { ChatThreadDetails, ChatMessage } from 'expo-cxonemobilesdk';
import { useConnection } from './ConnectionContext';

type Props = {
  connected?: boolean;
  onRefresh?: () => void;
};

export default function ThreadsCard({ connected, onRefresh }: Props) {
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);
  const { connected: ctxConnected } = useConnection();
  const isConnected = connected ?? ctxConnected;
  const router = useRouter();
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, Threads.EVENTS.UPDATED);
  const threadUpdatedEvent = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.UPDATED);
  const contactFieldsEvent = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.CONTACT_CUSTOM_FIELDS_SET);

  const [threadList, setThreadList] = useState<ChatThreadDetails[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [agentHighlights, setAgentHighlights] = useState<Record<string, string>>({});
  const seenMessagesRef = useRef<Record<string, string>>({});

  const hydrateThreads = useCallback((threads: ChatThreadDetails[]) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setThreadList(threads);
    const baseline: Record<string, string> = {};
    threads.forEach((thread) => {
      const latest = thread.messages?.[0];
      if (latest?.id) baseline[thread.id] = latest.id;
    });
    seenMessagesRef.current = baseline;
    setAgentHighlights({});
  }, []);

  const acknowledgeThread = useCallback((thread: ChatThreadDetails) => {
    const latest = thread.messages?.[0];
    if (latest?.id) {
      seenMessagesRef.current[thread.id] = latest.id;
    }
    setAgentHighlights((prev) => {
      if (!prev[thread.id]) return prev;
      const next = { ...prev };
      delete next[thread.id];
      return next;
    });
  }, []);

  const refreshThreads = useCallback(async () => {
    if (!isConnected) {
      setThreadList([]);
      return;
    }
    setRefreshing(true);
    try {
      await Threads.load();
      const refreshed = Threads.get();
      console.log('[ThreadsCard] refreshed threads', refreshed.length);
      hydrateThreads(refreshed);
    } catch (e) {
      console.error('[ThreadsCard] full refresh failed', e);
    } finally {
      setRefreshing(false);
    }
  }, [hydrateThreads, isConnected]);

  useEffect(() => {
    if (isConnected) {
      refreshThreads();
    }
  }, [isConnected, refreshThreads]);

  useEffect(() => {
    if (isConnected && threadsUpdated?.threads) {
      console.log('[ThreadsCard] threadsUpdated event', {
        count: threadsUpdated.threads.length,
        ids: threadsUpdated.threads.map((t) => t.id),
      });
      hydrateThreads(threadsUpdated.threads);
    }
  }, [threadsUpdated?.threads, isConnected, hydrateThreads]);

  useEffect(() => {
    if (!isConnected || !contactFieldsEvent) return;
    refreshThreads();
  }, [contactFieldsEvent, isConnected, refreshThreads]);

  useEffect(() => {
    if (!isConnected || !threadUpdatedEvent?.thread) return;
    const payload = threadUpdatedEvent.thread;
    console.log('[ThreadsCard] threadUpdated event', {
      id: payload.id,
      messages: payload.messages.length,
    });
    setThreadList((prev) => {
      const idx = prev.findIndex((t) => t.id === payload.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = payload;
      return next;
    });

    const latest = payload.messages?.[0];
    if (!latest?.id) return;
    const prevSeen = seenMessagesRef.current[payload.id];
    const alreadySeen = prevSeen === latest.id;
    seenMessagesRef.current[payload.id] = latest.id;

    setAgentHighlights((prev) => {
      const next = { ...prev };
      if (prevSeen && latest.direction === 'toClient' && !alreadySeen) {
        next[payload.id] = latest.id;
      } else if (latest.direction !== 'toClient' || alreadySeen) {
        delete next[payload.id];
      }
      return next;
    });
  }, [isConnected, threadUpdatedEvent?.thread]);

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

  const getThreadTitle = (thread: ChatThreadDetails) => {
    const nativeName = thread.name?.trim();
    return nativeName || 'Untitled Case';
  };

  const getCaseMeta = (thread: ChatThreadDetails) => {
    const lines = [] as string[];
    const caseId = thread.contactId?.trim();
    lines.push(`Case ID: ${caseId ?? '—'}`);
    const prechatTitle = thread.customFields?.title?.trim();
    if (prechatTitle) {
      lines.push(`Pre-chat title: ${prechatTitle}`);
    }
    return lines.join('\n');
  };

  const formatAgentName = (agent?: ChatThreadDetails['assignedAgent']) => {
    if (!agent) return null;
    const fullName = agent.fullName?.trim();
    if (fullName) return fullName;
    const composed = [agent.firstName, agent.surname]
      .filter((part?: string) => !!part?.trim())
      .join(' ')
      .trim();
    if (composed) return composed;
    if (agent.nickname?.trim()) return agent.nickname.trim();
    if (agent.id != null) return `Agent #${agent.id}`;
    return null;
  };

  const getAgentDisplay = (thread: ChatThreadDetails) => {
    const assigned = thread.assignedAgent;
    const last = thread.lastAssignedAgent;
    const assignedName = formatAgentName(assigned);
    const lastName = formatAgentName(last);
    const fallbackName = assignedName || lastName || '—';
    const initial = fallbackName.trim().charAt(0).toUpperCase() || '—';
    const label = assignedName ? `Agent: ${assignedName}` : 'Agent: —';
    const secondaryLabel = lastName && lastName !== assignedName ? `Last agent: ${lastName}` : null;
    return { label, secondaryLabel, initial };
  };

  const getThreadStats = (thread: ChatThreadDetails) => {
    const parts = [
      `Messages: ${thread.messagesCount}`,
      `Queue: ${thread.positionInQueue ?? '—'}`,
      `More to load: ${thread.hasMoreMessagesToLoad ? 'Yes' : 'No'}`,
    ];
    return parts.join(' • ');
  };

  const handleRefresh = useCallback(async () => {
    if (!isConnected || refreshing) return;
    try {
      onRefresh?.();
      await refreshThreads();
    } catch (e) {
      console.error('[ThreadsCard] manual refresh failed', e);
    }
  }, [isConnected, onRefresh, refreshThreads, refreshing]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Threads</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={!isConnected || refreshing}>
          <Text style={[styles.refresh, (!isConnected || refreshing) && styles.refreshDisabled]}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={threadList}
        keyExtractor={(t) => t.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const agentDisplay = getAgentDisplay(item);
          const isUnread = Boolean(agentHighlights[item.id]);
          return (
            <TouchableOpacity
              style={styles.thread}
              onPress={() => {
                acknowledgeThread(item);
                router.push(`/chat-app/thread/${item.id}`);
              }}
            >
              <View style={styles.row}>
                <View style={styles.icon}>
                  <Text style={styles.iconText}>{agentDisplay.initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.threadText}>{getThreadTitle(item)}</Text>
                  <Text
                    style={[styles.previewText, isUnread && styles.previewTextUnread]}
                    numberOfLines={1}
                  >
                    {messagePreview(latestMessage(item))}
                  </Text>
                {getCaseMeta(item)
                    .split('\n')
                    .map((line) => (
                      <Text key={line} style={styles.caseText}>
                        Meta:  {line}
                      </Text>
                    ))}
                  <Text style={styles.agentText}>{agentDisplay.label}</Text>
                  {agentDisplay.secondaryLabel && (
                    <Text style={styles.agentText}>{agentDisplay.secondaryLabel}</Text>
                  )}
                  <Text style={styles.statsText}>{getThreadStats(item)}</Text>
                  <Text style={styles.meta}>
                    Created: {formatTime(threadCreatedAt(item))} • Last:{' '}
                    {formatTime(latestMessage(item)?.createdAt)} • Status: {String(item.state)}
                  </Text>
                </View>
                <Text style={styles.timeText}>{formatTime(latestMessage(item)?.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.meta}>No threads yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: '600' },
  refresh: { color: '#2563eb', fontWeight: '600' },
  refreshDisabled: { color: '#9ca3af' },
  meta: { color: '#6b7280', fontSize: 12 },
  thread: { padding: 12, backgroundColor: '#f8fafc', borderRadius: 12 },
  threadText: { color: '#111827', fontSize: 16, fontWeight: '600' },
  previewText: { color: '#4b5563', marginTop: 2 },
  previewTextUnread: { color: '#111827', fontWeight: '700' },
  caseText: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  agentText: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  statsText: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: { color: '#4338ca', fontWeight: '700' },
  timeText: { color: '#2563eb', fontWeight: '600' },
});
