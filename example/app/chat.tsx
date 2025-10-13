import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Button, StyleSheet } from 'react-native';
import ExpoCxonemobilesdk, { Connection, Threads } from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';

export default function ChatScreen() {
  const TAG = '[ChatScreen]';
  const chatUpdated = useEvent(ExpoCxonemobilesdk, 'chatUpdated');
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, 'threadsUpdated');
  const [env, setEnv] = useState('NA1');
  const [brandId, setBrandId] = useState('123');
  const [channelId, setChannelId] = useState('demo');

  const mode = useMemo(() => Connection.getChatMode(), [threadsUpdated, chatUpdated]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.header}>Connection</Text>
          <Row label="Environment">
            <TextInput style={styles.input} value={env} onChangeText={setEnv} autoCapitalize="characters" />
          </Row>
          <Row label="Brand ID">
            <TextInput style={styles.input} value={brandId} onChangeText={setBrandId} keyboardType="number-pad" />
          </Row>
          <Row label="Channel ID">
            <TextInput style={styles.input} value={channelId} onChangeText={setChannelId} />
          </Row>
          <Button
            title="Prepare"
            onPress={async () => {
              console.log(TAG, 'prepare');
              await Connection.prepare(env, Number(brandId), channelId);
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Connect"
            onPress={async () => {
              console.log(TAG, 'connect');
              await Connection.connect();
            }}
          />
          <View style={styles.spacer} />
          <Button title="Disconnect" onPress={() => Connection.disconnect()} />
          <Text style={styles.meta}>Mode: {mode}</Text>
          <Text style={styles.meta}>chatUpdated: {chatUpdated ? `${chatUpdated.state}/${chatUpdated.mode}` : '—'}</Text>
          <Text style={styles.meta}>threadsUpdated: {threadsUpdated ? `${threadsUpdated.threadIds?.length ?? 0}` : '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.header}>Threads</Text>
          <Button
            title="List Threads"
            onPress={() => {
              const ids = Threads.list();
              console.log(TAG, 'threads', ids);
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Create Thread"
            onPress={async () => {
              const id = await Threads.create();
              console.log(TAG, 'created thread', id);
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee' },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16 },
  header: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { width: 120, fontSize: 14, color: '#555' },
  input: { backgroundColor: '#f2f2f2', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  spacer: { height: 8 },
  meta: { fontSize: 12, color: '#777', marginTop: 8 },
});

