import React, { useState } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Connection, Customer } from 'expo-cxonemobilesdk';
import { useConnection } from '../components/ConnectionContext';
import ConnectionStatusCard from '../components/ConnectionStatusCard';

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState('IND_ff1df13f-54b2-4699-8c65-2f4a37e24b91');
  const [firstName, setFirstName] = useState('MohammadRizwan');
  const [lastName, setLastName] = useState('Chauhan');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { chatState, chatMode, connected, refresh } = useConnection();

  return (
    <SafeAreaView style={styles.container}>
      <ConnectionStatusCard
        chatState={chatState}
        chatMode={chatMode}
        connected={connected}
        onRefresh={refresh}
      />
      <View style={styles.card}>
        <Text style={styles.title}>expo-cxonemobilesdk</Text>
        <Text style={styles.subtitle}>Authenticate, connect, then open the chat UI</Text>
        <View style={{ height: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Customer ID"
          autoCapitalize="none"
          autoCorrect={false}
          value={userId}
          onChangeText={setUserId}
        />
        <View style={{ height: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="First Name"
          autoCapitalize="none"
          autoCorrect={false}
          value={firstName}
          onChangeText={setFirstName}
        />
        <View style={{ height: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          autoCapitalize="none"
          autoCorrect={false}
          value={lastName}
          onChangeText={setLastName}
        />
        <View style={{ height: 8 }} />
        <Button
          title={busy ? 'Opening…' : 'Open Chat SDK'}
          onPress={async () => {
            setError(null);
            setBusy(true);
            try {
              const trimmedId = userId.trim();
              if (!trimmedId) {
                throw new Error('Customer ID is required');
              }
              const trimmedFirst = firstName.trim();
              const trimmedLast = lastName.trim();

              // Ensure the native SDK forgets the previous visitor before setting a new one.
              Connection.disconnect();
              Connection.signOut();
              Customer.clearIdentity();
              Customer.setIdentity(trimmedId, trimmedFirst || undefined, trimmedLast || undefined);

              router.push('/chat-app');
            } catch (e) {
              setError(String((e as any)?.message ?? e));
            } finally {
              setBusy(false);
            }
          }}
        />
        {!!error && <Text style={[styles.subtitle, { color: '#b91c1c' }]}>Error: {error}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Quick API Demo</Text>
        <Text style={styles.subtitle}>Prepare and fetch channel configuration</Text>
        <View style={{ height: 8 }} />
        <Button
          title="prepareWithURLs (sample URLs)"
          onPress={async () => {
            const TAG = '[Home]';
            console.log(TAG, 'prepareWithURLs pressed');
            try {
              // await Connection.prepareWithURLs(
              //   'https://chat.example.com',
              //   'wss://socket.example.com',
              //   123,
              //   'demo',
              // );
              console.log(TAG, 'prepareWithURLs resolved');
            } catch (e) {
              console.error(TAG, 'prepareWithURLs failed', e);
            }
          }}
        />
        <View style={{ height: 8 }} />
        <Button
          title="getChannelConfiguration (env)"
          onPress={async () => {
            const TAG = '[Home]';
            console.log(TAG, 'getChannelConfiguration pressed');
            try {
              // const cfg = await Connection.getChannelConfiguration('NA1', 123, 'demo');
              // console.log(TAG, 'getChannelConfiguration ->', cfg);
            } catch (e) {
              console.error(TAG, 'getChannelConfiguration failed', e);
            }
          }}
        />
        <View style={{ height: 8 }} />
        <Button
          title="getChannelConfigurationByURL (URL)"
          onPress={async () => {
            const TAG = '[Home]';
            console.log(TAG, 'getChannelConfigurationByURL pressed');
            try {
              // const cfg = await Connection.getChannelConfigurationByURL(
              //   'https://chat.example.com',
              //   123,
              //   'demo',
              // );
              // console.log(TAG, 'getChannelConfigurationByURL ->', cfg);
            } catch (e) {
              console.error(TAG, 'getChannelConfigurationByURL failed', e);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee', justifyContent: 'center' },
  card: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  input: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
