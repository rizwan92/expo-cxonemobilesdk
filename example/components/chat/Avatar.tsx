import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type Props = {
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
};

export default function Avatar({ name, imageUrl, size = 32 }: Props) {
  const initials = (name || '')
    .split(' ')
    .map((s) => s.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.text}>{initials || 'A'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#111827', fontWeight: '600' },
});
