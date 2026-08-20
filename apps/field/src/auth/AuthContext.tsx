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
    // The refresh token lives in localStorage here (see main.tsx's
    // configureAuthStorage call), not sessionStorage like the portal — an
    // installed PWA can be backgrounded/killed by the OS well before the
    // 7-day refresh token itself expires, and that shouldn't sign the agent
    // out of a session they never actually ended.
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
        // login() itself is role-agnostic (see packages/api/src/auth.ts) —
        // this app is for field agents only, the inverse of the portal's
        // own rule at its own call site.
        if (me.access_level !== 'AGENT') {
          authStore.clear();
          throw new Error('This app is for field agent accounts only — use the web portal instead.');
        }
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
