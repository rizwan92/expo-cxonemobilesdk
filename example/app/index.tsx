import React from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Connection } from 'expo-cxonemobilesdk';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>expo-cxonemobilesdk</Text>
        <Text style={styles.subtitle}>Sample screens</Text>
        <Link href="/chat-app" asChild>
          <Button title="Open Chat SDK Integration" onPress={() => {}} />
        </Link>
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
              await Connection.prepareWithURLs(
                'https://chat.example.com',
                'wss://socket.example.com',
                123,
                'demo'
              );
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
              const cfg = await Connection.getChannelConfigurationByURL('https://chat.example.com', 123, 'demo');
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
});
