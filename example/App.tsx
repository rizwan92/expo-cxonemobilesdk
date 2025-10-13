import ExpoCxonemobilesdk, { Connection, Customer, Analytics, Threads, CustomFields } from "expo-cxonemobilesdk";
import { useEvent } from 'expo';
import { Button, SafeAreaView, ScrollView, Text, View } from "react-native";

export default function App() {
  const TAG = "[ExpoCxonemobilesdkExample]";
  // Subscribe to key events for debugging/demo
  const chatUpdated = useEvent(ExpoCxonemobilesdk, 'chatUpdated');
  const threadsUpdated = useEvent(ExpoCxonemobilesdk, 'threadsUpdated');
  const threadUpdated = useEvent(ExpoCxonemobilesdk, 'threadUpdated');
  const agentTyping = useEvent(ExpoCxonemobilesdk, 'agentTyping');
  const customEventMessage = useEvent(ExpoCxonemobilesdk, 'customEventMessage');
  const proactivePopupAction = useEvent(ExpoCxonemobilesdk, 'proactivePopupAction');
  const errorEvent = useEvent(ExpoCxonemobilesdk, 'error');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Module API Example</Text>
        <Group name="Connection">
          <Text>Call native methods with logs</Text>
          <Text>chatUpdated: {chatUpdated ? `${chatUpdated.state}/${chatUpdated.mode}` : '—'}</Text>
          <Text>threadsUpdated: {threadsUpdated ? `${threadsUpdated.threadIds?.length ?? 0}` : '—'}</Text>
          <Text>threadUpdated: {threadUpdated ? `${threadUpdated.threadId ?? ''}` : '—'}</Text>
          <Text>agentTyping: {agentTyping ? `${agentTyping.threadId}:${agentTyping.isTyping}` : '—'}</Text>
          <Text>customEventMessage: {customEventMessage ? `${customEventMessage.base64?.slice(0, 8)}…` : '—'}</Text>
          <Text>proactivePopupAction: {proactivePopupAction ? `${proactivePopupAction.actionId}` : '—'}</Text>
          <Text>error: {errorEvent ? `${errorEvent.message}` : '—'}</Text>
          <Button
            title="prepare (env=NA1, brandId=123, channel=demo)"
            onPress={async () => {
              console.log(`${TAG} prepare pressed`);
              try {
                await Connection.prepare("NA1", 123, "demo");
                console.log(`${TAG} prepare resolved`);
              } catch (e) {
                console.error(`${TAG} prepare failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="connect"
            onPress={async () => {
              console.log(`${TAG} connect pressed`);
              try {
                await Connection.connect();
                console.log(`${TAG} connect resolved`);
              } catch (e) {
                console.error(`${TAG} connect failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="disconnect"
            onPress={() => {
              console.log(`${TAG} disconnect pressed`);
              try {
                Connection.disconnect();
                console.log(`${TAG} disconnect completed`);
              } catch (e) {
                console.error(`${TAG} disconnect failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="executeTrigger (sample UUID)"
            onPress={async () => {
              const sample = "00000000-0000-0000-0000-000000000001";
              console.log(`${TAG} executeTrigger pressed`, sample);
              try {
                await Connection.executeTrigger(sample);
                console.log(`${TAG} executeTrigger resolved`);
              } catch (e) {
                console.error(`${TAG} executeTrigger failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="getChatMode"
            onPress={() => {
              const mode = Connection.getChatMode();
              console.log(`${TAG} getChatMode ->`, mode);
            }}
          />
        </Group>

        <Group name="Customer">
          <Button
            title="Set Name (Jane Doe)"
            onPress={() => {
              console.log(`${TAG} setCustomerName pressed`);
              Customer.setName("Jane", "Doe");
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Set Identity (id=123)"
            onPress={() => {
              console.log(`${TAG} setCustomerIdentity pressed`);
              Customer.setIdentity("123", "Jane", "Doe");
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Clear Identity"
            onPress={() => {
              console.log(`${TAG} clearCustomerIdentity pressed`);
              Customer.clearIdentity();
            }}
          />
        </Group>

        <Group name="Analytics">
          <Button
            title="View Page"
            onPress={async () => {
              console.log(`${TAG} analyticsViewPage pressed`);
              try {
                await Analytics.viewPage("Home", "https://example.com/home");
                console.log(`${TAG} analyticsViewPage resolved`);
              } catch (e) {
                console.error(`${TAG} analyticsViewPage failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="View Page Ended"
            onPress={async () => {
              console.log(`${TAG} analyticsViewPageEnded pressed`);
              try {
                await Analytics.viewPageEnded("Home", "https://example.com/home");
                console.log(`${TAG} analyticsViewPageEnded resolved`);
              } catch (e) {
                console.error(`${TAG} analyticsViewPageEnded failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Chat Window Open"
            onPress={async () => {
              console.log(`${TAG} analyticsChatWindowOpen pressed`);
              try {
                await Analytics.chatWindowOpen();
                console.log(`${TAG} analyticsChatWindowOpen resolved`);
              } catch (e) {
                console.error(`${TAG} analyticsChatWindowOpen failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Conversion (purchase, 99.99)"
            onPress={async () => {
              console.log(`${TAG} analyticsConversion pressed`);
              try {
                await Analytics.conversion("purchase", 99.99);
                console.log(`${TAG} analyticsConversion resolved`);
              } catch (e) {
                console.error(`${TAG} analyticsConversion failed`, e);
              }
            }}
          />
        </Group>

        <Group name="Threads (multithread)">
          <Button
            title="List Threads"
            onPress={() => {
              const ids = Threads.list();
              console.log(`${TAG} threads`, ids);
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Create Thread"
            onPress={async () => {
              try {
                const id = await Threads.create();
                console.log(`${TAG} created thread`, id);
              } catch (e) {
                console.error(`${TAG} create thread failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Send Attachment (URL) to first thread"
            onPress={async () => {
              const ids = Threads.list();
              if (!ids.length) return console.warn(`${TAG} no threads`);
              try {
                await Threads.sendAttachmentURL(
                  ids[0],
                  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                  'application/pdf',
                  'dummy.pdf',
                  'Dummy PDF'
                );
                console.log(`${TAG} attachment sent`);
              } catch (e) {
                console.error(`${TAG} send attachment failed`, e);
              }
            }}
          />
        </Group>

        <Group name="Custom Fields">
          <Button
            title="Get Customer Fields"
            onPress={() => {
              const f = CustomFields.getCustomer();
              console.log(`${TAG} customer fields`, f);
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Set Customer Fields ({plan: gold})"
            onPress={async () => {
              try {
                await CustomFields.setCustomer({ plan: 'gold' });
                console.log(`${TAG} set customer fields done`);
              } catch (e) {
                console.error(`${TAG} set customer fields failed`, e);
              }
            }}
          />
          <View style={{ height: 8 }} />
          <Button
            title="Get/Set Thread Fields (first thread)"
            onPress={async () => {
              const ids = Threads.list();
              if (!ids.length) return console.warn(`${TAG} no threads`);
              const first = ids[0];
              const f = CustomFields.getThread(first);
              console.log(`${TAG} thread fields`, f);
              try {
                await CustomFields.setThread(first, { topic: 'support' });
                console.log(`${TAG} set thread fields done`);
              } catch (e) {
                console.error(`${TAG} set thread fields failed`, e);
              }
            }}
          />
        </Group>
        {/* Removed setValueAsync and events usage */}
        {/* View example removed */}
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#eee",
  },
  view: {
    flex: 1,
    height: 200,
  },
};
