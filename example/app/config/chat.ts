// Reads credentials from Expo public environment variables.
// Create `example/.env` and define:
//   EXPO_PUBLIC_CHAT_ENV=YOUR_ENV_CODE
//   EXPO_PUBLIC_CHAT_BRAND_ID=YOUR_BRAND_ID
//   EXPO_PUBLIC_CHAT_CHANNEL_ID=YOUR_CHANNEL_ID

function getEnv(name: string): string {
  // Expo inlines EXPO_PUBLIC_* variables at build time
  const v = process.env[name];
  if (!v) {
    console.warn(`[ChatAppConfig] Missing ${name} in example/.env`);
  }
  return v ?? '';
}

export const CHAT_ENV = getEnv('EXPO_PUBLIC_CHAT_ENV');
export const CHAT_BRAND_ID = Number(getEnv('EXPO_PUBLIC_CHAT_BRAND_ID'));
export const CHAT_CHANNEL_ID = getEnv('EXPO_PUBLIC_CHAT_CHANNEL_ID');
