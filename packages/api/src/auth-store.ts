/**
 * Access token: in-memory only (a page reload loses it, which is intentional
 * — see V2_FRONTEND.md's auth-storage decision).
 * Refresh token: sessionStorage by default — survives a reload within the
 * tab, clears on tab close. Matches the old prototype portal's own pattern
 * (`sessionStorage.setItem('revac_portal', ...)`).
 *
 * The backing storage is swappable via configureAuthStorage() — the field
 * agent app calls this with localStorage before anything else runs, since
 * an installed PWA can be backgrounded/killed by the OS and needs the
 * refresh token to survive that, not just a same-tab reload. Portal never
 * calls it, so its behavior is unchanged.
 */
const REFRESH_KEY = 'acrev360_refresh';

// Not resolved to sessionStorage until first actual use (not at module
// load) — client.test.ts imports this module transitively via client.ts
// without ever touching storage, and vitest's default (non-jsdom)
// environment has no sessionStorage global at all. Referencing it eagerly
// here broke that import merely by existing.
let explicitStorage: Storage | null = null;
function storage(): Storage {
  return explicitStorage ?? sessionStorage;
}
let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function configureAuthStorage(storage: Storage): void {
  explicitStorage = storage;
}

export const authStore = {
  getAccessToken(): string | null {
    return accessToken;
  },
  getRefreshToken(): string | null {
    return storage().getItem(REFRESH_KEY);
  },
  setTokens(access: string, refresh: string): void {
    accessToken = access;
    storage().setItem(REFRESH_KEY, refresh);
  },
  setAccessToken(access: string): void {
    accessToken = access;
  },
  clear(): void {
    accessToken = null;
    storage().removeItem(REFRESH_KEY);
    listeners.forEach((fn) => fn());
  },
  /** Called when the refresh token itself is rejected — the session is over,
   * not just the access token expired. The app should redirect to login. */
  onSessionExpired(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
