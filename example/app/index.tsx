import React, { useState } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState('eyJraWQiOiJSeDNVeHp2VGhObFNkUkxlVDV0Z0pZTGc3YV9scDVoeW1aYmo3dnVvVnNnIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULmdzZHlnWDdYakNoQ01XSHZpMUxwRVg3eksxaUZWQzVOTzJJY3FldWlJSzQub2FyMWFneWl6d2VmQ2xqVTYwaTciLCJpc3MiOiJodHRwczovL2lkYW0uaW50ZXJuYXRpb25hbHNvcy5jb20vb2F1dGgyL2RlZmF1bHQiLCJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaWF0IjoxNzYyMzQzNTA3LCJleHAiOjE3NjIzNDUzMDcsImNpZCI6IjBvYWczNDAzbndzV01SZDZGMGk3IiwidWlkIjoiMDB1Z293eHVxc28wNFJmVVAwaTciLCJzY3AiOlsib2ZmbGluZV9hY2Nlc3MiLCJlbWFpbCIsIm9wZW5pZCIsInByb2ZpbGUiLCJkZXZpY2Vfc3NvIl0sImF1dGhfdGltZSI6MTc2MjM0MzQ5MSwic3ViIjoiRkVELW1vaGFtbWFkcml6d2FuLmNoYXVoQGludGVybmF0aW9uYWxzb3MuY29tIiwibGFzdE5hbWUiOiJDaGF1aGFuIiwiZmlyc3ROYW1lIjoiTW9oYW1tYWRSaXp3YW4iLCJvcmdhbml6YXRpb24iOiIxMjI3IiwicGFydHlJZCI6IklORF9mZjFkZjEzZi01NGIyLTQ2OTktOGM2NS0yZjRhMzdlMjRiOTEifQ.OV2mNDgobG8JdvFUspup7NqRTeNhfZtaZ0YcGrhL9BNzozG8Vn11bdXKEJ9popVAT1G7Ajzv48-FsuzyPsJLYXD31a21O1aQUAoEctHbTecySSDT-eE8xH5u960nwFzgpeOVwho5q0mckDeUjMPoJe35m9VJ3RXR8oK3_cGdQHDCE7V44WGCf4LjdQrebcADcIcCVRqbbDlHRS197O5g2r5jBjbBJs9OMjOmpeDaxUN8osWyt4Of008HV2lDmS-GygaH-wmciRfMYyXxYkwKhjIHcSUFpZa24PC_kxcnmGJmKGPaM0bLH1C5ekGUapLvFIZ3VWRybkQlWesTXqlvgQ');
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
        <Button
          title={busy ? 'Opening…' : 'Open Chat SDK'}
          onPress={async () => {
            setError(null);
            setBusy(true);
            try {
              // Do not connect here. Pass token to next screen; it will
              // prepare/connect and set identity after connection.
              const param = encodeURIComponent(authToken || '');
              router.push(`/chat-app?auth=${param}`);
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
              const cfg = await Connection.getChannelConfiguration('NA1', 123, 'demo');
              console.log(TAG, 'getChannelConfiguration ->', cfg);
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
              const cfg = await Connection.getChannelConfigurationByURL(
                'https://chat.example.com',
                123,
                'demo',
              );
              console.log(TAG, 'getChannelConfigurationByURL ->', cfg);
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
