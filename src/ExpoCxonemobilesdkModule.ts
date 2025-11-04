import { NativeModule, requireNativeModule } from 'expo';
import type { ChatThreadDetails, OutboundMessage } from './types';

import { ExpoCxonemobilesdkModuleEvents } from './ExpoCxonemobilesdk.types';

declare class ExpoCxonemobilesdkModule extends NativeModule<ExpoCxonemobilesdkModuleEvents> {
  // Android-first convenience that preflights, prepares and connects, returns final state
  prepareAndConnect(env: string, brandId: number, channelId: string): Promise<string>;
  prepare(env: string, brandId: number, channelId: string): Promise<void>;
  prepareWithURLs(
    chatURL: string,
    socketURL: string,
    brandId: number,
    channelId: string,
  ): Promise<void>;
  connect(): Promise<void>;
  disconnect(): void;
  getChatMode(): 'singlethread' | 'multithread' | 'liveChat' | 'unknown';
  getChatState():
    | 'initial'
    | 'preparing'
    | 'prepared'
    | 'offline'
    | 'connecting'
    | 'connected'
    | 'ready'
    | 'closed';
  isConnected(): boolean;
  executeTrigger(triggerId: string): Promise<void>;
  getChannelConfiguration(
    env: string,
    brandId: number,
    channelId: string,
  ): Promise<Record<string, any>>;
  getChannelConfigurationByURL(
    chatURL: string,
    brandId: number,
    channelId: string,
  ): Promise<Record<string, any>>;
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
  threadsGet(): ChatThreadDetails[];
  threadsCreate(customFields?: Record<string, string>): Promise<ChatThreadDetails>;
  threadsLoad(threadId?: string): Promise<void>;
  threadsGetDetails(threadId: string): ChatThreadDetails;
  threadsSend(threadId: string, message: OutboundMessage): Promise<void>;
  threadsLoadMore(threadId: string): Promise<void>;
  threadsMarkRead(threadId: string): Promise<void>;
  threadsUpdateName(threadId: string, name: string): Promise<void>;
  threadsArchive(threadId: string): Promise<void>;
  threadsEndContact(threadId: string): Promise<void>;
  threadsReportTypingStart(threadId: string, didStart: boolean): Promise<void>;
  threadsSendAttachmentURL(
    threadId: string,
    url: string,
    mimeType: string,
    fileName: string,
    friendlyName: string,
  ): Promise<void>;
  threadsSendAttachmentBase64(
    threadId: string,
    base64: string,
    mimeType: string,
    fileName: string,
    friendlyName: string,
  ): Promise<void>;
  customerCustomFieldsGet(): Record<string, string>;
  customerCustomFieldsSet(fields: Record<string, string>): Promise<void>;
  threadCustomFieldsGet(threadId: string): Record<string, string>;
  threadCustomFieldsSet(threadId: string, fields: Record<string, string>): Promise<void>;
  signOut(): void;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoCxonemobilesdkModule>('ExpoCxonemobilesdk');
