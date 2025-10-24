import React from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee', justifyContent: 'center' },
  card: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
});
