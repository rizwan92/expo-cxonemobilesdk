import type {
  ChatThreadDetails,
  ChatAuthor,
  ProactiveAction,
  ChatMode,
  ChatState,
} from './types';

export type ExpoCxonemobilesdkModuleEvents = {
  chatUpdated: (params: { state: ChatState; mode: ChatMode }) => void;
  threadUpdated: (params: { thread: ChatThreadDetails }) => void;
  threadsUpdated: (params: { threads: ChatThreadDetails[] }) => void;
  agentTyping: (params: { isTyping: boolean; threadId: string; agent: ChatAuthor }) => void;
  unexpectedDisconnect: () => void;
  customEventMessage: (params: { base64: string }) => void;
  contactCustomFieldsSet: () => void;
  customerCustomFieldsSet: () => void;
  authorizationChanged: (params: { status: 'pending' | 'configured'; code?: boolean; verifier?: boolean }) => void;
  connectionError: (params: { phase: 'preflight' | 'prepare' | 'connect' | 'runtime'; message: string }) => void;
  error: (params: { message: string }) => void;
  tokenRefreshFailed: () => void;
  proactivePopupAction: (params: { actionId: string; action: ProactiveAction }) => void;
};
