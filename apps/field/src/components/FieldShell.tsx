import type { ReactNode } from 'react';
import './FieldShell.css';

export type FieldView = 'worklist' | 'collect' | 'register' | 'status';

const NAV: { key: FieldView; label: string; icon: string }[] = [
  { key: 'worklist', label: 'Worklist', icon: '☰' },
  { key: 'collect', label: 'Collect', icon: '₦' },
  { key: 'register', label: 'Register', icon: '+' },
  { key: 'status', label: 'Status', icon: '◔' },
];

export function FieldShell({
  agentName,
  wardName,
  isOnline,
  queueCount,
  activeView,
  onNavigate,
  onSignOut,
  onProfileClick,
  children,
}: {
  agentName: string;
  wardName: string | null;
  isOnline: boolean;
  queueCount: number;
  activeView: FieldView;
  onNavigate: (view: FieldView) => void;
  onSignOut: () => void;
  /** When given, the avatar/name block becomes a button opening account
   * management (profile edit, change password) — omit to leave it inert. */
  onProfileClick?: () => void;
  children: ReactNode;
}) {
  const who = (
    <>
      <div className="field-avatar">{agentName.slice(0, 2).toUpperCase()}</div>
      <div>
        <b>{agentName}</b>
        <small>{wardName ?? 'No ward assigned'}</small>
      </div>
    </>
  );

  return (
    <div className="field-shell">
      <header className="field-header">
        {onProfileClick ? (
          <button className="field-header-who" onClick={onProfileClick} title="Edit profile / change password">
            {who}
          </button>
        ) : (
          <div className="field-header-who">{who}</div>
        )}
        <div className={`field-online-badge ${isOnline ? 'on' : 'off'}`}>{isOnline ? 'Online' : 'Offline'}</div>
        <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
          Sign out
        </button>
      </header>

      {queueCount > 0 && (
        <button className="field-queue-bar" onClick={() => onNavigate('status')}>
          {queueCount} record{queueCount === 1 ? '' : 's'} queued — {isOnline ? 'tap to sync' : 'will sync when online'}
        </button>
      )}

      <main className="field-page">{children}</main>

      <nav className="field-bottom-nav">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={item.key === activeView ? 'active' : undefined}
            onClick={() => onNavigate(item.key)}
            type="button"
          >
            <span className="field-nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
