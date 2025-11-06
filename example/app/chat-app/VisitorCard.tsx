import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import ExpoCxonemobilesdk, { Customer } from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';

type Props = { connected: boolean };

export default function VisitorCard({ connected }: Props) {
  const authorizationChanged = useEvent(ExpoCxonemobilesdk, 'authorizationChanged');
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<
    { id: string; firstName?: string | null; lastName?: string | null } | null
  >(null);

  const load = useCallback(() => {
    if (!connected) return;
    setVisitorId(Customer.getVisitorId());
    // iOS returns real identity; Android returns last set (cached)
    // If not available, null -> UI shows placeholder
    const ident = (Customer as any).getIdentity?.();
    setIdentity(ident ?? null);
  }, [connected]);

  // Initial load once connected
  useEffect(() => {
    if (connected) load();
  }, [connected, load]);

  // Reload identity when auth updates (often precedes/affects identity)
  useEffect(() => {
    if (authorizationChanged && connected) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizationChanged?.status, connected]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Visitor</Text>
      <Button title="Refresh Visitor" onPress={load} />
      <View style={{ height: 8 }} />
      <Text style={styles.meta}>Visitor ID: {visitorId ?? '—'}</Text>
      {identity ? (
        <Text style={styles.meta}>
          Identity: {identity.id}
          {identity.firstName ? `, ${identity.firstName}` : ''}
          {identity.lastName ? ` ${identity.lastName}` : ''}
        </Text>
      ) : (
        <Text style={styles.meta}>Identity: —</Text>
      )}
      <Text style={styles.meta}>
        Authorization:
        {authorizationChanged
          ? ` ${authorizationChanged.status}${authorizationChanged.code ? ' • code' : ''}${
              authorizationChanged.verifier ? ' • verifier' : ''
            }`
          : ' —'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  meta: { color: '#555' },
});

