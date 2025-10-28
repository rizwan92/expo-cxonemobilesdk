// Shared public types for expo-cxonemobilesdk

export type ChatDirection = 'toAgent' | 'toClient';

export type ChatStatus = 'sent' | 'delivered' | 'seen' | 'failed';

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
  text?: string;
  createdAt: string; // ISO timestamp from native
  createdAtMs: number; // epoch millis convenience
  direction: ChatDirection;
  status: ChatStatus;
  author?: ChatAuthor | null;
};

export type ChatMessagesPage = {
  messages: ChatMessage[];
  scrollToken: string;
  hasMore: boolean;
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
