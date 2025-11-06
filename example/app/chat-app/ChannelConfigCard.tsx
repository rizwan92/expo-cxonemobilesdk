import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Connection } from 'expo-cxonemobilesdk';
import type { ChannelConfiguration } from 'expo-cxonemobilesdk';
import { CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID } from './config';

type Props = { connected: boolean };

export default function ChannelConfigCard({ connected }: Props) {
  const [cfg, setCfg] = useState<ChannelConfiguration | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const c = await Connection.getChannelConfiguration(
        CHAT_ENV,
        CHAT_BRAND_ID,
        CHAT_CHANNEL_ID,
      );
      setCfg(c);
    } catch (e) {
      setError(String((e as any)?.message ?? e));
    }
  }, []);

  useEffect(() => {
    if (connected && !cfg) {
      // fire-and-forget initial load
      load();
    }
  }, [connected, cfg]);


  console.log('ChannelConfigCard render', JSON.stringify(cfg, null, 2));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Channel</Text>
      <Button title="Refresh Config" onPress={load} />
      {!!error && <Text style={[styles.meta, { color: '#b91c1c' }]}>Error: {error}</Text>}
      <View style={{ height: 8 }} />
      {cfg ? (
        <>
          {typeof (cfg as any)?.channelId === 'string' && (
            <Text style={styles.meta}>ID: {(cfg as any).channelId}</Text>
          )}
          {typeof (cfg as any)?.channelName === 'string' && (
            <Text style={styles.meta}>Name: {(cfg as any).channelName}</Text>
          )}
          {typeof cfg.mode === 'string' && <Text style={styles.meta}>Mode: {cfg.mode}</Text>}
          <Text style={styles.meta}>Online: {String(cfg.isOnline)}</Text>
          <Text style={styles.meta}>Live Chat: {String(cfg.isLiveChat)}</Text>
          <Text style={styles.meta}>
            Multithread: {String(cfg.hasMultipleThreadsPerEndUser)}
          </Text>
          <Text style={styles.meta}>
            Authorization Enabled: {String(cfg.isAuthorizationEnabled)}
          </Text>
          <Text style={styles.meta}>
            Proactive Enabled: {String(cfg.isProactiveChatEnabled ?? cfg.features?.isProactiveChatEnabled)}
          </Text>
          <Text style={styles.meta}>
            Attachments Enabled: {String(cfg.fileRestrictions?.isAttachmentsEnabled)}
          </Text>
          <Text style={styles.meta}>
            Allowed Types: {cfg.fileRestrictions?.allowedFileTypes?.length ?? 0}
          </Text>
          {!!cfg.fileRestrictions?.allowedFileSize && (
            <Text style={styles.meta}>
              File Size: {(cfg.fileRestrictions.allowedFileSize as any).minKb ?? '—'}–
              {(cfg.fileRestrictions.allowedFileSize as any).maxKb ?? '—'} KB
            </Text>
          )}
          <View style={{ height: 8 }} />
          <Button title={showMore ? 'Hide Details' : 'View More'} onPress={() => setShowMore((s) => !s)} />
          {showMore && (
            <Text style={[styles.meta, { marginTop: 8 }]}>{JSON.stringify(cfg, null, 2)}</Text>
          )}
        </>
      ) : (
        <Text style={styles.meta}>No configuration loaded.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  meta: { color: '#555' },
});

