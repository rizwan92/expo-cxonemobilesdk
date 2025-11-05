import React, { useState } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('eyJraWQiOiJSeDNVeHp2VGhObFNkUkxlVDV0Z0pZTGc3YV9scDVoeW1aYmo3dnVvVnNnIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULlZzYXpBM0YwTEVWZDFTaFNxclpEc2o0N1c2QnpxOXFRUFRpRzU5MnZ3TzQub2FyMWFoMDR4OUE0YkQzWHIwaTciLCJpc3MiOiJodHRwczovL2lkYW0uaW50ZXJuYXRpb25hbHNvcy5jb20vb2F1dGgyL2RlZmF1bHQiLCJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaWF0IjoxNzYyMzQ2MzA0LCJleHAiOjE3NjIzNDgxMDQsImNpZCI6IjBvYTVudW1tNzRPc0hvVXl6MGk3IiwidWlkIjoiMDB1Z293eHVxc28wNFJmVVAwaTciLCJzY3AiOlsiZW1haWwiLCJvZmZsaW5lX2FjY2VzcyIsInByb2ZpbGUiLCJvcGVuaWQiXSwiYXV0aF90aW1lIjoxNzYyMzQ2MjQ2LCJzdWIiOiJGRUQtbW9oYW1tYWRyaXp3YW4uY2hhdWhAaW50ZXJuYXRpb25hbHNvcy5jb20iLCJsYXN0TmFtZSI6IkNoYXVoYW4iLCJmaXJzdE5hbWUiOiJNb2hhbW1hZFJpendhbiIsIm9yZ2FuaXphdGlvbiI6IjEyMjciLCJwYXJ0eUlkIjoiSU5EX2ZmMWRmMTNmLTU0YjItNDY5OS04YzY1LTJmNGEzN2UyNGI5MSJ9.deKvEkpkCubMbfrGqV5eqg9DyVUYXCu6Nmw_q8c2ZJK3EIXNjBQe2Rjs5zmq1TImIrPA75P7EZ81MkTAJNnUHJ1S25uCSNOH-eW48omZdPdt2gOg0Jf1O2ZNde3GC875Rp5VgIz3eUxdVtA5LSu4LQyl81II35ouFz83RcKLSNFo2i1CM4vhGXL1SzOU-W0T2yQGjf_aPN4sWdTCXeH0kQK0nNMloQk3x0Y0C5hoH_3TcPBoJ9tcM-IwaxxD-4-WnUrtXt2bEmQ-XOojFR2zNbLSELO2GGoFGHhvz-4ld65qqjdJQlPMuXiEg54uNyJ2BRFFyZd6lf37Gxw9kLteJA');
  const [userId, setUserId] = useState('IND_ff1df13f-54b2-4699-8c65-2f4a37e24b91');
  const [firstName, setFirstName] = useState('MohammadRizwan');
  const [lastName, setLastName] = useState('Chauhan');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>expo-cxonemobilesdk</Text>
        <Text style={styles.subtitle}>Authenticate, connect, then open the chat UI</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste auth token"
          autoCapitalize="none"
          autoCorrect={false}
          value={authToken}
          onChangeText={setAuthToken}
        />
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
              // Do not connect here. Pass token to next screen; it will
              // prepare/connect and set identity after connection.
              const auth = encodeURIComponent(authToken || '');
              const uid = encodeURIComponent(userId || '');
              const fn = encodeURIComponent(firstName || '');
              const ln = encodeURIComponent(lastName || '');
              router.push(`/chat-app?auth=${auth}&uid=${uid}&fn=${fn}&ln=${ln}`);
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
