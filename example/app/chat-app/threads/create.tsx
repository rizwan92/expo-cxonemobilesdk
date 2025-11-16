import React, { useCallback, useEffect, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Threads, Thread } from 'expo-cxonemobilesdk';
import type { PreChatField, PreChatNode, PreChatSurvey } from 'expo-cxonemobilesdk';
import { useConnection } from '../../components/ConnectionContext';

export default function CreateThreadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ threadId?: string }>();
  const editingThreadId = typeof params.threadId === 'string' ? params.threadId : null;
  const isEditing = Boolean(editingThreadId);
  const { connected } = useConnection();
  const [survey, setSurvey] = useState<PreChatSurvey | null>(null);
  const [loadingSurvey, setLoadingSurvey] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [existingFields, setExistingFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    if (!connected) {
      setSurvey(null);
      setAnswers({});
      setTitle('');
      setExistingFields({});
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
        const existing =
          isEditing && editingThreadId ? Thread.getCustomFields(editingThreadId) : {};
        if (isCancelled) return;
        setExistingFields(existing);
        if (isCancelled) return;
        setSurvey(result);
        setTitle(isEditing ? existing.title ?? '' : '');
        if (result) {
          const seed: Record<string, string> = {};
          for (const field of result.fields) {
            const existingValue = existing[field.id];
            if (existingValue !== undefined) {
              seed[field.id] = existingValue;
            } else if (field.value) {
              seed[field.id] = field.value;
            }
          }
          setAnswers(seed);
        } else if (isEditing) {
          const copy = { ...existing };
          delete copy.title;
          setAnswers(copy);
        } else {
          setAnswers({});
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
      const payload: Record<string, string> = isEditing ? { ...existingFields } : {};
      const trimmedTitle = title.trim();
      if (trimmedTitle) {
        payload.title = trimmedTitle;
      } else if (isEditing) {
        delete payload.title;
      }
      if (survey) {
        for (const field of survey.fields) {
          const value = answers[field.id] ?? field.value ?? '';
          if (value) payload[field.id] = value;
          else if (isEditing) delete payload[field.id];
        }
      }
      if (isEditing && editingThreadId) {
        if (trimmedTitle) {
          await Thread.updateName(editingThreadId, trimmedTitle);
        }
        await Thread.updateCustomFields(editingThreadId, payload);
        router.replace(`/chat-app/thread/${editingThreadId}`);
      } else {
        const details = await Threads.create(payload);
        if (trimmedTitle) {
          await Thread.updateName(details.id, trimmedTitle);
        }
        router.replace(`/chat-app/thread/${details.id}`);
      }
    } catch (e) {
      setError(String((e as any)?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }, [answers, router, submitting, survey, title, validate, isEditing, editingThreadId, existingFields]);

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
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {isEditing ? 'Edit Thread Details' : survey?.name ?? 'Thread Details'}
            </Text>
            {isEditing && editingThreadId && (
              <Text style={styles.meta}>Updating thread {editingThreadId}</Text>
            )}
            <View style={styles.formItem}>
              <Text style={styles.label}>Thread Title (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Describe your case or subject"
                value={title}
                onChangeText={setTitle}
              />
              <Text style={styles.helper}>
                Stored as a thread custom field and shown in the list if provided.
              </Text>
            </View>
            {survey ? (
              survey.fields.map((field) => (
                <View key={field.id} style={styles.formItem}>
                  <Text style={styles.label}>
                    {field.label}
                    {field.required ? ' *' : ''}
                  </Text>
                  {renderField(field)}
                </View>
              ))
            ) : (
              <Text style={styles.meta}>No pre-chat survey is configured for this channel.</Text>
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.meta}>Connect first to load the pre-chat form.</Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button
          title={isEditing ? (submitting ? 'Saving…' : 'Update Thread') : submitting ? 'Starting…' : 'Start Chat'}
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
  helper: { fontSize: 12, color: '#6b7280' },
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
