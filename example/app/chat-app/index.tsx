import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ExpoCxonemobilesdk, { Connection, Customer } from 'expo-cxonemobilesdk';
import ChannelConfigCard from './ChannelConfigCard';
import VisitorCard from './VisitorCard';
import { useEvent } from 'expo';
import { useRouter } from 'expo-router';
// Unified connection (no polling hook)
import { CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID } from './config';
import { useConnection } from './ConnectionContext';

export default function ChatAppHome() {
  const params = useLocalSearchParams<{ auth?: string; uid?: string; fn?: string; ln?: string }>();
  const router = useRouter();
  const { chatState, chatMode, connected, refresh } = useConnection();
  // threadsUpdated handled inside ThreadsCard
  const errorEvent = useEvent(ExpoCxonemobilesdk, 'error');
  const connectionError = useEvent(ExpoCxonemobilesdk, 'connectionError');
  const [lastError, setLastError] = useState<string | null>(null);

  // Set identity/auth first (if provided), then prepare + connect on open
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = typeof params.uid === 'string' ? params.uid : '';
        const fn = typeof params.fn === 'string' ? params.fn : undefined;
        const ln = typeof params.ln === 'string' ? params.ln : undefined;
        if (id) {
          try {
            Customer.setIdentity(id, fn, ln);
          } catch {}
        }

        await Connection.prepareAndConnect(CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID);
        if (cancelled) return;
      } catch (e) {
        console.error('[ChatAppHome] prepare/connect failed', e);
        setLastError(String((e as any)?.message ?? e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.uid, params.fn, params.ln, params.auth]);

  // Channel configuration moved to ChannelConfigCard component

  // (Identity/auth now set before connecting to satisfy iOS state requirements)

  // Surface native error events in UI status
  useEffect(() => {
    if (errorEvent?.message) setLastError(errorEvent.message);
  }, [errorEvent?.message]);
  useEffect(() => {
    if (connectionError?.message)
      setLastError(`${connectionError.phase}: ${connectionError.message}`);
  }, [connectionError?.message]);

  const headerStatus = useMemo(
    () => `${chatState} ${connected ? '• Online' : '• Offline'} • Mode: ${chatMode}`,
    [chatState, connected, chatMode],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
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
              refresh();
            }}
          />
        </View>

        {/* Authentication handled on the home screen */}

        {/* Profiles and Preferred Agent sections removed per request */}

        <VisitorCard connected={connected} />

        <ChannelConfigCard connected={connected} />
        <Button
          title="View Threads"
          onPress={() => router.push('/chat-app/threads')}
          disabled={!connected}
        />
      </ScrollView>
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
