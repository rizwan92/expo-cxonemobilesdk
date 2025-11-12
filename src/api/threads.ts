import Native from '../ExpoCxonemobilesdkModule';
import type { ChatThreadDetails, PreChatSurvey } from '../types';

const TAG = '[CXone/Threads]';

export const EVENTS = {
  UPDATED: 'threadsUpdated' as const,
};

export function get(): ChatThreadDetails[] {
  const details = Native.threadsGet() as ChatThreadDetails[];
  console.log(TAG, 'get ->', details.map((d) => d.id));
  return details;
}

export async function getPreChatSurvey(): Promise<PreChatSurvey | null> {
  console.log(TAG, 'preChatSurvey');
  const survey = await Native.threadsGetPreChatSurvey();
  return (survey ?? null) as PreChatSurvey | null;
}

export async function load(threadId?: string) {
  console.log(TAG, 'load', threadId ?? '(all)');
  await (Native as any).threadsLoad(threadId ?? null);
}

export async function create(customFields?: Record<string, string>): Promise<ChatThreadDetails> {
  console.log(TAG, 'create', customFields ?? '(no custom fields)');
  try {
    const details = (await Native.threadsCreate(customFields)) as ChatThreadDetails;
    console.log(TAG, 'create -> id', details.id);
    return details;
  } catch (e) {
    console.error(TAG, 'create failed', e);
    throw e;
  }
}
