import type { Me } from '@acrev360/api';
import { authStore, login as apiLogin, logout as apiLogout, me as apiMe } from '@acrev360/api';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextValue {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      async login(email, password) {
        const me = await apiLogin(email, password);
        // login() itself is role-agnostic (see packages/api/src/auth.ts) —
        // this app is for ratepayer/proxy accounts only, the same pattern
        // apps/field uses to reject non-AGENT logins at its own call site.
        if (me.access_level !== 'RATEPAYER' && me.access_level !== 'RATEPAYER_PROXY') {
          authStore.clear();
          throw new Error('This account does not have ratepayer portal access — use the staff portal instead.');
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
