import React from 'react';
import { Text, TextStyle } from 'react-native';

type Props = {
  ms?: number;
  style?: TextStyle;
  variant?: 'time' | 'full';
};

function formatTime(ms?: number, variant: 'time' | 'full' = 'time') {
  let date: Date;
  if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
    date = new Date(ms);
  } else {
    date = new Date();
  }
  if (variant === 'full') {
    // Full local timestamp with seconds, 24h
    try {
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      } as any);
    } catch {
      const yyyy = String(date.getFullYear());
      const MM = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
    }
  }
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function Timestamp({ ms, style, variant = 'time' }: Props) {
  return <Text style={style}>{formatTime(ms, variant)}</Text>;
}
