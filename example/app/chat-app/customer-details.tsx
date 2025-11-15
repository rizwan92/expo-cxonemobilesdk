import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
} from 'react-native';
import ExpoCxonemobilesdk, { Customer } from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';

export default function CustomerDetailsScreen() {
  const customFieldsUpdated = useEvent(
    ExpoCxonemobilesdk,
    Customer.EVENTS.CUSTOM_FIELDS_SET,
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFields = useCallback(() => {
    try {
      const current = Customer.getCustomFields();
      setFields(current ?? {});
    } catch (e) {
      console.error('[CustomerDetails] load fields failed', e);
      setError(String((e as any)?.message ?? e));
    }
  }, []);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  useEffect(() => {
    if (customFieldsUpdated) {
      loadFields();
    }
  }, [customFieldsUpdated, loadFields]);

  const handleSave = useCallback(async () => {
    if (!keyInput.trim()) {
      Alert.alert('Field key required', 'Please enter a field key before saving.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const trimmedKey = keyInput.trim();
      const updated = { ...fields, [trimmedKey]: valueInput };
      await Customer.setCustomFields(updated);
      setFields(updated);
      setKeyInput('');
      setValueInput('');
    } catch (e) {
      console.error('[CustomerDetails] setCustomFields failed', e);
      setError(String((e as any)?.message ?? e));
    } finally {
      setSaving(false);
    }
  }, [fields, keyInput, valueInput]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Customer Custom Fields</Text>
        <Button title="Refresh" onPress={loadFields} />
        {error ? <Text style={styles.error}>Error: {error}</Text> : null}
        <View style={styles.fieldsCard}>
          {Object.keys(fields).length === 0 ? (
            <Text style={styles.meta}>No custom fields set.</Text>
          ) : (
            Object.entries(fields).map(([key, value]) => (
              <View key={key} style={styles.fieldRow}>
                <Text style={styles.fieldKey}>{key}</Text>
                <Text style={styles.fieldValue}>{value}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.editorCard}>
          <Text style={styles.sectionTitle}>Update Fields</Text>
          <TextInput
            style={styles.input}
            placeholder="Field key"
            value={keyInput}
            onChangeText={setKeyInput}
            autoCapitalize="none"
          />
          <View style={{ height: 8 }} />
          <TextInput
            style={styles.input}
            placeholder="Field value"
            value={valueInput}
            onChangeText={setValueInput}
          />
          <View style={{ height: 12 }} />
          <Button title={saving ? 'Saving…' : 'Save Field'} onPress={handleSave} disabled={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  scroll: { padding: 16, gap: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  fieldsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 8 },
  editorCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldKey: { fontWeight: '600', color: '#111' },
  fieldValue: { color: '#374151' },
  meta: { color: '#6b7280' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: { color: '#b91c1c', marginVertical: 8 },
});

