import { apiClient, errorMessage } from './client';
import { authStore } from './auth-store';
import type { components } from './generated/schema';

export type Me = components['schemas']['Me'];

export async function login(username: string, password: string): Promise<Me> {
  const { data, error } = await apiClient.POST('/api/v1/auth/login', {
    body: { username, password },
  });
  if (error) throw new Error(errorMessage(error));
  authStore.setTokens(data.access, data.refresh);
  const user = await me();
  if (user.access_level === 'AGENT') {
    authStore.clear();
    throw new Error('Field agent accounts use the mobile app, not this portal — ask your consultant or council admin for the mobile app link.');
  }
  return user;
}

export async function logout(): Promise<void> {
  const refresh = authStore.getRefreshToken();
  try {
    if (refresh) {
      await apiClient.POST('/api/v1/auth/logout', { body: { refresh } });
    }
  } finally {
    authStore.clear();
  }
}

export async function me(): Promise<Me> {
  const { data, error } = await apiClient.GET('/api/v1/auth/me');
  if (error) throw new Error(errorMessage(error));
  return data;
}

/** access_level as returned by /auth/me — mirrors the backend's four roles
 * (see V2_ARCHITECTURE.md §8). Field agents don't use this frontend. */
export type AccessLevel = 'COUNCIL_ADMIN' | 'CONSULTANT' | 'AGENT' | 'GLOBAL_VIEW';
