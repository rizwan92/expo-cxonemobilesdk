import { useCallback, useEffect, useState } from 'react';
import { useEvent } from 'expo';
import * as Connection from '../api/connection';
import ExpoCxonemobilesdk from '../ExpoCxonemobilesdkModule';

export type UseConnectionOptions = {
  attempts?: number;
  intervalMs?: number;
};

export function useConnectionStatus(options: UseConnectionOptions = {}) {
  const attempts = options.attempts ?? 3;
  const intervalMs = options.intervalMs ?? 1000;

  // Event-driven updates from native
  const chat = useEvent(ExpoCxonemobilesdk, 'chatUpdated');

  // Local state reflecting current connection status
  const [connected, setConnected] = useState<boolean>(() => Connection.isConnected());
  const [chatState, setChatState] = useState<string>(() => Connection.getChatState());
  const [checking, setChecking] = useState(false);

  // Keep state in sync when native emits updates
  useEffect(() => {
    if (chat) {
      setChatState(chat.state);
      setConnected(chat.state === 'connected' || chat.state === 'ready');
    }
  }, [chat?.state]);

  const refresh = useCallback(() => {
    const st = Connection.getChatState();
    const is = Connection.isConnected();
    setChatState(st);
    setConnected(is);
  }, []);

  const connectAndSync = useCallback(async () => {
    setChecking(true);
    try {
      const before = Connection.getChatState();
      const already = before === 'connected' || before === 'ready';
      const connecting = before === 'connecting';

      if (!already && !connecting) {
        await Connection.connect();
      }
    } catch (e) {
      // Surface but do not throw; hook continues polling state
      // eslint-disable-next-line no-console
      console.error('[useConnectionStatus] connect failed', e);
    }

    for (let i = 0; i < attempts; i++) {
      // Poll with delay between checks
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, intervalMs));
      const is = Connection.isConnected();
      const st = Connection.getChatState();
      setChatState(st);
      setConnected(is);
      if (is) break;
    }
    setChecking(false);
  }, [attempts, intervalMs]);

  return { connected, chatState, checking, refresh, connectAndSync };
}

