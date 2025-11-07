import { Stack } from 'expo-router';
import React from 'react';
import { ConnectionProvider } from './chat-app/ConnectionContext';

export default function RootLayout() {
  return (
    <ConnectionProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="chat" options={{ title: 'CXone Chat SDK' }} />
        <Stack.Screen name="chat-app/index" options={{ title: 'Chat' }} />
        <Stack.Screen name="chat-app/threads/index" options={{ title: 'Threads' }} />
        <Stack.Screen name="chat-app/threads/create" options={{ title: 'Create Thread' }} />
        <Stack.Screen name="chat-app/thread/[threadId]" options={{ title: 'Thread' }} />
      </Stack>
    </ConnectionProvider>
  );
}
