import { NativeModule, requireNativeModule } from 'expo';
import type {
  ChatThreadDetails,
  OutboundMessage,
  ChannelConfiguration,
  PreChatSurvey,
  ChatMode,
  ChatState,
} from './types';

import { ExpoCxonemobilesdkModuleEvents } from './ExpoCxonemobilesdk.types';

declare class ExpoCxonemobilesdkModule extends NativeModule<ExpoCxonemobilesdkModuleEvents> {
  // Combined connection entry (Android & iOS)
  prepareAndConnect(env: string, brandId: number, channelId: string): Promise<void>;
  // Optional URL-based combined variant (iOS)
  prepareAndConnectWithURLs?(
    chatURL: string,
    socketURL: string,
    brandId: number,
    channelId: string,
  ): Promise<void>;
  disconnect(): void;
  getChatMode(): ChatMode;
  getChatState(): ChatState;
  isConnected(): boolean;
  executeTrigger(triggerId: string): Promise<void>;
  getChannelConfiguration(
    env: string,
    brandId: number,
    channelId: string,
  ): Promise<ChannelConfiguration>;
  getChannelConfigurationByURL(
    chatURL: string,
    brandId: number,
    channelId: string,
  ): Promise<ChannelConfiguration>;
  setCustomerName(firstName: string, lastName: string): void;
  setCustomerIdentity(id: string, firstName?: string, lastName?: string): void;
  clearCustomerIdentity(): void;
  setDeviceToken(token: string): void;
  setAuthorizationCode(code: string): void;
  setCodeVerifier(verifier: string): void;
  getVisitorId(): string | null;
  getCustomerIdentity(): { id: string; firstName?: string | null; lastName?: string | null } | null;
  analyticsViewPage(title: string, url: string): Promise<void>;
  analyticsViewPageEnded(title: string, url: string): Promise<void>;
  analyticsChatWindowOpen(): Promise<void>;
  analyticsConversion(type: string, value: number): Promise<void>;
  threadsGetPreChatSurvey(): PreChatSurvey | null;
  threadsGet(): ChatThreadDetails[];
  threadsCreate(customFields?: Record<string, string>): Promise<ChatThreadDetails>;
  threadsLoad(threadId?: string): Promise<void>;
  threadsGetDetails(threadId: string): ChatThreadDetails;
  threadsSend(threadId: string, message: OutboundMessage): Promise<void>;
  threadsLoadMore(threadId: string): Promise<ChatThreadDetails | void>;
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
