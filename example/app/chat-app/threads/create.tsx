import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Threads } from 'expo-cxonemobilesdk';
import type { PreChatField, PreChatNode, PreChatSurvey } from 'expo-cxonemobilesdk';
import { useConnection } from '../ConnectionContext';

export default function CreateThreadScreen() {
  const router = useRouter();
  const { connected } = useConnection();
  const [survey, setSurvey] = useState<PreChatSurvey | null>(null);
  const [loadingSurvey, setLoadingSurvey] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (!connected) {
      setSurvey(null);
      setAnswers({});
      setLoadingSurvey(false);
      return () => {
        isCancelled = true;
      };
    }
    (async () => {
      try {
        setLoadingSurvey(true);
        const result = await Threads.getPreChatSurvey();
        if (isCancelled) return;
        setSurvey(result);
        if (result) {
          const seed: Record<string, string> = {};
          for (const field of result.fields) {
            if (field.value) seed[field.id] = field.value;
          }
          setAnswers(seed);
        }
      } catch (e) {
        if (!isCancelled) setError(String((e as any)?.message ?? e));
      } finally {
        if (!isCancelled) setLoadingSurvey(false);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [connected]);

  const updateAnswer = useCallback((fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const flattenNodes = useCallback((nodes: PreChatNode[], depth = 0): Array<{ id: string; label: string }> => {
    return nodes.flatMap((node) => {
      const prefix = depth > 0 ? `${'· '.repeat(depth)}` : '';
      const current = [{ id: node.value, label: `${prefix}${node.label}` }];
      return current.concat(flattenNodes(node.children, depth + 1));
    });
  }, []);

  const sortedOptions = useCallback((field: PreChatField) => {
    if (field.type !== 'select') return [];
    return [...field.options].sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const validate = useCallback(() => {
    if (!survey) return [];
    const errors: string[] = [];
    for (const field of survey.fields) {
      const value = answers[field.id] ?? field.value ?? '';
      if (field.required && !value) {
        errors.push(`${field.label} is required`);
      }
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${field.label} must be a valid email`);
        }
      }
    }
    return errors;
  }, [answers, survey]);

  const handleCreate = useCallback(async () => {
    if (submitting || !connected) return;
    const errors = validate();
    if (errors.length) {
      setError(errors.join('\n'));
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const payload: Record<string, string> = {};
      if (survey) {
        for (const field of survey.fields) {
          const value = answers[field.id] ?? field.value ?? '';
          if (value) payload[field.id] = value;
        }
      }
      const details = await Threads.create(payload);
      router.replace(`/chat-app/thread/${details.id}`);
    } catch (e) {
      setError(String((e as any)?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }, [answers, router, submitting, survey, validate]);

  const renderField = useCallback(
    (field: PreChatField) => {
      const value = answers[field.id] ?? field.value ?? '';
      switch (field.type) {
        case 'text':
        case 'email':
          return (
            <TextInput
              key={field.id}
              style={styles.input}
              value={value}
              onChangeText={(text) => updateAnswer(field.id, text)}
              placeholder={field.label}
              keyboardType={field.type === 'email' ? 'email-address' : 'default'}
              autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
            />
          );
        case 'select':
          return (
            <View key={field.id} style={styles.optionGroup}>
              {sortedOptions(field).map((option) => {
                const selected = value === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                    onPress={() => updateAnswer(field.id, option.id)}
                  >
                    <Text style={selected ? styles.optionSelectedText : styles.optionText}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        case 'hierarchical':
          return (
            <View key={field.id} style={styles.optionGroup}>
              {flattenNodes(field.nodes).map((option) => {
                const selected = value === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                    onPress={() => updateAnswer(field.id, option.id)}
                  >
                    <Text style={selected ? styles.optionSelectedText : styles.optionText}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        default:
          return null;
      }
    },
    [answers, flattenNodes, sortedOptions, updateAnswer],
  );

  if (loadingSurvey) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.meta}>Loading pre-chat survey…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {connected ? (
          survey ? (
            <View style={styles.form}>
              <Text style={styles.formTitle}>{survey.name}</Text>
              {survey.fields.map((field) => (
                <View key={field.id} style={styles.formItem}>
                  <Text style={styles.label}>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </Text>
                  {renderField(field)}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.meta}>No pre-chat survey is configured for this channel.</Text>
            </View>
          )
        ) : (
          <View style={styles.form}>
            <Text style={styles.meta}>Connect first to load the pre-chat form.</Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button
          title={submitting ? 'Starting…' : 'Start Chat'}
          onPress={handleCreate}
          disabled={submitting || !connected}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  content: { padding: 16, gap: 16 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f5f7',
  },
  form: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 12,
  },
  formTitle: { fontSize: 18, fontWeight: '600' },
  formItem: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  optionText: {
    color: '#1f2937',
  },
  optionButtonSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  optionSelectedText: {
    color: '#f9fafb',
  },
  meta: { color: '#555' },
  error: { color: '#b91c1c', textAlign: 'center' },
});
