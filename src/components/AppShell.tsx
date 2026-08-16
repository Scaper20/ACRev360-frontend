import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./Button";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell-main">
        <header className="topbar">
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
    </div>
  );
}
