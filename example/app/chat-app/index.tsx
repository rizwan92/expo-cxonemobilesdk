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
import ExpoCxonemobilesdk, { Connection, Customer } from 'expo-cxonemobilesdk';
import type { ChatThreadDetails } from 'expo-cxonemobilesdk';
import ThreadsCard from './ThreadsCard';
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
  const [chatState, setChatState] = useState<string>('initial');
  const connected = chatState === 'connected' || chatState === 'ready';

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

      <ThreadsCard connected={connected} chatMode={chatMode} />
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
