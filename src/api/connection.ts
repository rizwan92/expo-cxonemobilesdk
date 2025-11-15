import Native from '../ExpoCxonemobilesdkModule';
import type { ChannelConfiguration, LoggerLevel, LoggerVerbosity } from '../types';

const TAG = '[CXone/Connection]';

export const EVENTS = {
  CHAT_UPDATED: 'chatUpdated' as const,
  CONNECTION_ERROR: 'connectionError' as const,
  ERROR: 'error' as const,
  UNEXPECTED_DISCONNECT: 'unexpectedDisconnect' as const,
  TOKEN_REFRESH_FAILED: 'tokenRefreshFailed' as const,
  CUSTOM_EVENT_MESSAGE: 'customEventMessage' as const,
  PROACTIVE_POPUP: 'proactivePopupAction' as const,
};

// Unified entrypoint: preflight (best-effort) + prepare + connect
export async function prepareAndConnect(env: string, brandId: number, channelId: string) {
  console.log(TAG, 'prepareAndConnect', { env, brandId, channelId });
  await (Native as any).prepareAndConnect(env, brandId, channelId);
}

// Optional URL-based combined variant (when native exposes it)
export async function prepareAndConnectWithURLs(
  chatURL: string,
  socketURL: string,
  brandId: number,
  channelId: string,
) {
  console.log(TAG, 'prepareAndConnectWithURLs', { chatURL, socketURL, brandId, channelId });
  const fn = (Native as any).prepareAndConnectWithURLs;
  if (typeof fn !== 'function') {
    throw new Error('prepareAndConnectWithURLs is not supported on this platform');
  }
  await fn(chatURL, socketURL, brandId, channelId);
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

export function configureLogger(
  level: LoggerLevel = 'info',
  verbosity: LoggerVerbosity = 'simple',
) {
  console.log(TAG, 'configureLogger', { level, verbosity });
  (Native as any).configureLogger?.(level, verbosity);
}
