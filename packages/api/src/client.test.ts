import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { errorMessage } from './client';

describe('errorMessage', () => {
  it('falls back to a generic message for null/undefined', () => {
    expect(errorMessage(null)).toBe('Something went wrong');
    expect(errorMessage(undefined)).toBe('Something went wrong');
  });

  it('reads the framework-level {"error": "..."} shape', () => {
    expect(errorMessage({ error: 'Invalid credentials' })).toBe('Invalid credentials');
  });

  it('reads a DRF field-keyed validation error, prefixed with the field name', () => {
    expect(errorMessage({ phone: ['This field is required.'] })).toBe('phone: This field is required.');
  });

  it('drops the field prefix specifically for non_field_errors', () => {
    expect(errorMessage({ non_field_errors: ['Bill is not payable.'] })).toBe('Bill is not payable.');
  });

  it('falls back to a generic message when nothing matches either shape', () => {
    expect(errorMessage({})).toBe('Something went wrong');
    expect(errorMessage('a plain string')).toBe('Something went wrong');
  });
});

function stubSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
}

// Regression test for a real bug found during live testing: the backend
// rotates refresh tokens on every use and blacklists the spent one (see
// TokenRefresh in the generated schema). The refresh-on-401 middleware used
// to only persist the new access token and silently discard the rotated
// refresh token, so every session survived exactly one silent refresh and
// then died on the next one — reproduced live as a 401 on the second
// consecutive /auth/refresh call. Fixed in client.ts by calling
// authStore.setTokens(access, refresh) instead of setAccessToken(access).
describe('refresh-on-401 middleware', () => {
  beforeEach(() => {
    vi.resetModules();
    stubSessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('persists the rotated refresh token from /auth/refresh, not just the new access token', async () => {
    let meCallCount = 0;
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = input instanceof Request ? input : new Request(input, init);
      if (req.url.includes('/auth/refresh')) {
        return new Response(JSON.stringify({ access: 'new-access', refresh: 'new-refresh' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (req.url.includes('/auth/me')) {
        meCallCount += 1;
        if (meCallCount === 1) {
          return new Response(JSON.stringify({ error: 'Token expired' }), { status: 401 });
        }
        return new Response(JSON.stringify({ username: 'admin' }), { status: 200 });
      }
      throw new Error(`unexpected fetch to ${req.url}`);
    });
    vi.stubGlobal('fetch', mockFetch);

    const { authStore } = await import('./auth-store');
    authStore.setTokens('old-access', 'old-refresh');

    const { apiClient } = await import('./client');
    const { data } = await apiClient.GET('/api/v1/auth/me');

    expect(data).toEqual({ username: 'admin' });
    expect(meCallCount).toBe(2); // first 401, then a retry that succeeds
    expect(authStore.getAccessToken()).toBe('new-access');
    expect(authStore.getRefreshToken()).toBe('new-refresh'); // the actual regression
  });

  it('clears the session when the refresh token itself is rejected', async () => {
    const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = input instanceof Request ? input : new Request(input, init);
      if (req.url.includes('/auth/refresh')) {
        return new Response(JSON.stringify({ error: 'Token is invalid or expired' }), { status: 401 });
      }
      if (req.url.includes('/auth/me')) {
        return new Response(JSON.stringify({ error: 'Token expired' }), { status: 401 });
      }
      throw new Error(`unexpected fetch to ${req.url}`);
    });
    vi.stubGlobal('fetch', mockFetch);

    const { authStore } = await import('./auth-store');
    authStore.setTokens('old-access', 'dead-refresh');

    const { apiClient } = await import('./client');
    await apiClient.GET('/api/v1/auth/me');

    expect(authStore.getAccessToken()).toBeNull();
    expect(authStore.getRefreshToken()).toBeNull();
  });
});
