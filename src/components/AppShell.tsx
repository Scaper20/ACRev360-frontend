import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./Button";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="app-shell-main">
        <header className="topbar">
          <button
            className="menu-toggle"
            aria-label="Toggle menu"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            ☰
          </button>
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
