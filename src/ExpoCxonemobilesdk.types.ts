import type {
  ChatUpdatedEventPayload,
  ThreadUpdatedEventPayload,
  ThreadsUpdatedEventPayload,
  AgentTypingEventPayload,
  CustomEventMessagePayload,
  AuthorizationChangedEventPayload,
  ConnectionErrorEventPayload,
  ErrorEventPayload,
  ProactivePopupActionEventPayload,
} from './types';

export type ExpoCxonemobilesdkModuleEvents = {
  chatUpdated: (params: ChatUpdatedEventPayload) => void;
  threadUpdated: (params: ThreadUpdatedEventPayload) => void;
  threadsUpdated: (params: ThreadsUpdatedEventPayload) => void;
  agentTyping: (params: AgentTypingEventPayload) => void;
  unexpectedDisconnect: () => void;
  customEventMessage: (params: CustomEventMessagePayload) => void;
  contactCustomFieldsSet: () => void;
  customerCustomFieldsSet: () => void;
  authorizationChanged: (params: AuthorizationChangedEventPayload) => void;
  connectionError: (params: ConnectionErrorEventPayload) => void;
  error: (params: ErrorEventPayload) => void;
  tokenRefreshFailed: () => void;
  proactivePopupAction: (params: ProactivePopupActionEventPayload) => void;
};
