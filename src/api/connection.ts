import Native from '../ExpoCxonemobilesdkModule';
import type { ChannelConfiguration } from '../types';

const TAG = '[CXone/Connection]';

export async function prepare(env: string, brandId: number, channelId: string) {
  console.log(TAG, 'prepare', { env, brandId, channelId });
  await Native.prepare(env, brandId, channelId);
}

export async function prepareWithURLs(
  chatURL: string,
  socketURL: string,
  brandId: number,
  channelId: string,
) {
  console.log(TAG, 'prepareWithURLs', { chatURL, socketURL, brandId, channelId });
  await (Native as any).prepareWithURLs(chatURL, socketURL, brandId, channelId);
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

export function getChatState() {
  const state = Native.getChatState();
  console.log(TAG, 'getChatState ->', state);
  return state;
}

export function isConnected() {
  const connected = Native.isConnected();
  console.log(TAG, 'isConnected ->', connected);
  return connected;
}

export async function executeTrigger(triggerId: string) {
  console.log(TAG, 'executeTrigger', triggerId);
  await Native.executeTrigger(triggerId);
}

export async function getChannelConfiguration(
  env: string,
  brandId: number,
  channelId: string,
): Promise<ChannelConfiguration> {
  console.log(TAG, 'getChannelConfiguration', { env, brandId, channelId });
  const cfg = await (Native as any).getChannelConfiguration(env, brandId, channelId);
  return cfg as ChannelConfiguration;
}

export async function getChannelConfigurationByURL(
  chatURL: string,
  brandId: number,
  channelId: string,
): Promise<ChannelConfiguration> {
  console.log(TAG, 'getChannelConfigurationByURL', { chatURL, brandId, channelId });
  const cfg = await (Native as any).getChannelConfigurationByURL(chatURL, brandId, channelId);
  return cfg as ChannelConfiguration;
}

export function signOut() {
  console.log(TAG, 'signOut');
  Native.signOut();
}
