import React, { useMemo } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useConnection } from './ConnectionContext';

type Props = {
  lastError?: string | null;
  onRefresh?: () => void;
};

export default function ConnectionStatusCard({ lastError, onRefresh }: Props) {
  const { chatState, chatMode, connected, refresh } = useConnection();
  const handleRefresh = onRefresh ?? refresh;
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
      {handleRefresh ? <Button title="Refresh" onPress={handleRefresh} /> : null}
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
