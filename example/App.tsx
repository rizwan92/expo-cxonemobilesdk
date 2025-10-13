import ExpoCxonemobilesdk from "expo-cxonemobilesdk";
import { Button, SafeAreaView, ScrollView, Text, View } from "react-native";

export default function App() {
  const TAG = "[ExpoCxonemobilesdkExample]";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Module API Example</Text>
        <Group name="Prepare/Connect/Disconnect">
          <Text>Call native methods with logs</Text>
          <Button
            title="prepare (env=NA1, brandId=123, channel=demo)"
            onPress={async () => {
              console.log(`${TAG} prepare pressed`);
              try {
                await ExpoCxonemobilesdk.prepare("NA1", 123, "demo");
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
                await ExpoCxonemobilesdk.connect();
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
                ExpoCxonemobilesdk.disconnect();
                console.log(`${TAG} disconnect completed`);
              } catch (e) {
                console.error(`${TAG} disconnect failed`, e);
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
