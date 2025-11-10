import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, ScrollView, Button } from 'react-native';
import ExpoCxonemobilesdk, { Connection } from 'expo-cxonemobilesdk';
import ChannelConfigCard from '../../components/ChannelConfigCard';
import VisitorCard from '../../components/VisitorCard';
import { useEvent } from 'expo';
import { useRouter } from 'expo-router';
// Unified connection (no polling hook)
import { CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID } from '../../config/chat';
import { useConnection } from '../../components/ConnectionContext';
import ConnectionStatusCard from '../../components/ConnectionStatusCard';

export default function ChatAppHome() {
  const router = useRouter();
  const { chatState, chatMode, connected, refresh } = useConnection();
  // threadsUpdated handled inside ThreadsCard
  const errorEvent = useEvent(ExpoCxonemobilesdk, 'error');
  const connectionError = useEvent(ExpoCxonemobilesdk, 'connectionError');
  const [lastError, setLastError] = useState<string | null>(null);

  // Identity is now configured on the home screen. Prepare + connect here.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ConnectionStatusCard
          chatState={chatState}
          chatMode={chatMode}
          connected={connected}
          lastError={lastError}
          onRefresh={() => {
            setLastError(null);
            refresh();
          }}
        />

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
});
