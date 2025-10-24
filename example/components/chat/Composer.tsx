import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

type Props = {
  onSend: (text: string) => Promise<void> | void;
  placeholder?: string;
};

export default function Composer({ onSend, placeholder = 'Type a message' }: Props) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
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

