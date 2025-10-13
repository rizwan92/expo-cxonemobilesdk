export type ExpoCxonemobilesdkModuleEvents = {
  chatUpdated: (params: { state: string; mode: string }) => void;
  threadUpdated: (params: { threadId?: string }) => void;
  threadsUpdated: (params: { threadIds: string[] }) => void;
  agentTyping: (params: { isTyping: boolean; threadId: string }) => void;
  unexpectedDisconnect: () => void;
  customEventMessage: (params: { base64: string }) => void;
  contactCustomFieldsSet: () => void;
  customerCustomFieldsSet: () => void;
  error: (params: { message: string }) => void;
  tokenRefreshFailed: () => void;
  proactivePopupAction: (params: { actionId: string; data: Record<string, any> }) => void;
};
