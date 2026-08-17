import type { Me } from '@acrev360/api';
import { authStore, login as apiLogin, logout as apiLogout, me as apiMe } from '@acrev360/api';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextValue {
  user: Me | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A refresh token in sessionStorage means there's a session to resume —
    // access token is in memory only, so it's already gone after a reload;
    // the auth-store's refresh flow (see client.ts) will re-mint one on the
    // first API call this makes.
    if (!authStore.getRefreshToken()) {
      setLoading(false);
      return;
    }
    apiMe()
      .then(setUser)
      .catch(() => authStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => authStore.onSessionExpired(() => setUser(null)), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(username, password) {
        const me = await apiLogin(username, password);
        setUser(me);
      },
      async logout() {
        await apiLogout();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() must be used within an <AuthProvider>');
  return ctx;
}
