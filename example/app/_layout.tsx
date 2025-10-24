import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
        <Stack>
          <Stack.Screen name="index" options={{ title: "Home" }} />
          <Stack.Screen name="chat" options={{ title: "CXone Chat SDK" }} />
          <Stack.Screen name="chat-app/index" options={{ title: "Chat" }} />
        <Stack.Screen
          name="chat-app/thread/[threadId]"
          options={{ title: "Thread" }}
          />
      </Stack>
  );
}
