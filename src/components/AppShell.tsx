import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./Button";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="wordmark display">ACRev360</span>
        {user && (
          <div className="who">
            <span>
              {user.full_name} · {user.role_name || user.access_level}
              {user.council_code ? ` · ${user.council_code}` : ""}
            </span>
            <Button variant="ghost" onClick={logout}>
              Sign out
            </Button>
          </div>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
