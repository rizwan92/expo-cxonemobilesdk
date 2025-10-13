import Native from '../ExpoCxonemobilesdkModule';

const TAG = '[CXone/Customer]';

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

export function getVisitorId() {
  const id = Native.getVisitorId();
  console.log(TAG, 'getVisitorId ->', id);
  return id;
}

