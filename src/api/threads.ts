import Native from '../ExpoCxonemobilesdkModule';
import type { ChatMessage } from '../types';

const TAG = '[CXone/Threads]';

export function list(): string[] {
  const ids = Native.threadsList();
  console.log(TAG, 'list ->', ids);
  return ids;
}

export async function create(customFields?: Record<string, string>): Promise<string> {
  console.log(TAG, 'create', customFields ?? '(no custom fields)');
  try {
    const id = await Native.threadsCreate(customFields);
    console.log(TAG, 'create ->', id);
    return id;
  } catch (e) {
    console.error(TAG, 'create failed', e);
    throw e;
  }
}

export async function load(threadId?: string) {
  console.log(TAG, 'load', threadId);
  await Native.threadsLoad(threadId);
}

export async function sendText(threadId: string, text: string, postback?: string) {
  console.log(TAG, 'sendText', { threadId, text, postback });
  await Native.threadsSendText(threadId, text, postback);
}

export async function loadMore(threadId: string) {
  console.log(TAG, 'loadMore', threadId);
  await Native.threadsLoadMore(threadId);
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

export async function typing(threadId: string, isTyping: boolean) {
  console.log(TAG, 'typing', { threadId, isTyping });
  await Native.threadsTyping(threadId, isTyping);
}

export async function sendAttachmentURL(threadId: string, url: string, mimeType: string, fileName: string, friendlyName: string) {
  console.log(TAG, 'sendAttachmentURL', { threadId, url, mimeType, fileName, friendlyName });
  await Native.threadsSendAttachmentURL(threadId, url, mimeType, fileName, friendlyName);
}

export async function sendAttachmentBase64(threadId: string, base64: string, mimeType: string, fileName: string, friendlyName: string) {
  console.log(TAG, 'sendAttachmentBase64', { threadId, mimeType, fileName, friendlyName });
  await Native.threadsSendAttachmentBase64(threadId, base64, mimeType, fileName, friendlyName);
}

export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  console.log(TAG, 'getMessages', threadId);
  const list = await Native.threadsGetMessages(threadId);
  return list as ChatMessage[];
}
