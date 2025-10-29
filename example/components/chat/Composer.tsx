import React, { useMemo, useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

type Props = {
  onSend: (text: string) => Promise<void> | void;
  placeholder?: string;
  value?: string; // optional controlled value
  onChangeText?: (text: string) => void; // required if value is provided
};

export default function Composer({ onSend, placeholder = 'Type a message', value, onChangeText }: Props) {
  const isControlled = typeof value === 'string' && typeof onChangeText === 'function';
  const [inner, setInner] = useState('');
  const text = isControlled ? (value as string) : inner;
  const setText = isControlled ? (onChangeText as (t: string) => void) : setInner;
  const [sending, setSending] = useState(false);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      // In controlled mode, parent updates value; do not clear here.
      if (!isControlled) setInner('');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        autoCorrect
        autoCapitalize="sentences"
        editable={!sending}
      />
      <Button title={sending ? 'Sending…' : 'Send'} onPress={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#ddd', backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
});
