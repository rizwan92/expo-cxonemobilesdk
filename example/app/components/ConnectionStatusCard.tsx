import React, { useMemo } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import type { ChatMode, ChatState } from 'expo-cxonemobilesdk';

type Props = {
  chatState: ChatState;
  chatMode: ChatMode;
  connected: boolean;
  lastError?: string | null;
  onRefresh?: () => void;
};

export default function ConnectionStatusCard({
  chatState,
  chatMode,
  connected,
  lastError,
  onRefresh,
}: Props) {
  const headerStatus = useMemo(
    () => `${chatState} ${connected ? '• Online' : '• Offline'} • Mode: ${chatMode}`,
    [chatState, chatMode, connected],
  );

  return (
    <View style={styles.container}>
      <View style={styles.textBox}>
        <Text style={styles.text} numberOfLines={2}>
          Chat Status: {headerStatus}
        </Text>
        {!!lastError && (
          <Text style={[styles.text, styles.error]} numberOfLines={2}>
            Error: {lastError}
          </Text>
        )}
      </View>
      {onRefresh ? <Button title="Refresh" onPress={onRefresh} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#111827',
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBox: { flex: 1, paddingRight: 8 },
  text: { color: '#fff', fontSize: 14, fontWeight: '600' },
  error: { color: '#fecaca' },
});
