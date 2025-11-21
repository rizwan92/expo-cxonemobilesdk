import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Button, StyleSheet } from 'react-native';
import ExpoCxonemobilesdk, { Connection, Threads, Thread, Customer, Analytics } from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';

const initialEnv = process.env.EXPO_PUBLIC_CHAT_ENV ?? '';
const initialBrandId = process.env.EXPO_PUBLIC_CHAT_BRAND_ID ?? '';
const initialChannelId = process.env.EXPO_PUBLIC_CHAT_CHANNEL_ID ?? '';

export default function ChatScreen() {
  const TAG = '[ChatScreen]';
  const chatUpdated = useEvent(ExpoCxonemobilesdk, Connection.EVENTS.CHAT_UPDATED);
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, Threads.EVENTS.UPDATED);
  const proactivePopup = useEvent(ExpoCxonemobilesdk, Connection.EVENTS.PROACTIVE_POPUP);
  const agentTyping = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.AGENT_TYPING);
  const customEventMessage = useEvent(ExpoCxonemobilesdk, Connection.EVENTS.CUSTOM_EVENT_MESSAGE);
  const unexpectedDisconnect = useEvent(ExpoCxonemobilesdk, Connection.EVENTS.UNEXPECTED_DISCONNECT);
  const tokenRefreshFailed = useEvent(ExpoCxonemobilesdk, Connection.EVENTS.TOKEN_REFRESH_FAILED);
  const contactFieldsSet = useEvent(ExpoCxonemobilesdk, Thread.EVENTS.CONTACT_CUSTOM_FIELDS_SET);
  const customerFieldsSet = useEvent(ExpoCxonemobilesdk, Customer.EVENTS.CUSTOM_FIELDS_SET);
  const [chatState, setChatState] = useState<string>('initial');
  const connected = chatState === 'connected' || chatState === 'ready';
  const [env, setEnv] = useState(initialEnv);
  const [brandId, setBrandId] = useState(initialBrandId);
  const [channelId, setChannelId] = useState(initialChannelId);
  const [triggerId, setTriggerId] = useState('00000000-0000-0000-0000-000000000001');

  // Threads state
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('Hello from Expo');
  const [typing, setTyping] = useState(false);
  const [threadName, setThreadName] = useState('New Thread Name');
  const [eventLogs, setEventLogs] = useState<string[]>([]);

  // Attachment state
  const [attUrl, setAttUrl] = useState(
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  );
  const [attMime, setAttMime] = useState('application/pdf');
  const [attFile, setAttFile] = useState('dummy.pdf');
  const [attFriendly, setAttFriendly] = useState('Dummy PDF');
  const [attBase64, setAttBase64] = useState('');

  // Customer/OAuth
  const [firstName, setFirstName] = useState('Jane');
  const [lastName, setLastName] = useState('Doe');
  const [customerId, setCustomerId] = useState('123');
  const [deviceToken, setDeviceToken] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [codeVerifier, setCodeVerifier] = useState('');

  // Custom fields
  const [customerFieldsJson, setCustomerFieldsJson] = useState('{"plan":"gold"}');
  const [threadFieldsJson, setThreadFieldsJson] = useState('{"topic":"support"}');

  // Analytics
  const [pageTitle, setPageTitle] = useState('Home');
  const [pageUrl, setPageUrl] = useState('https://example.com/home');
  const [convType, setConvType] = useState('purchase');
  const [convValue, setConvValue] = useState('99.99');

  const mode = useMemo(
    () => (connected ? Connection.getChatMode() : (chatUpdated?.mode as any) ?? 'unknown'),
    [connected, threadsUpdated, chatUpdated]
  );

  // Keep local state in sync with native events
  useEffect(() => {
    if (chatUpdated?.state) setChatState(chatUpdated.state);
  }, [chatUpdated?.state]);

  const appendLog = useCallback((msg: string) => {
    setEventLogs((prev) => [msg, ...prev].slice(0, 10));
  }, []);

  useEffect(() => {
    if (!agentTyping) return;
    const agentName =
      agentTyping.agent?.fullName ||
      agentTyping.agent?.nickname ||
      agentTyping.agent?.firstName ||
      'Agent';
    appendLog(
      `[agentTyping] ${agentName} ${agentTyping.isTyping ? 'started' : 'stopped'} (${agentTyping.threadId})`,
    );
  }, [agentTyping?.threadId, agentTyping?.isTyping, appendLog]);

  useEffect(() => {
    if (!customEventMessage?.base64) return;
    appendLog(`[customEventMessage] payload ${customEventMessage.base64.length} bytes`);
  }, [customEventMessage?.base64, appendLog]);

  useEffect(() => {
    if (!unexpectedDisconnect) return;
    appendLog('[unexpectedDisconnect] Socket closed unexpectedly, reconnect required.');
  }, [unexpectedDisconnect, appendLog]);

  useEffect(() => {
    if (!tokenRefreshFailed) return;
    appendLog('[tokenRefreshFailed] Native token refresh failed.');
  }, [tokenRefreshFailed, appendLog]);

  useEffect(() => {
    if (!contactFieldsSet) return;
    appendLog('[contactCustomFieldsSet] Thread custom fields updated.');
  }, [contactFieldsSet, appendLog]);

  useEffect(() => {
    if (!customerFieldsSet) return;
    appendLog('[customerCustomFieldsSet] Customer custom fields updated.');
  }, [customerFieldsSet, appendLog]);

  useEffect(() => {
    if (!proactivePopup?.action) return;
    appendLog(`[proactivePopupAction] ${proactivePopup.action.name ?? proactivePopup.actionId}`);
  }, [proactivePopup?.action, appendLog]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.header}>Connection</Text>
          <Row label="Environment">
            <TextInput
              style={styles.input}
              value={env}
              onChangeText={setEnv}
              autoCapitalize="characters"
            />
          </Row>
          <Row label="Brand ID">
            <TextInput
              style={styles.input}
              value={brandId}
              onChangeText={setBrandId}
              keyboardType="number-pad"
            />
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
          <View style={styles.spacer} />
          <Text style={styles.meta}>Mode: {mode}</Text>
          <Text style={styles.meta}>State: {chatState}</Text>
          <Text style={styles.meta}>Connected: {String(connected)}</Text>
          <Text style={styles.meta}>
            chatUpdated: {chatUpdated ? `${chatUpdated.state}/${chatUpdated.mode}` : '—'}
          </Text>
          <Text style={styles.meta}>
            threadsUpdated: {threadsUpdated ? `${threadsUpdated.threads.length}` : '—'}
          </Text>
          <Text style={styles.meta}>
            proactivePopup: {proactivePopup ? `${proactivePopup.action.name ?? proactivePopup.action.actionId}` : '—'}
          </Text>
          <Row label="Trigger ID">
            <TextInput style={styles.input} value={triggerId} onChangeText={setTriggerId} />
          </Row>
          <Button
            title="Execute Trigger"
            onPress={async () => {
              await Connection.executeTrigger(triggerId);
            }}
          />
          <View style={styles.spacer} />
          <Button title="Sign Out" onPress={() => Connection.signOut()} />
        </View>

        <View style={styles.card}>
          <Text style={styles.header}>Threads</Text>
          <Button
            title="List Threads"
            disabled={!connected}
            onPress={() => {
              const ids = Threads.get().map((t) => t.id);
              console.log(TAG, 'threads', ids);
              if (ids.length) setActiveThread(ids[0]);
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Create Thread"
            disabled={!connected}
            onPress={async () => {
              const details = await Threads.create();
              console.log(TAG, 'created thread id', details.id);
              setActiveThread(details.id);
            }}
          />
          <Text style={styles.meta}>Active thread: {activeThread ?? '—'}</Text>
          <Row label="Message">
            <TextInput style={styles.input} value={messageText} onChangeText={setMessageText} />
          </Row>
          <Button
            title="Send Text"
            onPress={async () => {
              if (!activeThread) return;
              await Thread.send(activeThread, { text: messageText });
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Load More"
            onPress={async () => {
              if (!activeThread) return;
              await Thread.loadMore(activeThread);
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Mark Read"
            onPress={async () => {
              if (activeThread) await Thread.markRead(activeThread);
            }}
          />
          <View style={styles.spacer} />
          <Row label="Typing">
            <Button
              title={typing ? 'Stop' : 'Start'}
              onPress={async () => {
                if (!activeThread) return;
                await Thread.reportTypingStart(activeThread, !typing);
                setTyping(!typing);
              }}
            />
          </Row>
          <Row label="Thread Name">
            <TextInput style={styles.input} value={threadName} onChangeText={setThreadName} />
          </Row>
          <Button
            title="Update Name"
            onPress={async () => {
              if (activeThread) await Thread.updateName(activeThread, threadName);
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Archive"
            onPress={async () => {
              if (activeThread) await Thread.archive(activeThread);
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="End Contact"
            onPress={async () => {
              if (activeThread) await Thread.endContact(activeThread);
            }}
          />
          <View style={styles.spacer} />
          <Text style={styles.subheader}>Attachments</Text>
          <Row label="URL">
            <TextInput style={styles.input} value={attUrl} onChangeText={setAttUrl} />
          </Row>
          <Row label="MIME">
            <TextInput style={styles.input} value={attMime} onChangeText={setAttMime} />
          </Row>
          <Row label="File Name">
            <TextInput style={styles.input} value={attFile} onChangeText={setAttFile} />
          </Row>
          <Row label="Friendly">
            <TextInput style={styles.input} value={attFriendly} onChangeText={setAttFriendly} />
          </Row>
          <Button
            title="Send Attachment (URL)"
            onPress={async () => {
              if (!activeThread) return;
              await Thread.sendAttachmentURL(activeThread, attUrl, attMime, attFile, attFriendly);
            }}
          />
          <View style={styles.spacer} />
          <Row label="Base64">
            <TextInput
              style={styles.input}
              value={attBase64}
              onChangeText={setAttBase64}
              placeholder="Paste base64 data"
            />
          </Row>
          <Button
            title="Send Attachment (Base64)"
            onPress={async () => {
              if (!activeThread || !attBase64) return;
              await Thread.sendAttachmentBase64(
                activeThread,
                attBase64,
                attMime,
                attFile,
                attFriendly,
              );
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.header}>Customer & OAuth</Text>
          <Row label="First Name">
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
          </Row>
          <Row label="Last Name">
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
          </Row>
          <Button title="Set Name" onPress={() => Customer.setName(firstName, lastName)} />
          <View style={styles.spacer} />
          <Row label="Customer ID">
            <TextInput style={styles.input} value={customerId} onChangeText={setCustomerId} />
          </Row>
          <Button
            title="Set Identity"
            onPress={() => Customer.setIdentity(customerId, firstName, lastName)}
          />
          <View style={styles.spacer} />
          <Button title="Clear Identity" onPress={() => Customer.clearIdentity()} />
          <View style={styles.spacer} />
          <Row label="Device Token">
            <TextInput style={styles.input} value={deviceToken} onChangeText={setDeviceToken} />
          </Row>
          <Button title="Set Device Token" onPress={() => Customer.setDeviceToken(deviceToken)} />
          <View style={styles.spacer} />
          <Row label="Auth Code">
            <TextInput style={styles.input} value={authCode} onChangeText={setAuthCode} />
          </Row>
          <Button title="Set Auth Code" onPress={() => Customer.setAuthorizationCode(authCode)} />
          <View style={styles.spacer} />
          <Row label="Code Verifier">
            <TextInput style={styles.input} value={codeVerifier} onChangeText={setCodeVerifier} />
          </Row>
          <Button
            title="Set Code Verifier"
            onPress={() => Customer.setCodeVerifier(codeVerifier)}
          />
          <Text style={styles.meta}>Visitor ID: {Customer.getVisitorId() ?? '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.header}>Custom Fields</Text>
          <Row label="Customer (JSON)">
            <TextInput
              style={styles.input}
              value={customerFieldsJson}
              onChangeText={setCustomerFieldsJson}
            />
          </Row>
          <Button
            title="Set Customer Fields"
            onPress={async () => {
              try {
                const obj = JSON.parse(customerFieldsJson || '{}');
                await Customer.setCustomFields(obj);
              } catch (e) {
                console.warn(e);
              }
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Get Customer Fields"
            onPress={() => console.log(TAG, 'customer fields', Customer.getCustomFields())}
          />
          <View style={styles.spacer} />
          <Row label="Thread (JSON)">
            <TextInput
              style={styles.input}
              value={threadFieldsJson}
              onChangeText={setThreadFieldsJson}
            />
          </Row>
          <Button
            title="Set Thread Fields"
            onPress={async () => {
              if (!activeThread) return;
              try {
                const obj = JSON.parse(threadFieldsJson || '{}');
                await Thread.updateCustomFields(activeThread, obj);
              } catch (e) {
                console.warn(e);
              }
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Get Thread Fields"
            onPress={() => {
              if (activeThread) console.log(TAG, 'thread fields', Thread.getCustomFields(activeThread));
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.header}>Analytics</Text>
          <Row label="Title">
            <TextInput style={styles.input} value={pageTitle} onChangeText={setPageTitle} />
          </Row>
          <Row label="URL">
            <TextInput style={styles.input} value={pageUrl} onChangeText={setPageUrl} />
          </Row>
          <Button
            title="View Page"
            onPress={async () => {
              await Analytics.viewPage(pageTitle, pageUrl);
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="View Page Ended"
            onPress={async () => {
              await Analytics.viewPageEnded(pageTitle, pageUrl);
            }}
          />
          <View style={styles.spacer} />
          <Button
            title="Chat Window Open"
            onPress={async () => {
              await Analytics.chatWindowOpen();
            }}
          />
          <View style={styles.spacer} />
          <Row label="Conv Type">
            <TextInput style={styles.input} value={convType} onChangeText={setConvType} />
          </Row>
          <Row label="Conv Value">
            <TextInput
              style={styles.input}
              value={convValue}
              onChangeText={setConvValue}
              keyboardType="decimal-pad"
            />
          </Row>
          <Button
            title="Conversion"
            onPress={async () => {
              const v = Number(convValue) || 0;
              await Analytics.conversion(convType, v);
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.header}>Events (debug)</Text>
          {eventLogs.length === 0 ? (
            <Text style={styles.meta}>No events yet.</Text>
          ) : (
            eventLogs.map((log, index) => (
              <Text key={`${log}-${index}`} style={styles.meta}>
                {log}
              </Text>
            ))
          )}
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
  subheader: { fontSize: 16, fontWeight: '500', marginTop: 12, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { width: 120, fontSize: 14, color: '#555' },
  input: { backgroundColor: '#f2f2f2', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  spacer: { height: 8 },
  meta: { fontSize: 12, color: '#777', marginTop: 8 },
});
