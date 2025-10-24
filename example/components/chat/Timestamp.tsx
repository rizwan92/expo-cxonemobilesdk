import React from 'react';
import { Text, TextStyle } from 'react-native';

function formatTime(ms?: number) {
  let date: Date;
  if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
    date = new Date(ms);
  } else {
    date = new Date();
  }
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function Timestamp({ ms, style }: { ms?: number; style?: TextStyle }) {
  return <Text style={style}>{formatTime(ms)}</Text>;
}

