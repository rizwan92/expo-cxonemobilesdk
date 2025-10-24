import { NativeModule, requireNativeModule } from "expo";
import type { ChatMessage, ChatThreadDetails } from './types';

import { ExpoCxonemobilesdkModuleEvents } from "./ExpoCxonemobilesdk.types";

declare class ExpoCxonemobilesdkModule extends NativeModule<ExpoCxonemobilesdkModuleEvents> {
  prepare(env: string, brandId: number, channelId: string): Promise<void>;
  connect(): Promise<void>;
  disconnect(): void;
  getChatMode(): 'singlethread' | 'multithread' | 'liveChat' | 'unknown';
  getChatState(): 'initial' | 'preparing' | 'prepared' | 'offline' | 'connecting' | 'connected' | 'ready' | 'closed';
  isConnected(): boolean;
  executeTrigger(triggerId: string): Promise<void>;
  setCustomerName(firstName: string, lastName: string): void;
  setCustomerIdentity(id: string, firstName?: string, lastName?: string): void;
  clearCustomerIdentity(): void;
  setDeviceToken(token: string): void;
  setAuthorizationCode(code: string): void;
  setCodeVerifier(verifier: string): void;
  getVisitorId(): string | null;
  analyticsViewPage(title: string, url: string): Promise<void>;
  analyticsViewPageEnded(title: string, url: string): Promise<void>;
  analyticsChatWindowOpen(): Promise<void>;
  analyticsConversion(type: string, value: number): Promise<void>;
  threadsList(): string[];
  threadsCreate(customFields?: Record<string, string>): Promise<ChatThreadDetails>;
  threadsLoad(threadId?: string): Promise<void>;
  threadsListDetails(): ChatThreadDetails[];
  threadsListDetailsLimited(limit: number): ChatThreadDetails[];
  threadsGetDetails(threadId: string): ChatThreadDetails;
  threadsGetDetailsLimited(threadId: string, limit: number): ChatThreadDetails;
  threadsSendText(threadId: string, text: string, postback?: string): Promise<void>;
  threadsLoadMore(threadId: string): Promise<void>;
  threadsMarkRead(threadId: string): Promise<void>;
  threadsUpdateName(threadId: string, name: string): Promise<void>;
  threadsArchive(threadId: string): Promise<void>;
  threadsEndContact(threadId: string): Promise<void>;
  threadsTyping(threadId: string, isTyping: boolean): Promise<void>;
  threadsSendAttachmentURL(threadId: string, url: string, mimeType: string, fileName: string, friendlyName: string): Promise<void>;
  threadsSendAttachmentBase64(threadId: string, base64: string, mimeType: string, fileName: string, friendlyName: string): Promise<void>;
  threadsGetMessages(threadId: string): ChatMessage[];
  threadsGetMessagesLimited(threadId: string, limit: number): ChatMessage[];
  threadsEnsureMessages(threadId: string, minCount: number): Promise<ChatMessage[]>;
  threadsGetMessagesLimited(threadId: string, limit: number): ChatMessage[];
  customerCustomFieldsGet(): Record<string, string>;
  customerCustomFieldsSet(fields: Record<string, string>): Promise<void>;
  threadCustomFieldsGet(threadId: string): Record<string, string>;
  threadCustomFieldsSet(threadId: string, fields: Record<string, string>): Promise<void>;
  signOut(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoCxonemobilesdkModule>(
  "ExpoCxonemobilesdk"
);
