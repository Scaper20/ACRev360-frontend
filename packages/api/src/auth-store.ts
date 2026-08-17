/**
 * Access token: in-memory only (a page reload loses it, which is intentional
 * — see V2_FRONTEND.md's auth-storage decision).
 * Refresh token: sessionStorage — survives a reload within the tab, clears
 * on tab close. Matches the old prototype portal's own pattern
 * (`sessionStorage.setItem('revac_portal', ...)`).
 */
const REFRESH_KEY = 'acrev360_refresh';

let accessToken: string | null = null;
const listeners = new Set<() => void>();

export const authStore = {
  getAccessToken(): string | null {
    return accessToken;
  },
  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY);
  },
  setTokens(access: string, refresh: string): void {
    accessToken = access;
    sessionStorage.setItem(REFRESH_KEY, refresh);
  },
  setAccessToken(access: string): void {
    accessToken = access;
  },
  clear(): void {
    accessToken = null;
    sessionStorage.removeItem(REFRESH_KEY);
    listeners.forEach((fn) => fn());
  },
  /** Called when the refresh token itself is rejected — the session is over,
   * not just the access token expired. The app should redirect to login. */
  onSessionExpired(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
