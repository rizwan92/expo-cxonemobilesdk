import Native from '../ExpoCxonemobilesdkModule';

const TAG = '[CXone/CustomFields]';

export function getCustomer(): Record<string, string> {
  const fields = Native.customerCustomFieldsGet();
  console.log(TAG, 'getCustomer ->', fields);
  return fields;
}

export async function setCustomer(fields: Record<string, string>) {
  console.log(TAG, 'setCustomer', fields);
  await Native.customerCustomFieldsSet(fields);
}

export function getThread(threadId: string): Record<string, string> {
  const fields = Native.threadCustomFieldsGet(threadId);
  console.log(TAG, 'getThread ->', fields);
  return fields;
}

export async function setThread(threadId: string, fields: Record<string, string>) {
  console.log(TAG, 'setThread', { threadId, fields });
  await Native.threadCustomFieldsSet(threadId, fields);
}

