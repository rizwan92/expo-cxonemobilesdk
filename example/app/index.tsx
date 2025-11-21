import React, { useState } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Connection, Customer } from 'expo-cxonemobilesdk';
import { useConnection } from './components/ConnectionContext';
import ConnectionStatusCard from './components/ConnectionStatusCard';
import { CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID } from './config/chat';

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState('101');
  const [firstName, setFirstName] = useState('rizwan1');
  const [lastName, setLastName] = useState('Chauhan1');
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connected, refresh } = useConnection();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <ConnectionStatusCard />
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
                Customer.setIdentity(
                  trimmedId,
                  trimmedFirst || undefined,
                  trimmedLast || undefined,
                );

                router.push('/chat-app');
              } catch (e) {
                setError(String((e as any)?.message ?? e));
              } finally {
                setBusy(false);
              }
            }}
          />
          <View style={{ height: 12 }} />
          <View style={styles.inlineButtons}>
            <View style={{ flex: 1 }}>
              <Button
                title={connecting ? 'Connecting…' : 'Quick Connect'}
                onPress={async () => {
                  setError(null);
                  setConnecting(true);
                  try {
                    await Connection.prepare(CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID);
                    await Connection.connect();
                    refresh();
                  } catch (e) {
                    console.error('[Home] quick connect failed', e);
                    setError(String((e as any)?.message ?? e));
                  } finally {
                    setConnecting(false);
                  }
                }}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Button
                color="#dc2626"
                title={disconnecting ? 'Disconnecting…' : 'Disconnect'}
                onPress={() => {
                  setError(null);
                  setDisconnecting(true);
                  try {
                    Connection.disconnect();
                    Connection.signOut();
                    Customer.clearIdentity();
                    refresh();
                  } catch (e) {
                    console.error('[Home] quick disconnect failed', e);
                    setError(String((e as any)?.message ?? e));
                  } finally {
                    setDisconnecting(false);
                  }
                }}
              />
            </View>
          </View>
          <View style={{ height: 12 }} />
          <Button
            color="#7c3aed"
            title={signingOut ? 'Signing out…' : 'Sign Out'}
            onPress={() => {
              setError(null);
              setSigningOut(true);
              try {
                Connection.signOut();
                Customer.clearIdentity();
                refresh();
              } catch (e) {
                console.error('[Home] signOut failed', e);
                setError(String((e as any)?.message ?? e));
              } finally {
                setSigningOut(false);
              }
            }}
          />
          {!!error && <Text style={[styles.subtitle, { color: '#b91c1c' }]}>Error: {error}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Quick API Demo</Text>
          <Text style={styles.subtitle}>Prepare and fetch channel configuration</Text>
          <View style={{ height: 8 }} />
          <Button title="Open Legacy Demo" onPress={() => router.push('/chat')} />
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
          <View style={{ height: 12 }} />
          <Text style={styles.subtitle}>Logger presets</Text>
          <Button
            title="Verbose Logs"
            onPress={() => Connection.configureLogger('debug', 'full')}
          />
          <View style={{ height: 8 }} />
          <Button title="Info Logs" onPress={() => Connection.configureLogger('info', 'medium')} />
          <View style={{ height: 8 }} />
          <Button
            title="Disable Logs"
            onPress={() => Connection.configureLogger('none', 'simple')}
          />
        </View>
      </ScrollView>
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
  inlineButtons: { flexDirection: 'row' },
});
