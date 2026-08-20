import type { ReactNode } from 'react';
import { useState } from 'react';
import './AppShell.css';

export interface NavItem {
  key: string;
  label: string;
  href: string;
  active: boolean;
  onClick: () => void;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface AppShellProps {
  logoInitials: string;
  productName: string;
  tenantLabel: string;
  sections: NavSection[];
  footer?: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  userName: string;
  userRole: string;
  onSignOut: () => void;
  /** When given, the name/avatar block becomes a button opening account
   * management (profile edit, change password) — omit to leave it inert. */
  onProfileClick?: () => void;
  children: ReactNode;
}

/** The app chrome: sidebar (sticky in-flow above 640px, off-canvas drawer
 * below it) + topbar + main content area. Mobile drawer auto-closes on any
 * nav click, matching the original's `go(page)` behavior — desktop is a
 * no-op there since the sidebar isn't `position: fixed` at that width. */
export function AppShell({
  logoInitials,
  productName,
  tenantLabel,
  sections,
  footer,
  pageTitle,
  pageSubtitle,
  userName,
  userRole,
  onSignOut,
  onProfileClick,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // A real href (below) means modifier-clicks (ctrl/cmd/shift/middle-click)
  // fall through to native browser behavior — open in new tab, copy link
  // address, etc. — same as react-router's own <Link>. Only a plain left
  // click is intercepted for client-side navigation.
  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    item.onClick();
    setDrawerOpen(false);
  };

  return (
    <div className="app-shell">
      <div className={['sidebar-backdrop', drawerOpen && 'on'].filter(Boolean).join(' ')} onClick={() => setDrawerOpen(false)} />
      <aside className={['sidebar', drawerOpen && 'open'].filter(Boolean).join(' ')}>
        <div className="sidebar-head">
          <div className="logo">
            <div className="logo-mark">{logoInitials}</div>
            <div>
              <b>{productName}</b>
              <small>{tenantLabel}</small>
            </div>
          </div>
        </div>
        <nav className="nav">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="nav-label">{section.label}</div>
              {section.items.map((item) => (
                <a key={item.key} href={item.href} className={item.active ? 'active' : undefined} onClick={(e) => handleNavClick(e, item)}>
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
        {footer != null && <div className="sidebar-foot">{footer}</div>}
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setDrawerOpen((v) => !v)} aria-label="Open menu">
            ☰
          </button>
          <div>
            <h2>{pageTitle}</h2>
            {pageSubtitle != null && <div className="sub">{pageSubtitle}</div>}
          </div>
          <div className="spacer" />
          {onProfileClick != null ? (
            <button className="who" onClick={onProfileClick} title="Edit profile / change password">
              <div className="avatar">{userName.slice(0, 2).toUpperCase()}</div>
              <div>
                <b>{userName}</b>
                <small>{userRole}</small>
              </div>
            </button>
          ) : (
            <div className="who">
              <div className="avatar">{userName.slice(0, 2).toUpperCase()}</div>
              <div>
                <b>{userName}</b>
                <small>{userRole}</small>
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
            Sign out
          </button>
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
