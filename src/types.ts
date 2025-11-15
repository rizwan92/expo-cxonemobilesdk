// Shared public types for expo-cxonemobilesdk

export type ChatDirection = 'toAgent' | 'toClient';

export type MessageStatus = 'sent' | 'delivered' | 'seen' | 'failed';

export type LoggerLevel =
  | 'trace'
  | 'debug'
  | 'info'
  | 'warning'
  | 'error'
  | 'fatal'
  | 'verbose'
  | 'all'
  | 'none'
  | 'off';

export type LoggerVerbosity = 'simple' | 'medium' | 'full';

export type ChatAuthor = {
  id: number;
  firstName: string;
  surname: string;
  nickname?: string | null;
  fullName: string;
  imageUrl: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  createdAt: string; // ISO timestamp from native
  direction: ChatDirection;
  status: MessageStatus;
  authorUser?: ChatAuthor | null;
  authorEndUserIdentity?: CustomerIdentity | null;
  senderInfo?: SenderInfo | null;
  userStatistics?: UserStatistics | null;
  attachments: Attachment[];
  contentType: MessageContent;
};

export type CustomerIdentity = { id: string; firstName?: string | null; lastName?: string | null };

export type SenderInfo = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
};

export type UserStatistics = {
  seenAt?: string;
  readAt?: string;
};

export type Attachment = {
  url: string;
  friendlyName: string;
  mimeType: string;
  fileName: string;
};

export type MessagePayload = { text: string; postback?: string };
export type MessageReplyButton = {
  text: string;
  description?: string | null;
  postback?: string | null;
  iconName?: string | null;
  iconUrl?: string | null;
  iconMimeType?: string | null;
};
export type MessageQuickReplies = { title: string; buttons: MessageReplyButton[] };
export type MessageListPicker = { title: string; text: string; buttons: MessageReplyButton[] };
export type MessageRichLink = {
  title: string;
  url: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
};

export type MessageContent =
  | { type: 'text'; payload: MessagePayload }
  | { type: 'richLink'; data: MessageRichLink }
  | { type: 'quickReplies'; data: MessageQuickReplies }
  | { type: 'listPicker'; data: MessageListPicker }
  | { type: 'unknown' };

// Outbound payloads for sending
export type OutboundContentDescriptor =
  | { url: string; mimeType: string; fileName: string; friendlyName: string }
  // data should be a base64-encoded string representing the file bytes
  | { data: string; mimeType: string; fileName: string; friendlyName: string };

export type OutboundMessage = {
  text: string;
  attachments?: OutboundContentDescriptor[];
  postback?: string | null;
};

export type ChatThreadState = 'pending' | 'received' | 'loaded' | 'ready' | 'closed';

export type ChatThreadDetails = {
  id: string;
  name?: string | null;
  state: ChatThreadState | string;
  hasMoreMessagesToLoad: boolean;
  positionInQueue?: number | null;
  assignedAgent?: ChatAuthor | null;
  lastAssignedAgent?: ChatAuthor | null;
  messagesCount: number;
  customFields?: Record<string, string>;
  scrollToken?: string;
  contactId?: string | null;
  messages: ChatMessage[];
};

// Channel configuration (broad but with common fields)
export interface AllowedFileType {
  mimeType: string;
  details?: string;
}

export interface FileRestrictions {
  allowedFileSize?: number | { minKb?: number | null; maxKb?: number | null };
  isAttachmentsEnabled: boolean;
  allowedFileTypes: AllowedFileType[];
}

export type ChannelFeatures = Record<string, boolean>;

export interface ChannelConfiguration {
  hasMultipleThreadsPerEndUser: boolean;
  isProactiveChatEnabled: boolean;
  isAuthorizationEnabled: boolean;
  fileRestrictions: FileRestrictions;
  features: ChannelFeatures;
  isOnline: boolean;
  isLiveChat: boolean;
}

export type ChatMode = 'singlethread' | 'multithread' | 'liveChat' | 'unknown';

export type ChatState =
  | 'initial'
  | 'preparing'
  | 'prepared'
  | 'offline'
  | 'connecting'
  | 'connected'
  | 'ready'
  | 'closed';

export interface ProactiveActionContent {
  bodyText?: string | null;
  headlineText?: string | null;
  headlineSecondaryText?: string | null;
  image?: string | null;
}

export interface ProactiveAction {
  actionId: string;
  eventId?: string | null;
  name?: string | null;
  type?: string | null;
  content?: ProactiveActionContent | null;
  /** Android currently exposes the raw variables map supplied by the SDK. */
  variables?: Record<string, any>;
}

// Event payloads
export interface ChatUpdatedEventPayload {
  state: ChatState;
  mode: ChatMode;
}

export interface ThreadUpdatedEventPayload {
  thread: ChatThreadDetails;
}

export interface ThreadsUpdatedEventPayload {
  threads: ChatThreadDetails[];
}

export interface AgentTypingEventPayload {
  isTyping: boolean;
  threadId: string;
  agent: ChatAuthor;
}

export interface CustomEventMessagePayload {
  base64: string;
}

export interface AuthorizationChangedEventPayload {
  status: 'pending' | 'configured';
  code?: boolean;
  verifier?: boolean;
}

export interface ConnectionErrorEventPayload {
  phase: 'preflight' | 'prepare' | 'connect' | 'runtime';
  message: string;
}

export interface ErrorEventPayload {
  message: string;
}

export interface ProactivePopupActionEventPayload {
  actionId: string;
  action: ProactiveAction;
}

export interface PreChatSurvey {
  name: string;
  fields: PreChatField[];
}

export type PreChatField =
  | PreChatTextField
  | PreChatSelectField
  | PreChatHierarchicalField;

export interface PreChatFieldBase {
  id: string;
  label: string;
  required: boolean;
  value?: string | null;
}

export interface PreChatTextField extends PreChatFieldBase {
  type: 'text' | 'email';
  isEmail?: boolean | null;
}

export interface PreChatSelectField extends PreChatFieldBase {
  type: 'select';
  options: Array<{ id: string; label: string }>;
}

export interface PreChatNode {
  value: string;
  label: string;
  children: PreChatNode[];
}

export interface PreChatHierarchicalField extends PreChatFieldBase {
  type: 'hierarchical';
  nodes: PreChatNode[];
}
