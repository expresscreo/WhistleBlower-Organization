import { getServiceSupabase, jsonError, readJson } from '../track/_utils';

const VALID_PUBLIC_PREFERENCES = ['wanted', 'bounties', 'news', 'safety'];

export function normalizeExpoPushToken(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function isValidExpoPushToken(token) {
  return /^ExponentPushToken\[[^\]]+\]$/.test(token) || /^ExpoPushToken\[[^\]]+\]$/.test(token);
}

export function normalizePreferences(value = {}) {
  const preferences = {};
  for (const key of VALID_PUBLIC_PREFERENCES) {
    preferences[key] = value?.[key] !== false;
  }
  return preferences;
}

export async function readPushBody(request) {
  const body = await readJson(request);
  const expoPushToken = normalizeExpoPushToken(body?.expoPushToken);
  if (!isValidExpoPushToken(expoPushToken)) {
    return { error: jsonError('A valid Expo push token is required.') };
  }
  return { body, expoPushToken, service: getServiceSupabase() };
}
