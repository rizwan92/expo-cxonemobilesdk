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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEvent } from 'expo';
import ExpoCxonemobilesdk, { Connection, Threads } from 'expo-cxonemobilesdk';
import type { PreChatField, PreChatNode, PreChatSurvey } from 'expo-cxonemobilesdk';
import ThreadsCard from '../ThreadsCard';

export default function ThreadListScreen() {
  const router = useRouter();
  const chatUpdated = useEvent(ExpoCxonemobilesdk, 'chatUpdated');
  const [chatState, setChatState] = useState(Connection.getChatState());
  const [chatMode, setChatMode] = useState(Connection.getChatMode());

  const connected = useMemo(
    () => chatState === 'connected' || chatState === 'ready',
    [chatState],
  );

  const [survey, setSurvey] = useState<PreChatSurvey | null>(null);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(() => {
    const state = Connection.getChatState();
    setChatState(state);
    if (state === 'connected' || state === 'ready') {
      setChatMode(Connection.getChatMode());
    }
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  useEffect(() => {
    if (!chatUpdated?.state) return;
    setChatState(chatUpdated.state);
    if (chatUpdated.state === 'connected' || chatUpdated.state === 'ready') {
      setChatMode(Connection.getChatMode());
    }
  }, [chatUpdated?.state]);

  useEffect(() => {
    if (!connected) return;
    let isCancelled = false;
    (async () => {
      try {
        setLoadingSurvey(true);
        const result = await Threads.getPreChatSurvey();
        if (!isCancelled) {
          setSurvey(result);
          setAnswers((prev) => {
            if (!result) return prev;
            const seed: Record<string, string> = {};
            for (const field of result.fields) {
              if (field.value) seed[field.id] = field.value;
            }
            return { ...seed, ...prev };
          });
        }
      } catch (e) {
        if (!isCancelled) {
          setError(String((e as any)?.message ?? e));
        }
      } finally {
        if (!isCancelled) setLoadingSurvey(false);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [connected]);


  console.log(JSON.stringify(survey, null, 2));

  const status = useMemo(
    () => `${chatState} ${connected ? '• Online' : '• Offline'} • Mode: ${chatMode}`,
    [chatState, connected, chatMode],
  );

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

  const handleCreate = useCallback(async () => {
    if (!connected) return;
    if (submitting) return;

    const fieldErrors: string[] = [];
    const payload: Record<string, string> = {};
    const fieldList = survey?.fields ?? [];

    for (const field of fieldList) {
      const value = answers[field.id] ?? field.value ?? '';
      if (field.required && !value) {
        fieldErrors.push(`${field.label} is required`);
      }
      if (value) {
        payload[field.id] = value;
      }
    }

    if (fieldErrors.length) {
      setError(fieldErrors.join('\n'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const details = await Threads.create(payload);
      router.push(`/chat-app/thread/${details.id}`);
    } catch (e) {
      setError(String((e as any)?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }, [answers, connected, router, submitting, survey?.fields]);

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
              {field.options.map((option) => {
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
    [answers, flattenNodes, updateAnswer],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerText}>Thread List</Text>
          <Text style={styles.meta}>{status}</Text>
          <Button title="Refresh" onPress={refreshState} />
        </View>

        {survey ? (
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
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button
              title={submitting ? 'Starting…' : 'Start Chat'}
              onPress={handleCreate}
              disabled={!connected || submitting || loadingSurvey}
            />
          </View>
        ) : (
          <View style={styles.form}> 
            <Text style={styles.meta}>
              {loadingSurvey
                ? 'Loading pre-chat survey...'
                : 'No pre-chat survey is configured for this channel.'}
            </Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button
              title={submitting ? 'Starting…' : 'Start Chat'}
              onPress={handleCreate}
              disabled={!connected || submitting}
            />
          </View>
        )}

        <ThreadsCard connected={connected} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 12 },
  header: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
  },
  headerText: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  meta: { color: '#555', marginBottom: 8 },
  form: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  formItem: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
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
  error: {
    color: '#b91c1c',
    marginBottom: 12,
  },
});
