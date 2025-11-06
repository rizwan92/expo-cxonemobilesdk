import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import ExpoCxonemobilesdk, { Connection, Threads } from 'expo-cxonemobilesdk';
import type { ChatThreadDetails } from 'expo-cxonemobilesdk';
import ChannelConfigCard from './ChannelConfigCard';
import VisitorCard from './VisitorCard';
import { useEvent } from 'expo';
// Unified connection (no polling hook)
import { CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID } from './config';

export default function ChatAppHome() {
  const router = useRouter();
  const params = useLocalSearchParams<{ auth?: string; uid?: string; fn?: string; ln?: string }>();
  const chatUpdated = useEvent(ExpoCxonemobilesdk, 'chatUpdated');
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, 'threadsUpdated');
  const errorEvent = useEvent(ExpoCxonemobilesdk, 'error');
  const connectionError = useEvent(ExpoCxonemobilesdk, 'connectionError');
  const authorizationChanged = useEvent(ExpoCxonemobilesdk, 'authorizationChanged');
  const [chatState, setChatState] = useState<string>('initial');
  const connected = chatState === 'connected' || chatState === 'ready';

  const [threadList, setThreadList] = useState<ChatThreadDetails[]>([]);
  const [prepareDone, setPrepareDone] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'singlethread' | 'multithread' | 'liveChat' | 'unknown'>(
    'unknown',
  );
  const [starting, setStarting] = useState(false);

  // Set identity/auth first (if provided), then prepare + connect on open
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = typeof params.uid === 'string' ? params.uid : '';
        const fn = typeof params.fn === 'string' ? params.fn : undefined;
        const ln = typeof params.ln === 'string' ? params.ln : undefined;
        const token = typeof params.auth === 'string' ? params.auth : '';

        if (id) {
          try { Customer.setIdentity(id, fn, ln); } catch {}
        }
        if (token) {
          try { Customer.setAuthorizationCode(token); } catch {}
        }

        await Connection.prepareAndConnect(CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID);
        if (cancelled) return;
        setPrepareDone(true);
      } catch (e) {
        console.error('[ChatAppHome] prepare/connect failed', e);
        setLastError(String((e as any)?.message ?? e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.uid, params.fn, params.ln, params.auth]);

  // Load visitor id and thread list
  const reload = useCallback(() => {
    // Only query native once fully connected/ready
    const st = Connection.getChatState();
    const is = st === 'connected' || st === 'ready';
    if (!is) return;
    setThreadList(Threads.get());
    setChatMode(Connection.getChatMode());
  }, []);


  useEffect(() => {
    if (chatUpdated?.state) setChatState(chatUpdated.state);
    // Only reload data after we’re connected
    const is = (chatUpdated?.state ?? chatState) === 'connected' || (chatUpdated?.state ?? chatState) === 'ready';
    if (is) reload();
  }, [prepareDone, chatUpdated?.state, threadsUpdated?.threadIds?.length]);

  // Channel configuration moved to ChannelConfigCard component

  // (Identity/auth now set before connecting to satisfy iOS state requirements)

  // Surface native error events in UI status
  useEffect(() => {
    if (errorEvent?.message) setLastError(errorEvent.message);
  }, [errorEvent?.message]);
  useEffect(() => {
    if (connectionError?.message) setLastError(`${connectionError.phase}: ${connectionError.message}`);
  }, [connectionError?.message]);

  const headerStatus = useMemo(
    () => `${chatState} ${connected ? '• Online' : '• Offline'} • Mode: ${chatMode}`,
    [chatState, connected, chatMode],
  );

  const isMultithread = chatMode === 'multithread';
  const startSingleThread = useCallback(async () => {
    setLastError(null);
    setStarting(true);
    try {
      // Create a new thread explicitly and navigate to it
      const details = await Threads.create();
      router.push(`/chat-app/thread/${details.id}`);
    } catch (e) {
      setLastError(String((e as any)?.message ?? e));
    } finally {
      setStarting(false);
    }
  }, [router]);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerText} numberOfLines={2}>
            Chat Status: {headerStatus}
          </Text>
          {!!lastError && (
            <Text style={[styles.headerText, styles.headerError]} numberOfLines={2}>
              Error: {lastError}
            </Text>
          )}
        </View>
        <Button
          title="Refresh"
          onPress={() => {
            setLastError(null);
            setChatState(Connection.getChatState());
            reload();
          }}
        />
      </View>

      {/* Authentication handled on the home screen */}

      {/* Profiles and Preferred Agent sections removed per request */}

      <VisitorCard connected={connected} />

      <ChannelConfigCard connected={connected} />

      <View style={styles.card}>
        <Text style={styles.title}>Threads</Text>
        {!isMultithread && (
          <Button
            title={starting ? 'Starting…' : 'Start Chat'}
            onPress={startSingleThread}
            disabled={!connected || starting}
          />
        )}
        {!isMultithread && (
          <Text style={[styles.meta, { marginTop: 8 }]}>
            This channel is {chatMode}. Use Start Chat to open the single active thread.
          </Text>
        )}

        <View style={{ height: 8 }} />
        <Button
          title={
            isMultithread ? 'Create New Thread' : 'Create New Thread (unsupported in this mode)'
          }
          disabled={!isMultithread}
          onPress={async () => {
            try {
              // Ensure connected with a single state-aware native call
              await Connection.prepareAndConnect(CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID);
              const details = await Threads.create();
              setThreadList(Threads.get());
              router.push(`/chat-app/thread/${details.id}`);
            } catch (e) {
              setLastError(String((e as any)?.message ?? e));
            }
          }}
        />
        <FlatList
          data={threadList}
          keyExtractor={(t) => t.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.thread}
              onPress={() => router.push(`/chat-app/thread/${item.id}`)}
            >
              <Text style={styles.threadText}>
                {item.name && item.name.length ? item.name : item.id}
              </Text>
              <Text style={styles.meta}>
                State: {String(item.state)} • Messages:{' '}
                {item.messagesCount ?? item.messages?.length ?? 0} • More:{' '}
                {String(item.hasMoreMessagesToLoad)}
              </Text>
              {item.assignedAgent?.fullName ? (
                <Text style={styles.meta}>Agent: {item.assignedAgent.fullName}</Text>
              ) : item.lastAssignedAgent?.fullName ? (
                <Text style={styles.meta}>Last Agent: {item.lastAssignedAgent.fullName}</Text>
              ) : null}
              {typeof item.scrollToken === 'string' && (
                <Text style={styles.meta}>
                  Scroll:{' '}
                  {item.scrollToken.length > 16
                    ? `${item.scrollToken.slice(0, 16)}…`
                    : item.scrollToken}
                </Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.meta}>No threads yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 12 },
  header: {
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextBox: { flex: 1, paddingRight: 8 },
  headerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  headerError: { color: '#fecaca' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  meta: { color: '#555' },
  thread: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10 },
  threadText: { color: '#111827' },
});
