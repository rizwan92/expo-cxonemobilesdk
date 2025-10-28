import Native from "../ExpoCxonemobilesdkModule";
import type {
  ChatThreadDetails,
  ChatMessagesPage,
  OutboundMessage,
} from "../types";

const TAG = "[CXone/Threads]";

export function get(): ChatThreadDetails[] {
  const details = (Native as any).threadsGet() as ChatThreadDetails[];
  console.log(
    TAG,
    "get ->",
    details?.map?.((d) => d.id)
  );
  return details;
}

// Limited variants removed at native layer

export async function create(
  customFields?: Record<string, string>
): Promise<ChatThreadDetails> {
  console.log(TAG, "create", customFields ?? "(no custom fields)");
  try {
    const details = await Native.threadsCreate(customFields);
    console.log(TAG, "create ->", details);
    return details as ChatThreadDetails;
  } catch (e) {
    console.error(TAG, "create failed", e);
    throw e;
  }
}

export async function load(threadId?: string) {
  console.log(TAG, "load", threadId);
  await Native.threadsLoad(threadId);
}

export async function send(threadId: string, message: OutboundMessage) {
  console.log(TAG, "send", {
    threadId,
    hasAttachments: !!message.attachments?.length,
    hasPostback: !!message.postback,
  });
  await (Native as any).threadsSend(threadId, message);
}

export async function loadMore(threadId: string) {
  console.log(TAG, "loadMore", threadId);
  await Native.threadsLoadMore(threadId);
}

export async function markRead(threadId: string) {
  console.log(TAG, "markRead", threadId);
  await Native.threadsMarkRead(threadId);
}

export async function updateName(threadId: string, name: string) {
  console.log(TAG, "updateName", { threadId, name });
  await Native.threadsUpdateName(threadId, name);
}

export async function archive(threadId: string) {
  console.log(TAG, "archive", threadId);
  await Native.threadsArchive(threadId);
}

export async function endContact(threadId: string) {
  console.log(TAG, "endContact", threadId);
  await Native.threadsEndContact(threadId);
}

export async function reportTypingStart(threadId: string, didStart: boolean) {
  console.log(TAG, "reportTypingStart", { threadId, didStart });
  await (Native as any).threadsReportTypingStart(threadId, didStart);
}

export async function sendAttachmentURL(
  threadId: string,
  url: string,
  mimeType: string,
  fileName: string,
  friendlyName: string
) {
  console.log(TAG, "sendAttachmentURL", {
    threadId,
    url,
    mimeType,
    fileName,
    friendlyName,
  });
  await Native.threadsSendAttachmentURL(
    threadId,
    url,
    mimeType,
    fileName,
    friendlyName
  );
}

export async function sendAttachmentBase64(
  threadId: string,
  base64: string,
  mimeType: string,
  fileName: string,
  friendlyName: string
) {
  console.log(TAG, "sendAttachmentBase64", {
    threadId,
    mimeType,
    fileName,
    friendlyName,
  });
  await Native.threadsSendAttachmentBase64(
    threadId,
    base64,
    mimeType,
    fileName,
    friendlyName
  );
}

export async function getMessages(
  threadId: string,
  scrollToken?: string,
  limit?: number
): Promise<ChatMessagesPage> {
  console.log(TAG, "getMessages", { threadId, scrollToken, limit });
  const page = await (Native as any).threadsGetMessages(
    threadId,
    scrollToken,
    limit
  );
  return page as ChatMessagesPage;
}

// Limited variants removed at native layer

export function getDetails(threadId: string): ChatThreadDetails {
  const d = Native.threadsGetDetails(threadId);
  console.log(TAG, "getDetails ->", d);
  return d;
}
// messagesPage removed; use getMessages(threadId, scrollToken?)
// Limited variants removed at native layer

// Full details are returned by getDetails/listDetails now
