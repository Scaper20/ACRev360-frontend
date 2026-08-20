import { apiClient, errorMessage } from './client';
import { authStore } from './auth-store';
import type { components } from './generated/schema';

export type Me = components['schemas']['Me'];

/** Authenticates and returns the resulting identity. Deliberately role-
 * agnostic — which access_level a given app accepts differs (the portal
 * rejects AGENT, the field app requires it), so that gate lives in each
 * app's own AuthContext, not here. Callers that reject the returned role
 * should call authStore.clear() themselves before surfacing the error, same
 * as any other post-login validation failure. */
export async function login(username: string, password: string): Promise<Me> {
  const { data, error } = await apiClient.POST('/api/v1/auth/login', {
    body: { username, password },
  });
  if (error) throw new Error(errorMessage(error));
  authStore.setTokens(data.access, data.refresh);
  return me();
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
