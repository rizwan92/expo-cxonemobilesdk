import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';
import ExpoCxonemobilesdk, { Connection, Threads, Customer } from 'expo-cxonemobilesdk';
import { USERS, AGENTS } from './profiles';
import type { ChatThreadDetails } from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';
import { useConnectionStatus } from '../useConnectionStatus';
import { CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID } from './config';

export default function ChatAppHome() {
  const router = useRouter();
  const chatUpdated = useEvent(ExpoCxonemobilesdk, 'chatUpdated');
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, 'threadsUpdated');
  const errorEvent = useEvent(ExpoCxonemobilesdk, 'error');
  const { connected, chatState, checking, connectAndSync, refresh } = useConnectionStatus({ attempts: 5, intervalMs: 800 });

  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [threadList, setThreadList] = useState<ChatThreadDetails[]>([]);
  const [prepareDone, setPrepareDone] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'singlethread' | 'multithread' | 'liveChat' | 'unknown'>(
    () => Connection.getChatMode()
  );
  const [starting, setStarting] = useState(false);
  const [selectedUser, setSelectedUser] = useState(USERS[0]);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);

  // Prepare + connect on open, depending on current state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const st = Connection.getChatState();
        if (st === 'ready' || st === 'connected') {
          if (cancelled) return;
          setPrepareDone(true);
          refresh();
          return;
        }

        if (st === 'prepared') {
          if (cancelled) return;
          setPrepareDone(true);
          await connectAndSync();
          return;
        }

        await Connection.prepare(CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID);
        if (cancelled) return;
        setPrepareDone(true);
        await connectAndSync();
      } catch (e) {
        console.error('[ChatAppHome] prepare/connect failed', e);
        setLastError(String((e as any)?.message ?? e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load visitor id and thread list
  const reload = useCallback(() => {
    setVisitorId(Customer.getVisitorId());
    setThreadList(Threads.listDetails());
    setChatMode(Connection.getChatMode());
  }, []);

  useEffect(() => { reload(); }, [prepareDone, chatUpdated?.state, threadsUpdated?.threadIds?.length]);

  // Surface native error events in UI status
  useEffect(() => {
    if (errorEvent?.message) setLastError(errorEvent.message);
  }, [errorEvent?.message]);

  const headerStatus = useMemo(
    () => `${chatState} ${connected ? '• Online' : '• Offline'} • Mode: ${chatMode}`,
    [chatState, connected, chatMode]
  );

  const isMultithread = chatMode === 'multithread';
  const startSingleThread = useCallback(async () => {
    setLastError(null);
    setStarting(true);
    try {
      // Ensure connected before trying to load
      const st = Connection.getChatState();
      if (!(st === 'connected' || st === 'ready')) {
        await connectAndSync();
      }

      // Ask native to load the default thread (nil)
      await Threads.load();

      // Poll for a thread to appear
      for (let i = 0; i < 6; i++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 500));
        const list = Threads.listDetails();
        setThreadList(list);
        if (list.length > 0) {
          router.push(`/chat-app/thread/${list[0].id}`);
          break;
        }
      }
    } catch (e) {
      setLastError(String((e as any)?.message ?? e));
    } finally {
      setStarting(false);
    }
  }, [connectAndSync, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextBox}>
          <Text style={styles.headerText} numberOfLines={2}>Chat Status: {headerStatus}</Text>
          {!!lastError && (
            <Text style={[styles.headerText, styles.headerError]} numberOfLines={2}>
              Error: {lastError}
            </Text>
          )}
        </View>
        <Button title="Refresh" onPress={() => { setLastError(null); refresh(); reload(); }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Profiles</Text>
        <Text style={styles.meta}>Select Customer</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
          {USERS.map((u) => (
            <TouchableOpacity
              key={u.id}
              onPress={async () => {
                try {
                  // Fully reset session and set identity BEFORE prepare/connect
                  await Connection.signOut();

                  setSelectedUser(u);
                  Customer.setIdentity(u.id, u.firstName, u.lastName);
                  Customer.setName(u.firstName, u.lastName);
                  setVisitorId(Customer.getVisitorId());

                  await Connection.prepare(CHAT_ENV, CHAT_BRAND_ID, CHAT_CHANNEL_ID);
                  await connectAndSync();
                } catch (e) {
                  setLastError(String((e as any)?.message ?? e));
                }
              }}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: selectedUser.id === u.id ? '#111827' : '#e5e7eb' }}
            >
              <Text style={{ color: selectedUser.id === u.id ? '#fff' : '#111827' }}>{u.firstName} {u.lastName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.meta, { marginTop: 8 }]}>Preferred Agent (optional)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
          {AGENTS.map((a) => (
            <TouchableOpacity
              key={a.id}
              onPress={() => setSelectedAgent(a)}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: selectedAgent.id === a.id ? '#111827' : '#e5e7eb' }}
            >
              <Text style={{ color: selectedAgent.id === a.id ? '#fff' : '#111827' }}>{a.fullName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Visitor</Text>
        <Text style={styles.meta}>Visitor ID: {visitorId ?? '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Threads</Text>
        {!isMultithread && (
          <Button
            title={starting ? 'Starting…' : 'Start Chat'}
            onPress={startSingleThread}
          />
        )}
        {!isMultithread && (
          <Text style={[styles.meta, { marginTop: 8 }]}>This channel is {chatMode}. Use Start Chat to open the single active thread.</Text>
        )}

        <View style={{ height: 8 }} />
        <Button
          title={isMultithread ? 'Create New Thread' : 'Create New Thread (unsupported in this mode)'}
          disabled={!isMultithread}
          onPress={async () => {
            try {
              // Ensure connected/ready before creating
              const st = Connection.getChatState();
              if (!(st === 'connected' || st === 'ready')) {
                await connectAndSync();
              }
              const details = await Threads.create({ requestedAgentId: selectedAgent.id, requestedAgentName: selectedAgent.fullName, startedByUserId: selectedUser.id });
              setThreadList(Threads.listDetails());
              router.push(`/chat-app/thread/${details.id}`);
            } catch (e) {
              setLastError(String((e as any)?.message ?? e));
            }
          }}
        />
        <FlatList
          data={threadList}
          keyExtractor={(t) => t.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.thread}
              onPress={() => router.push(`/chat-app/thread/${item.id}`)}
            >
              <Text style={styles.threadText}>{item.name && item.name.length ? item.name : item.id}</Text>
              <Text style={styles.meta}>
                State: {String(item.state)} • Messages: {item.messagesCount ?? item.messages?.length ?? 0} • More: {String(item.hasMoreMessagesToLoad)}
              </Text>
              {item.assignedAgent?.fullName ? (
                <Text style={styles.meta}>Agent: {item.assignedAgent.fullName}</Text>
              ) : item.lastAssignedAgent?.fullName ? (
                <Text style={styles.meta}>Last Agent: {item.lastAssignedAgent.fullName}</Text>
              ) : null}
              {typeof item.scrollToken === 'string' && (
                <Text style={styles.meta}>Scroll: {item.scrollToken.length > 16 ? `${item.scrollToken.slice(0, 16)}…` : item.scrollToken}</Text>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.meta}>No threads yet.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 12 },
  header: { padding: 12, backgroundColor: '#111827', borderRadius: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTextBox: { flex: 1, paddingRight: 8 },
  headerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  headerError: { color: '#fecaca' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  meta: { color: '#555' },
  thread: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 10 },
  threadText: { color: '#111827' },
});
