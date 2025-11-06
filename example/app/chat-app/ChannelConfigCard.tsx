import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Platform } from 'react-native';
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


  return (
    <View style={styles.card}>
      <Text style={styles.title}>Channel</Text>
      <Button title="Refresh Config" onPress={load} />
      {!!error && <Text style={[styles.meta, { color: '#b91c1c' }]}>Error: {error}</Text>}
      <View style={{ height: 8 }} />
      {cfg ? (
        <>
          <Text style={styles.meta}>Platform: {Platform.OS}</Text>
          <Text style={styles.meta}>Online: {String(cfg.isOnline)}</Text>
          <Text style={styles.meta}>Live Chat: {String(cfg.isLiveChat)}</Text>
          <Text style={styles.meta}>
            Multithread: {String(cfg.hasMultipleThreadsPerEndUser)}
          </Text>
          <Text style={styles.meta}>
            Authorization Enabled: {String(cfg.isAuthorizationEnabled)}
          </Text>
          <Text style={styles.meta}>
            Proactive Enabled: {String(cfg.isProactiveChatEnabled)}
          </Text>
          <Text style={styles.meta}>
            Attachments Enabled: {String(cfg.fileRestrictions.isAttachmentsEnabled)}
          </Text>
          <Text style={styles.meta}>
            Allowed Types: {cfg.fileRestrictions.allowedFileTypes.length}
          </Text>
          {cfg.fileRestrictions.allowedFileSize !== undefined && (() => {
            const size = cfg.fileRestrictions.allowedFileSize;
            if (typeof size === 'number') {
              return <Text style={styles.meta}>File Size: {size} KB</Text>;
            }
            if (!size) {
              return null;
            }
            const min = size.minKb ?? '—';
            const max = size.maxKb ?? '—';
            return <Text style={styles.meta}>File Size: {min}–{max} KB</Text>;
          })()}
          {(() => {
            const entries = Object.entries(cfg.features);
            if (entries.length === 0) {
              return <Text style={styles.meta}>Features (0)</Text>;
            }
            const preview = entries
              .slice(0, 3)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            return (
              <Text style={styles.meta}>
                Features ({entries.length}): {preview}
                {entries.length > 3 ? '…' : ''}
              </Text>
            );
          })()}
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
