import Native from '../ExpoCxonemobilesdkModule';
import type { ChatThreadDetails, OutboundMessage } from '../types';

const TAG = '[CXone/Thread]';

export const EVENTS = {
  UPDATED: 'threadUpdated' as const,
  AGENT_TYPING: 'agentTyping' as const,
  CONTACT_CUSTOM_FIELDS_SET: 'contactCustomFieldsSet' as const,
};

export async function load(threadId?: string) {
  console.log(TAG, 'load', threadId);
  await Native.threadsLoad(threadId);
}

export function getDetails(threadId: string): ChatThreadDetails {
  const d = Native.threadsGetDetails(threadId) as ChatThreadDetails;
  console.log(
    TAG,
    'getDetails -> id',
    d.id,
    'messages',
    d.messages.length,
    'hasMore',
    d.hasMoreMessagesToLoad,
  );
  return d;
}

export async function send(threadId: string, message: OutboundMessage) {
  console.log(TAG, 'send', {
    threadId,
    hasAttachments: !!message.attachments?.length,
    hasPostback: !!message.postback,
  });
  await (Native as any).threadsSend(threadId, message);
}

export async function loadMore(threadId: string): Promise<ChatThreadDetails> {
  console.log(TAG, 'loadMore', threadId);
  const result = await Native.threadsLoadMore(threadId);
  return result as ChatThreadDetails;
}

export async function markRead(threadId: string) {
  console.log(TAG, 'markRead', threadId);
  await Native.threadsMarkRead(threadId);
}

export async function updateName(threadId: string, name: string) {
  console.log(TAG, 'updateName', { threadId, name });
  await Native.threadsUpdateName(threadId, name);
}

export async function archive(threadId: string) {
  console.log(TAG, 'archive', threadId);
  await Native.threadsArchive(threadId);
}

export async function endContact(threadId: string) {
  console.log(TAG, 'endContact', threadId);
  await Native.threadsEndContact(threadId);
}

export async function reportTypingStart(threadId: string, didStart: boolean) {
  console.log(TAG, 'reportTypingStart', { threadId, didStart });
  await (Native as any).threadsReportTypingStart(threadId, didStart);
}

export function getCustomFields(threadId: string): Record<string, string> {
  const fields = (Native as any).threadCustomFieldsGet?.(threadId) ?? {};
  console.log(TAG, 'getCustomFields ->', { threadId, fields });
  return fields as Record<string, string>;
}

export async function updateCustomFields(threadId: string, fields: Record<string, string>) {
  console.log(TAG, 'updateCustomFields', { threadId, fields });
  await (Native as any).threadCustomFieldsSet(threadId, fields);
}

export async function sendAttachmentURL(
  threadId: string,
  url: string,
  mimeType: string,
  fileName: string,
  friendlyName: string,
) {
  console.log(TAG, 'sendAttachmentURL', {
    threadId,
    url,
    mimeType,
    fileName,
    friendlyName,
  });
  await Native.threadsSendAttachmentURL(threadId, url, mimeType, fileName, friendlyName);
}

export async function sendAttachmentBase64(
  threadId: string,
  base64: string,
  mimeType: string,
  fileName: string,
  friendlyName: string,
) {
  console.log(TAG, 'sendAttachmentBase64', {
    threadId,
    mimeType,
    fileName,
    friendlyName,
  });
  await Native.threadsSendAttachmentBase64(threadId, base64, mimeType, fileName, friendlyName);
}
