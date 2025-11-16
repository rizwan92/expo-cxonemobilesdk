import React from 'react';
import { Text, StyleSheet } from 'react-native';

type Props = {
  status?: 'sent' | 'delivered' | 'seen' | 'failed';
};

export default function StatusTicks({ status }: Props) {
  if (!status) return null;
  switch (status) {
    case 'sent':
      return <Text style={[styles.tick, styles.gray]}>✓</Text>;
    case 'delivered':
      return <Text style={[styles.tick, styles.gray]}>✓✓</Text>;
    case 'seen':
      return <Text style={[styles.tick, styles.green]}>✓✓</Text>;
    case 'failed':
      return <Text style={[styles.tick, styles.red]}>✓</Text>;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  tick: { fontSize: 11, marginLeft: 4 },
  gray: { color: '#9ca3af' },
  green: { color: '#10b981' },
  red: { color: '#ef4444' },
});
