import Native from '../ExpoCxonemobilesdkModule';

const TAG = '[CXone/Customer]';

export const EVENTS = {
  AUTHORIZATION_CHANGED: 'authorizationChanged' as const,
  CUSTOM_FIELDS_SET: 'customerCustomFieldsSet' as const,
};

export function setName(firstName: string, lastName: string) {
  console.log(TAG, 'setName', { firstName, lastName });
  Native.setCustomerName(firstName, lastName);
}

export function setIdentity(id: string, firstName?: string, lastName?: string) {
  console.log(TAG, 'setIdentity', { id, firstName, lastName });
  Native.setCustomerIdentity(id, firstName, lastName);
}

export function clearIdentity() {
  console.log(TAG, 'clearIdentity');
  Native.clearCustomerIdentity();
}

export function setDeviceToken(token: string) {
  console.log(TAG, 'setDeviceToken');
  Native.setDeviceToken(token);
}

export function setAuthorizationCode(code: string) {
  console.log(TAG, 'setAuthorizationCode');
  Native.setAuthorizationCode(code);
}

export function setCodeVerifier(verifier: string) {
  console.log(TAG, 'setCodeVerifier');
  Native.setCodeVerifier(verifier);
}

export function getCustomFields() {
  const fields = (Native as any).customerCustomFieldsGet?.() ?? {};
  console.log(TAG, 'getCustomFields ->', fields);
  return fields as Record<string, string>;
}

export async function setCustomFields(fields: Record<string, string>) {
  console.log(TAG, 'setCustomFields', fields);
  await (Native as any).customerCustomFieldsSet?.(fields);
}

export function getVisitorId() {
  const id = Native.getVisitorId();
  console.log(TAG, 'getVisitorId ->', id);
  return id;
}

export function getIdentity() {
  const ident = (Native as any).getCustomerIdentity?.();
  console.log(TAG, 'getIdentity ->', ident);
  return ident as { id: string; firstName?: string | null; lastName?: string | null } | null;
}
