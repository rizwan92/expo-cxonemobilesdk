import Native from '../ExpoCxonemobilesdkModule';

const TAG = '[CXone/Connection]';

export async function prepare(env: string, brandId: number, channelId: string) {
  console.log(TAG, 'prepare', { env, brandId, channelId });
  await Native.prepare(env, brandId, channelId);
}

export async function connect() {
  console.log(TAG, 'connect');
  await Native.connect();
}

export function disconnect() {
  console.log(TAG, 'disconnect');
  Native.disconnect();
}

export function getChatMode() {
  const mode = Native.getChatMode();
  console.log(TAG, 'getChatMode ->', mode);
  return mode;
}

export async function executeTrigger(triggerId: string) {
  console.log(TAG, 'executeTrigger', triggerId);
  await Native.executeTrigger(triggerId);
}

