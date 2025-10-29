// Shared public types for expo-cxonemobilesdk

export type ChatDirection = 'toAgent' | 'toClient';

export type MessageStatus = 'sent' | 'delivered' | 'seen' | 'failed';

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
  attachments?: Attachment[];
  contentType?: MessageContent;
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
  seenAtMs?: number;
  readAt?: string;
  readAtMs?: number;
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
export type MessageRichLink = { title: string; url: string; fileName: string; fileUrl: string; mimeType: string };

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
  messagesCount?: number;
  scrollToken?: string;
  messages?: ChatMessage[];
};

// Broad JSON for channel configuration as returned by native SDK
export type ChannelConfiguration = Record<string, any>;
