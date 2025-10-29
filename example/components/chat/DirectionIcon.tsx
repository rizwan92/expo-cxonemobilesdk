import React from 'react';
import { Text, StyleSheet } from 'react-native';

type Direction = 'toAgent' | 'toClient';

export default function DirectionIcon({ direction }: { direction: Direction }) {
  switch (direction) {
    case 'toAgent':
      return <Text style={[styles.text, styles.toAgent]}>→ Agent</Text>;
    case 'toClient':
      return <Text style={[styles.text, styles.toClient]}>→ You</Text>;
    default:
      return null as any;
  }
}

const styles = StyleSheet.create({
  text: { fontSize: 11, marginRight: 6 },
  toAgent: { color: '#6b7280' }, // gray
  toClient: { color: '#10b981' }, // green
});
