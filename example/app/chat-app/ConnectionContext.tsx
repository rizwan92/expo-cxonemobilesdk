import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ExpoCxonemobilesdk, { Connection } from 'expo-cxonemobilesdk';
import type { ChatMode, ChatState } from 'expo-cxonemobilesdk';
import { useEvent } from 'expo';

export type ConnectionContextValue = {
  chatState: ChatState;
  chatMode: ChatMode;
  connected: boolean;
  refresh: () => void;
};

const ConnectionContext = createContext<ConnectionContextValue | undefined>(undefined);

export function ConnectionProvider({ children }: PropsWithChildren) {
  const chatUpdated = useEvent(ExpoCxonemobilesdk, 'chatUpdated');
  const [chatState, setChatState] = useState<ChatState>(Connection.getChatState());
  const [chatMode, setChatMode] = useState<ChatMode>(Connection.getChatMode());

  const refresh = useCallback(() => {
    const state = Connection.getChatState();
    setChatState(state);
    if (state === 'connected' || state === 'ready') {
      setChatMode(Connection.getChatMode());
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!chatUpdated?.state) return;
    setChatState(chatUpdated.state);
    if (chatUpdated.state === 'connected' || chatUpdated.state === 'ready') {
      setChatMode(Connection.getChatMode());
    }
  }, [chatUpdated?.state]);

  const value = useMemo<ConnectionContextValue>(() => {
    const connected = chatState === 'connected' || chatState === 'ready';
    return { chatState, chatMode, connected, refresh };
  }, [chatMode, chatState, refresh]);

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return ctx;
}
