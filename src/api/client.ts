import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { getTokens, setTokens } from "../auth/tokenStore";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = createClient<paths>({ baseUrl: API_BASE_URL });

const AUTH_PATHS = ["/api/v1/auth/login", "/api/v1/auth/refresh"];

function isAuthRequest(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: tokens.refresh }),
        });
        if (!response.ok) {
          setTokens(null);
          return null;
        }
        const data = (await response.json()) as { access: string; refresh?: string };
        const next = { access: data.access, refresh: data.refresh ?? tokens.refresh };
        setTokens(next);
        return next.access;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

api.use({
  onRequest({ request }) {
    const tokens = getTokens();
    if (tokens?.access && !isAuthRequest(request.url)) {
      request.headers.set("Authorization", `Bearer ${tokens.access}`);
    }
    return request;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401 || isAuthRequest(request.url)) {
      return response;
    }

    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      return response; // no refresh available — let the 401 propagate
    }

    const retried = request.clone();
    retried.headers.set("Authorization", `Bearer ${newAccess}`);
    return fetch(retried);
  },
});
