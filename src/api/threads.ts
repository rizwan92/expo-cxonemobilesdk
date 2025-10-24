import Native from '../ExpoCxonemobilesdkModule';
import type { ChatMessage, ChatThreadDetails } from '../types';

const TAG = '[CXone/Threads]';

export function list(): string[] {
  const ids = Native.threadsList();
  console.log(TAG, 'list ->', ids);
  return ids;
}

export function listDetails(): ChatThreadDetails[] {
  const details = Native.threadsListDetails();
  console.log(TAG, 'listDetails ->', details);
  return details;
}

export function listDetailsLimited(limit: number): ChatThreadDetails[] {
  const details = Native.threadsListDetailsLimited(limit);
  console.log(TAG, 'listDetailsLimited ->', details.length, 'limit', limit);
  return details;
}

export async function create(customFields?: Record<string, string>): Promise<ChatThreadDetails> {
  console.log(TAG, 'create', customFields ?? '(no custom fields)');
  try {
    const details = await Native.threadsCreate(customFields);
    console.log(TAG, 'create ->', details);
    return details as ChatThreadDetails;
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

export async function getMessagesLimited(threadId: string, limit: number): Promise<ChatMessage[]> {
  console.log(TAG, 'getMessagesLimited', threadId, 'limit', limit);
  const list = await Native.threadsGetMessagesLimited(threadId, limit);
  return list as ChatMessage[];
}

export function getDetails(threadId: string): ChatThreadDetails {
  const d = Native.threadsGetDetails(threadId);
  console.log(TAG, 'getDetails ->', d);
  return d;
}

export async function ensureMessages(threadId: string, minCount: number): Promise<ChatMessage[]> {
  console.log(TAG, 'ensureMessages', threadId, 'minCount', minCount);
  const list = await Native.threadsEnsureMessages(threadId, minCount);
  return list as ChatMessage[];
}

export function getDetailsLimited(threadId: string, limit: number): ChatThreadDetails {
  const d = Native.threadsGetDetailsLimited(threadId, limit);
  console.log(TAG, 'getDetailsLimited ->', threadId, 'limit', limit);
  return d;
}

// Full details are returned by getDetails/listDetails now
