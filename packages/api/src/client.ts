import createClient from 'openapi-fetch';
import type { Middleware } from 'openapi-fetch';
import type { paths } from './generated/schema';
import { authStore } from './auth-store';

const env = (import.meta as unknown as { env?: Record<string, string | boolean> }).env ?? {};

/**
 * Explicit VITE_API_BASE_URL always wins. Otherwise: in dev, default to a
 * relative '' so requests go through Vite's own dev-server proxy (see
 * apps/portal/vite.config.ts) — same-origin from the browser's perspective,
 * so the live backend's CORS_ALLOWED_ORIGINS (which doesn't yet list any
 * frontend origin) never comes into play locally. In a production build
 * there's no dev proxy, so it falls back to the real backend URL directly —
 * which does require CORS_ALLOWED_ORIGINS on Render to include the actual
 * deployed origin; the proxy is a local-dev convenience, not a substitute
 * for that.
 */
export const API_BASE_URL: string = (env.VITE_API_BASE_URL as string) ?? (env.DEV ? '' : 'https://acrev360-backend.onrender.com');

export const apiClient = createClient<paths>({ baseUrl: API_BASE_URL });

let refreshInFlight: Promise<string | null> | null = null;

/** Refreshes the access token using the stored refresh token. Single-flight:
 * concurrent 401s during the same tick share one refresh call rather than
 * each firing their own. Returns the new access token, or null if the
 * refresh itself was rejected (session is over). */
async function refreshAccessToken(): Promise<string | null> {
  const refresh = authStore.getRefreshToken();
  if (!refresh) return null;
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { access: string };
        authStore.setAccessToken(data.access);
        return data.access;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token = authStore.getAccessToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) return response;
    // /auth/login and /auth/refresh 401ing means bad credentials/expired
    // refresh — not a case to retry, that would loop.
    if (request.url.includes('/auth/login') || request.url.includes('/auth/refresh')) return response;

    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      authStore.clear();
      return response;
    }
    const retryRequest = request.clone();
    retryRequest.headers.set('Authorization', `Bearer ${newAccess}`);
    return fetch(retryRequest);
  },
};

apiClient.use(authMiddleware);

/** Normalises the two error shapes the backend actually returns (see
 * apps/common/exceptions.py): `{"error": "..."}` for framework-level errors,
 * or DRF's field-keyed validation errors (`{"phone": ["This field is
 * required."]}`) left as-is because that's more useful to show inline than
 * flattened — this collapses it to one readable string for places (like a
 * toast) that just need a single message. */
export function errorMessage(error: unknown): string {
  if (error == null) return 'Something went wrong';
  if (typeof error === 'object' && 'error' in error && typeof (error as { error: unknown }).error === 'string') {
    return (error as { error: string }).error;
  }
  if (typeof error === 'object') {
    const entries = Object.entries(error as Record<string, unknown>);
    for (const [field, messages] of entries) {
      if (Array.isArray(messages) && typeof messages[0] === 'string') {
        return field === 'non_field_errors' ? messages[0] : `${field}: ${messages[0]}`;
      }
    }
  }
  return 'Something went wrong';
}
