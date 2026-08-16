import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { getTokens, setTokens, subscribeToTokens } from "./tokenStore";
import type { components } from "../api/schema";

type Me = components["schemas"]["Me"];

interface AuthContextValue {
  user: Me | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    if (!getTokens()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const { data, error: meError } = await api.GET("/api/v1/auth/me");
    if (meError || !data) {
      setUser(null);
    } else {
      setUser(data as Me);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMe();
    return subscribeToTokens((tokens) => {
      if (!tokens) setUser(null);
    });
  }, [loadMe]);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const { data, error: loginError } = await api.POST("/api/v1/auth/login", {
        body: { username, password },
      });
      if (loginError || !data) {
        setError("Incorrect username or password.");
        return false;
      }
      setTokens({ access: data.access, refresh: data.refresh });
      await loadMe();
      return true;
    } catch {
      // fetch itself threw — network failure, CORS block, backend unreachable, etc.
      setError("Could not reach the server. Check your connection and try again.");
      return false;
    }
  }, [loadMe]);

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
