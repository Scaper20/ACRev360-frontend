import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function stubSessionStorage() {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
}

describe('authStore', () => {
  beforeEach(() => {
    vi.resetModules();
    stubSessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has no tokens initially', async () => {
    const { authStore } = await import('./auth-store');
    expect(authStore.getAccessToken()).toBeNull();
    expect(authStore.getRefreshToken()).toBeNull();
  });

  it('setTokens stores the access token in memory and the refresh token in sessionStorage', async () => {
    const { authStore } = await import('./auth-store');
    authStore.setTokens('acc-1', 'ref-1');
    expect(authStore.getAccessToken()).toBe('acc-1');
    expect(authStore.getRefreshToken()).toBe('ref-1');
    expect(sessionStorage.getItem('acrev360_refresh')).toBe('ref-1');
  });

  it('setAccessToken updates only the access token, leaving refresh untouched', async () => {
    const { authStore } = await import('./auth-store');
    authStore.setTokens('acc-1', 'ref-1');
    authStore.setAccessToken('acc-2');
    expect(authStore.getAccessToken()).toBe('acc-2');
    expect(authStore.getRefreshToken()).toBe('ref-1');
  });

  it('clear wipes both tokens and notifies listeners', async () => {
    const { authStore } = await import('./auth-store');
    authStore.setTokens('acc-1', 'ref-1');
    const listener = vi.fn();
    authStore.onSessionExpired(listener);
    authStore.clear();
    expect(authStore.getAccessToken()).toBeNull();
    expect(authStore.getRefreshToken()).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('onSessionExpired returns an unsubscribe function', async () => {
    const { authStore } = await import('./auth-store');
    const listener = vi.fn();
    const unsubscribe = authStore.onSessionExpired(listener);
    unsubscribe();
    authStore.clear();
    expect(listener).not.toHaveBeenCalled();
  });
});
