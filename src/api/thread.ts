import Native from '../ExpoCxonemobilesdkModule';
import type { ChatThreadDetails, OutboundMessage } from '../types';

export const EVENTS = {
  UPDATED: 'threadUpdated' as const,
  AGENT_TYPING: 'agentTyping' as const,
  CONTACT_CUSTOM_FIELDS_SET: 'contactCustomFieldsSet' as const,
};

export async function load(threadId?: string) {
  await Native.threadsLoad(threadId);
}

export function getDetails(threadId: string): ChatThreadDetails {
  return Native.threadsGetDetails(threadId) as ChatThreadDetails;
}

export async function send(threadId: string, message: OutboundMessage) {
  await (Native as any).threadsSend(threadId, message);
}

export async function loadMore(threadId: string): Promise<ChatThreadDetails> {
  const result = (await Native.threadsLoadMore(threadId)) as ChatThreadDetails | void;
  if (result) return result;
  return getDetails(threadId);
}

export async function markRead(threadId: string) {
  await Native.threadsMarkRead(threadId);
}

export async function updateName(threadId: string, name: string) {
  await Native.threadsUpdateName(threadId, name);
}

export async function archive(threadId: string) {
  await Native.threadsArchive(threadId);
}

export async function endContact(threadId: string) {
  await Native.threadsEndContact(threadId);
}

export async function reportTypingStart(threadId: string, didStart: boolean) {
  await (Native as any).threadsReportTypingStart(threadId, didStart);
}

export function getCustomFields(threadId: string): Record<string, string> {
  const fields = (Native as any).threadCustomFieldsGet?.(threadId) ?? {};
  return fields as Record<string, string>;
}

export async function updateCustomFields(threadId: string, fields: Record<string, string>) {
  await (Native as any).threadCustomFieldsSet(threadId, fields);
}

export async function sendAttachmentURL(
  threadId: string,
  url: string,
  mimeType: string,
  fileName: string,
  friendlyName: string,
) {
  await Native.threadsSendAttachmentURL(threadId, url, mimeType, fileName, friendlyName);
}

export async function sendAttachmentBase64(
  threadId: string,
  base64: string,
  mimeType: string,
  fileName: string,
  friendlyName: string,
) {
  await Native.threadsSendAttachmentBase64(threadId, base64, mimeType, fileName, friendlyName);
}
