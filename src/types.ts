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

